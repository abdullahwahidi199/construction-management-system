from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.db.models import Q, Sum
from datetime import datetime

from .models import Employee, Payroll
from .serializers import (
    EmployeeSerializer,
    EmployeeListSerializer,
    PayrollSerializer,
    PayrollListSerializer,
    PayrollBulkCreateSerializer,
)


class EmployeeViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing Employee CRUD operations.
    
    list: Get all employees with optional filtering
    retrieve: Get a specific employee by ID
    create: Create a new employee
    update: Fully update an employee
    partial_update: Partially update an employee
    destroy: Delete an employee
    """
    queryset = Employee.objects.all()
    # permission_classes = [IsAuthenticated]  # Add authentication if needed

    def get_serializer_class(self):
        if self.action == 'list':
            return EmployeeListSerializer
        return EmployeeSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filtering options
        search = self.request.query_params.get('search', None)
        department = self.request.query_params.get('department', None)
        employment_type = self.request.query_params.get('employment_type', None)
        is_active = self.request.query_params.get('is_active', None)
        
        if search:
            queryset = queryset.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(employee_id__icontains=search) |
                Q(email__icontains=search) |
                Q(position__icontains=search)
            )
        
        if department:
            queryset = queryset.filter(department=department)
        
        if employment_type:
            queryset = queryset.filter(employment_type=employment_type)
        
        if is_active is not None:
            is_active_bool = is_active.lower() == 'true'
            queryset = queryset.filter(is_active=is_active_bool)
        
        return queryset.select_related()

    @action(detail=True, methods=['get'])
    def payroll_history(self, request, pk=None):
        """Get payroll history for a specific employee"""
        employee = self.get_object()
        payrolls = employee.payrolls.all()
        
        # Optional year filtering
        year = request.query_params.get('year', None)
        if year:
            payrolls = payrolls.filter(payroll_period_start__year=year)
        
        page = self.paginate_queryset(payrolls)
        if page is not None:
            serializer = PayrollListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = PayrollListSerializer(payrolls, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def payroll_summary(self, request, pk=None):
        """Get payroll summary for a specific employee"""
        employee = self.get_object()
        year = request.query_params.get('year', datetime.now().year)
        
        payrolls = employee.payrolls.filter(payroll_period_start__year=year)
        summary = payrolls.aggregate(
            total_gross=Sum('gross_pay'),
            total_net=Sum('net_pay'),
            total_overtime=Sum('overtime_amount'),
            total_bonus=Sum('bonus'),
            total_deductions=Sum('deductions'),
            total_tax=Sum('tax_deducted'),
            payroll_count=Count('id')
        )
        
        return Response({
            'employee': {
                'id': employee.id,
                'name': employee.full_name,
                'employee_id': employee.employee_id,
            },
            'year': year,
            'summary': summary
        })

    @action(detail=False, methods=['get'])
    def by_department(self, request):
        """Get employees grouped by department"""
        employees = self.get_queryset()
        departments = {}
        
        for emp in employees:
            dept_key = emp.get_department_display()
            if dept_key not in departments:
                departments[dept_key] = {
                    'count': 0,
                    'active_count': 0,
                    'employees': []
                }
            
            departments[dept_key]['count'] += 1
            if emp.is_active:
                departments[dept_key]['active_count'] += 1
            
            departments[dept_key]['employees'].append({
                'id': emp.id,
                'name': emp.full_name,
                'position': emp.position,
                'is_active': emp.is_active
            })
        
        return Response(departments)


class PayrollViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing Payroll CRUD operations.
    
    Provides standard CRUD operations plus additional actions for
    bulk creation, payment status updates, and reporting.
    """
    queryset = Payroll.objects.all()
    # permission_classes = [IsAuthenticated]  # Add authentication if needed

    def get_serializer_class(self):
        if self.action == 'list':
            return PayrollListSerializer
        elif self.action == 'bulk_create_payroll':
            return PayrollBulkCreateSerializer
        return PayrollSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filtering options
        employee_id = self.request.query_params.get('employee_id', None)
        status = self.request.query_params.get('status', None)
        payment_method = self.request.query_params.get('payment_method', None)
        start_date = self.request.query_params.get('start_date', None)
        end_date = self.request.query_params.get('end_date', None)
        
        if employee_id:
            queryset = queryset.filter(employee_id=employee_id)
        
        if status:
            queryset = queryset.filter(payment_status=status)
        
        if payment_method:
            queryset = queryset.filter(payment_method=payment_method)
        
        if start_date:
            queryset = queryset.filter(payroll_period_start__gte=start_date)
        
        if end_date:
            queryset = queryset.filter(payroll_period_end__lte=end_date)
        
        return queryset.select_related('employee')

    @action(detail=False, methods=['post'])
    @transaction.atomic
    def bulk_create_payroll(self, request):
        """Create payroll records for multiple employees at once"""
        serializer = PayrollBulkCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        data = serializer.validated_data
        created_payrolls = []
        errors = []
        
        for employee_id in data['employee_ids']:
            try:
                employee = Employee.objects.get(id=employee_id, is_active=True)
                
                # Check for duplicate payroll period
                if Payroll.objects.filter(
                    employee=employee,
                    payroll_period_start=data['payroll_period_start'],
                    payroll_period_end=data['payroll_period_end']
                ).exists():
                    errors.append({
                        'employee_id': employee_id,
                        'error': 'Payroll for this period already exists'
                    })
                    continue
                
                # Calculate tax based on percentage
                basic_and_overtime = employee.salary
                tax_deducted = (basic_and_overtime * data['tax_percentage']) / 100
                social_security = (basic_and_overtime * 5) / 100  # Example: 5% SS
                
                payroll = Payroll(
                    employee=employee,
                    payroll_period_start=data['payroll_period_start'],
                    payroll_period_end=data['payroll_period_end'],
                    basic_salary=employee.salary,
                    bonus=data['bonus'],
                    allowances=data['allowances'],
                    deductions=data['deductions'],
                    tax_deducted=tax_deducted,
                    social_security=social_security,
                    payment_method=data['payment_method'],
                    notes=data.get('notes', '')
                )
                
                payroll.calculate_totals()
                payroll.save()
                created_payrolls.append(PayrollListSerializer(payroll).data)
                
            except Employee.DoesNotExist:
                errors.append({
                    'employee_id': employee_id,
                    'error': 'Employee not found or inactive'
                })
        
        return Response({
            'message': f'Created {len(created_payrolls)} payroll records',
            'created_payrolls': created_payrolls,
            'errors': errors
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['patch'])
    def update_payment_status(self, request, pk=None):
        """Update payment status for a specific payroll"""
        payroll = self.get_object()
        
        new_status = request.data.get('payment_status')
        payment_date = request.data.get('payment_date')
        payment_method = request.data.get('payment_method')
        
        if new_status and new_status in dict(Payroll.PAYMENT_STATUS_CHOICES):
            payroll.payment_status = new_status
            
            if new_status == 'paid' and not payment_date:
                payroll.payment_date = datetime.now().date()
        
        if payment_date:
            payroll.payment_date = payment_date
        
        if payment_method:
            payroll.payment_method = payment_method
        
        payroll.save()
        serializer = PayrollSerializer(payroll)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get overall payroll summary"""
        period = request.query_params.get('period', None)
        
        queryset = self.get_queryset()
        
        if period:
            if period == 'monthly':
                # Current month
                queryset = queryset.filter(
                    payroll_period_start__month=datetime.now().month,
                    payroll_period_start__year=datetime.now().year
                )
            elif period == 'yearly':
                queryset = queryset.filter(
                    payroll_period_start__year=datetime.now().year
                )
        
        summary = queryset.aggregate(
            total_gross=Sum('gross_pay'),
            total_net=Sum('net_pay'),
            total_overtime=Sum('overtime_amount'),
            total_bonus=Sum('bonus'),
            total_deductions=Sum('deductions'),
            total_tax=Sum('tax_deducted'),
            total_records=Count('id')
        )
        
        # Add status breakdown
        status_breakdown = queryset.values('payment_status').annotate(
            count=Count('id'),
            total_net=Sum('net_pay')
        )
        
        return Response({
            'summary': summary,
            'status_breakdown': status_breakdown,
            'period': period or 'all_time'
        })

    @action(detail=False, methods=['get'])
    def monthly_report(self, request):
        """Generate monthly payroll report"""
        year = int(request.query_params.get('year', datetime.now().year))
        month = int(request.query_params.get('month', datetime.now().month))
        
        payrolls = self.get_queryset().filter(
            payroll_period_start__year=year,
            payroll_period_start__month=month
        )
        
        report = {
            'year': year,
            'month': month,
            'total_employees': payrolls.count(),
            'total_gross': payrolls.aggregate(total=Sum('gross_pay'))['total'] or 0,
            'total_net': payrolls.aggregate(total=Sum('net_pay'))['total'] or 0,
            'payment_methods': {},
            'department_breakdown': {},
        }
        
        # Payment method breakdown
        for method in dict(Payroll.PAYMENT_METHOD_CHOICES):
            count = payrolls.filter(payment_method=method[0]).count()
            if count > 0:
                report['payment_methods'][method[1]] = count
        
        # Department breakdown
        for payroll in payrolls:
            dept = payroll.employee.get_department_display()
            if dept not in report['department_breakdown']:
                report['department_breakdown'][dept] = {
                    'count': 0,
                    'total_gross': 0,
                    'total_net': 0
                }
            report['department_breakdown'][dept]['count'] += 1
            report['department_breakdown'][dept]['total_gross'] += payroll.gross_pay
            report['department_breakdown'][dept]['total_net'] += payroll.net_pay
        
        return Response(report)
    

# Add to your existing views.py

from .models import Attendance
from .serializers import (
    AttendanceSerializer,
    AttendanceListSerializer,
    BulkAttendanceSerializer,
)
from django.db.models import Count, Q
from datetime import date, timedelta
from decimal import Decimal


class AttendanceViewSet(viewsets.ModelViewSet):
    """
    Attendance management.

    list:    GET /attendance/              — all records (with filters)
    create:  POST /attendance/             — single record
    read:    GET /attendance/{id}/         — one record
    update:  PUT /attendance/{id}/         — full update
    patch:   PATCH /attendance/{id}/       — partial update
    delete:  DELETE /attendance/{id}/      — remove record

    Custom actions:
        POST /attendance/bulk_mark/       — mark attendance for many employees at once
        GET  /attendance/daily/?date=     — get all attendance for a specific date
        GET  /attendance/summary/?employee=&month=&year= — monthly summary
    """
    queryset = Attendance.objects.all()

    def get_serializer_class(self):
        if self.action == 'list':
            return AttendanceListSerializer
        if self.action == 'bulk_mark':
            return BulkAttendanceSerializer
        return AttendanceSerializer

    def get_queryset(self):
        queryset = super().get_queryset()

        # --- Filters ---
        employee_id = self.request.query_params.get('employee', None)
        status = self.request.query_params.get('status', None)
        date_param = self.request.query_params.get('date', None)
        month = self.request.query_params.get('month', None)
        year = self.request.query_params.get('year', None)
        search = self.request.query_params.get('search', None)

        if employee_id:
            queryset = queryset.filter(employee_id=employee_id)

        if status:
            queryset = queryset.filter(status=status)

        if date_param:
            queryset = queryset.filter(date=date_param)

        if month and year:
            queryset = queryset.filter(date__month=month, date__year=year)
        elif year:
            queryset = queryset.filter(date__year=year)

        if search:
            queryset = queryset.filter(
                Q(employee__first_name__icontains=search) |
                Q(employee__last_name__icontains=search) |
                Q(employee__employee_id__icontains=search)
            )

        return queryset.select_related('employee')

    
    
    @action(detail=False, methods=["post"])
    @transaction.atomic
    def bulk_mark(self, request):
        serializer = BulkAttendanceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        attendance_date = data["date"]
        created = []
        updated = []
        errors = []

        for record in data["records"]:
            try:
                employee = Employee.objects.get(id=record["employee"], is_active=True)
            except Employee.DoesNotExist:
                errors.append({
                    "employee": record["employee"],
                    "error": "Employee not found or inactive."
                })
                continue

            defaults = {
                "status": record["status"],
                "check_in": record.get("check_in"),
                "check_out": record.get("check_out"),
                "overtime_hours": record.get("overtime_hours") or 0,
                "note": (record.get("note") or "").strip(),
            }

            obj, was_created = Attendance.objects.update_or_create(
                employee=employee,
                date=attendance_date,
                defaults=defaults,
            )

            entry = AttendanceListSerializer(obj).data

            if was_created:
                created.append(entry)
            else:
                updated.append(entry)

        return Response({
            "date": attendance_date,
            "created_count": len(created),
            "updated_count": len(updated),
            "error_count": len(errors),
            "created": created,
            "updated": updated,
            "errors": errors,
        }, status=status.HTTP_200_OK)

    # ---- Daily View ----
    @action(detail=False, methods=['get'])
    def daily(self, request):
        """
        Get attendance for a specific date.
        Also shows which active employees have NO record (unmarked).

        GET /attendance/daily/?date=2025-01-15
        """
        target_date = request.query_params.get('date', str(date.today()))

        records = Attendance.objects.filter(
            date=target_date
        ).select_related('employee')

        marked_employee_ids = records.values_list('employee_id', flat=True)

        unmarked_employees = Employee.objects.filter(
            is_active=True
        ).exclude(
            id__in=marked_employee_ids
        ).values('id', 'employee_id', 'first_name', 'last_name')

        status_counts = {
            'present': records.filter(status='present').count(),
            'absent': records.filter(status='absent').count(),
            'half_day': records.filter(status='half_day').count(),
            'leave': records.filter(status='leave').count(),
        }

        serializer = AttendanceListSerializer(records, many=True)

        return Response({
            'date': target_date,
            'total_marked': records.count(),
            'total_unmarked': unmarked_employees.count(),
            'status_counts': status_counts,
            'records': serializer.data,
            'unmarked_employees': list(unmarked_employees),
        })

    # ---- Monthly Summary ----
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """
        Monthly attendance summary for one employee.

        GET /attendance/summary/?employee=1&month=1&year=2025
        """
        employee_id = request.query_params.get('employee', None)
        month = request.query_params.get('month', date.today().month)
        year = request.query_params.get('year', date.today().year)

        if not employee_id:
            return Response(
                {"error": "employee query parameter is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            employee = Employee.objects.get(id=employee_id)
        except Employee.DoesNotExist:
            return Response(
                {"error": "Employee not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        records = Attendance.objects.filter(
            employee=employee,
            date__month=month,
            date__year=year
        )

        total_present = records.filter(status='present').count()
        total_absent = records.filter(status='absent').count()
        total_half_day = records.filter(status='half_day').count()
        total_leave = records.filter(status='leave').count()
        total_overtime = records.aggregate(
            total=Sum('overtime_hours')
        )['total'] or Decimal('0')

        # Effective working days: present counts as 1, half_day counts as 0.5
        effective_days = total_present + (total_half_day * Decimal('0.5'))

        return Response({
            'employee': {
                'id': employee.id,
                'employee_id': employee.employee_id,
                'name': employee.full_name,
            },
            'month': int(month),
            'year': int(year),
            'total_records': records.count(),
            'present': total_present,
            'absent': total_absent,
            'half_day': total_half_day,
            'leave': total_leave,
            'overtime_hours': total_overtime,
            'effective_working_days': effective_days,
        })