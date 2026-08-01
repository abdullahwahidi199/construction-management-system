from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.db.models import Count, Q, Sum
from datetime import datetime, date
from decimal import Decimal

from accounts.permissions import RBACPermission
from accounts.services import has_permission
from common.calendar_utils import calendar_month_bounds, calendar_year_bounds, get_module_calendar, parse_calendar_date, to_shamsi
from common.work_calendar import get_work_calendar_service
from .finance import salary_advance_queryset, salary_advance_totals
from .models import Employee, Payroll, PayrollPayment, SalaryAdvance
from .serializers import (
    EmployeeSerializer,
    EmployeeListSerializer,
    PayrollPaymentSerializer,
    PayrollSerializer,
    PayrollListSerializer,
    PayrollBulkCreateSerializer,
    SalaryAdvanceSerializer,
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
    permission_classes = [RBACPermission]
    rbac_resource = "employees"

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
        payrolls = employee.payrolls.prefetch_related("payments", "advance_deduction_records__advance").all()
        
        # Optional year filtering
        year = request.query_params.get('year', None)
        if year:
            start, end = calendar_year_bounds(year, get_module_calendar("payroll", request=request))
            payrolls = payrolls.filter(payroll_period_start__gte=start, payroll_period_start__lte=end)
        
        page = self.paginate_queryset(payrolls)
        if page is not None:
            serializer = PayrollSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = PayrollSerializer(payrolls, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def payroll_summary(self, request, pk=None):
        """Get payroll summary for a specific employee"""
        employee = self.get_object()
        year = request.query_params.get('year', datetime.now().year)
        
        start, end = calendar_year_bounds(year, get_module_calendar("payroll", request=request))
        payrolls = employee.payrolls.filter(payroll_period_start__gte=start, payroll_period_start__lte=end)
        all_payrolls = employee.payrolls.all()
        advances = salary_advance_queryset(employee_id=employee.id)
        year_advances = salary_advance_queryset(
            start=start,
            end=end,
            employee_id=employee.id,
        )
        summary = payrolls.aggregate(
            total_gross=Sum('gross_pay'),
            total_net=Sum('net_pay'),
            total_overtime=Sum('overtime_amount'),
            total_bonus=Sum('bonus'),
            total_deductions=Sum('deductions'),
            total_advance_deductions=Sum('advance_deductions'),
            total_tax=Sum('tax_deducted'),
            payroll_count=Count('id')
        )
        advance_summary = salary_advance_totals(advances)
        year_advance_summary = salary_advance_totals(year_advances)
        last_payroll = all_payrolls.order_by("-payroll_period_end").first()
        
        return Response({
            'employee': {
                'id': employee.id,
                'name': employee.full_name,
                'employee_id': employee.employee_id,
                'current_salary': employee.salary,
            },
            'year': year,
            'summary': {
                **summary,
                'outstanding_advances': advance_summary["outstanding"] or Decimal("0.00"),
                'total_advances_given': advance_summary["total_paid"] or Decimal("0.00"),
                'total_advances_paid_this_year': year_advance_summary["total_paid"] or Decimal("0.00"),
                'total_advances_deducted': all_payrolls.aggregate(total=Sum("advance_deductions"))["total"] or Decimal("0.00"),
                'total_payrolls_processed': all_payrolls.count(),
                'total_amount_paid_this_year': payrolls.aggregate(total=Sum("amount_paid"))["total"] or Decimal("0.00"),
                'total_outstanding_salary_this_year': payrolls.aggregate(total=Sum("balance_due"))["total"] or Decimal("0.00"),
                'last_payroll_date': last_payroll.payroll_period_end if last_payroll else None,
            }
        })

    @action(detail=True, methods=['get'])
    def advance_history(self, request, pk=None):
        employee = self.get_object()
        advances = employee.salary_advances.prefetch_related("payroll_deductions__payroll").all()
        data = SalaryAdvanceSerializer(advances, many=True, context={"request": request}).data
        deductions_by_advance = {}
        for advance in advances:
            deductions_by_advance[advance.id] = [
                {
                    "payroll": deduction.payroll_id,
                    "payroll_period": f"{deduction.payroll.payroll_period_start} to {deduction.payroll.payroll_period_end}",
                    "amount": deduction.amount,
                }
                for deduction in advance.payroll_deductions.select_related("payroll").all()
            ]
        for row in data:
            row["deductions"] = deductions_by_advance.get(row["id"], [])
        return Response(data)

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


class SalaryAdvanceViewSet(viewsets.ModelViewSet):
    queryset = SalaryAdvance.objects.select_related("employee")
    serializer_class = SalaryAdvanceSerializer
    permission_classes = [RBACPermission]
    rbac_resource = "payrolls"

    def get_queryset(self):
        queryset = super().get_queryset()
        employee_id = self.request.query_params.get("employee")
        status_filter = self.request.query_params.get("status")
        if employee_id:
            queryset = queryset.filter(employee_id=employee_id)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        return queryset

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        instance = serializer.save()
        instance.save()

    @action(detail=False, methods=["get"])
    def outstanding(self, request):
        employee_id = request.query_params.get("employee")
        if not employee_id:
            return Response({"employee": "employee query parameter is required."}, status=status.HTTP_400_BAD_REQUEST)
        period_end = request.query_params.get("period_end") or request.query_params.get("payroll_period_end")
        advances = self.get_queryset().filter(
            employee_id=employee_id,
            status="active",
            remaining_balance__gt=0,
        )
        if period_end:
            try:
                advances = advances.filter(
                    date__lte=parse_calendar_date(
                        period_end,
                        get_module_calendar("payroll", request=request),
                    )
                )
            except ValueError as exc:
                return Response({"period_end": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response({
            "advances": SalaryAdvanceSerializer(advances, many=True, context={"request": request}).data,
            "total_outstanding": advances.aggregate(total=Sum("remaining_balance"))["total"] or Decimal("0.00"),
        })


class PayrollViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing Payroll CRUD operations.
    
    Provides standard CRUD operations plus additional actions for
    bulk creation, payment status updates, and reporting.
    """
    queryset = Payroll.objects.select_related("employee").prefetch_related(
        "payments",
        "advance_deduction_records__advance",
    )
    permission_classes = [RBACPermission]
    rbac_resource = "payrolls"

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
        # status = self.request.query_params.get('status', None)
        payment_method = self.request.query_params.get('payment_method', None)
        start_date = self.request.query_params.get('start_date', None)
        end_date = self.request.query_params.get('end_date', None)
        calendar_type = get_module_calendar("payroll", request=self.request)
        
        if employee_id:
            queryset = queryset.filter(employee_id=employee_id)
        
        # if status:
        #     queryset = queryset.filter(payment_status=status)
        
        if payment_method:
            queryset = queryset.filter(payment_method=payment_method)
        
        if start_date:
            start_date = parse_calendar_date(start_date, calendar_type)
            queryset = queryset.filter(payment_date__gte=start_date)

        if end_date:
            end_date = parse_calendar_date(end_date, calendar_type)
            queryset = queryset.filter(payment_date__lte=end_date)
        
        return queryset.select_related('employee').prefetch_related("payments", "advance_deduction_records__advance")

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=['get'])
    def outstanding_advances(self, request):
        employee_id = request.query_params.get("employee")
        if not employee_id:
            return Response({"employee": "employee query parameter is required."}, status=status.HTTP_400_BAD_REQUEST)
        period_end = request.query_params.get("period_end") or request.query_params.get("payroll_period_end")

        advances = SalaryAdvance.objects.select_related("employee").filter(
            employee_id=employee_id,
            status="active",
            remaining_balance__gt=0,
        )
        if period_end:
            try:
                advances = advances.filter(
                    date__lte=parse_calendar_date(
                        period_end,
                        get_module_calendar("payroll", request=request),
                    )
                )
            except ValueError as exc:
                return Response({"period_end": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        advances = advances.order_by("date", "id")
        return Response({
            "advances": SalaryAdvanceSerializer(advances, many=True, context={"request": request}).data,
            "total_outstanding": advances.aggregate(total=Sum("remaining_balance"))["total"] or Decimal("0.00"),
        })

    @action(detail=True, methods=['post'])
    @transaction.atomic
    def record_payment(self, request, pk=None):
        payroll = self.get_object()
        payroll.refresh_payment_totals(save=True)
        serializer = PayrollPaymentSerializer(
            data=request.data,
            context={"request": request, "payroll": payroll},
        )
        serializer.is_valid(raise_exception=True)
        payment = serializer.save()
        return Response(PayrollPaymentSerializer(payment).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'])
    @transaction.atomic
    def bulk_create_payroll(self, request):
        """Create payroll records for multiple employees at once"""
        serializer = PayrollBulkCreateSerializer(data=request.data, context={"request": request})
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
                payroll = Payroll(
                    employee=employee,
                    payroll_period_start=data['payroll_period_start'],
                    payroll_period_end=data['payroll_period_end'],
                    basic_salary=employee.salary,
                    bonus=data['bonus'],
                    allowances=data['allowances'],
                    deductions=data['deductions'],
                    tax_deducted=tax_deducted,
                    payment_method=data['payment_method'],
                    notes=data.get('notes', ''),
                    created_by=request.user,
                )
                
                payroll.calculate_totals()
                payroll.save()
                payroll.refresh_payment_totals(save=True)
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
        """Update payment metadata for a specific payroll."""
        payroll = self.get_object()

        payment_date = request.data.get('payment_date')
        payment_method = request.data.get('payment_method')
        payment_status = request.data.get('payment_status')

        if payment_date:
            payroll.payment_date = parse_calendar_date(payment_date, get_module_calendar("payroll", request=request))
        
        if payment_method:
            payroll.payment_method = payment_method

        payroll.refresh_payment_totals()
        if payment_status in ["paid", "fully_paid"] and payroll.balance_due > 0:
            PayrollPayment.objects.create(
                payroll=payroll,
                amount=payroll.balance_due,
                payment_date=payroll.payment_date or date.today(),
                payment_method=payroll.payment_method,
                created_by=request.user,
            )
            payroll.refresh_payment_totals()
        
        payroll.save()
        serializer = PayrollSerializer(payroll)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get overall payroll summary"""
        period = request.query_params.get('period', None)
        period_start = None
        period_end = None
        
        queryset = self.get_queryset()
        
        if period:
            calendar_type = get_module_calendar("payroll", request=request)
            today = datetime.now().date()
            if period == 'monthly':
                if calendar_type == "shamsi":
                    current_year, current_month, _ = to_shamsi(today)
                else:
                    current_year, current_month = today.year, today.month
                start, end = calendar_month_bounds(current_year, current_month, calendar_type)
                queryset = queryset.filter(
                    payroll_period_start__gte=start,
                    payroll_period_start__lte=end,
                )
                period_start = start
                period_end = end
            elif period == 'yearly':
                current_year = to_shamsi(today)[0] if calendar_type == "shamsi" else today.year
                start, end = calendar_year_bounds(current_year, calendar_type)
                queryset = queryset.filter(payroll_period_start__gte=start, payroll_period_start__lte=end)
                period_start = start
                period_end = end

        if not period_start and request.query_params.get("start_date") and request.query_params.get("end_date"):
            calendar_type = get_module_calendar("payroll", request=request)
            period_start = parse_calendar_date(request.query_params.get("start_date"), calendar_type)
            period_end = parse_calendar_date(request.query_params.get("end_date"), calendar_type)

        employee_id = request.query_params.get('employee_id', None)
        advances = salary_advance_queryset(
            start=period_start,
            end=period_end,
            employee_id=employee_id,
        )
        advance_summary = salary_advance_totals(advances)
        
        summary = queryset.aggregate(
            total_gross=Sum('gross_pay'),
            total_net=Sum('net_pay'),
            total_overtime=Sum('overtime_amount'),
            total_bonus=Sum('bonus'),
            total_deductions=Sum('deductions'),
            total_advance_deductions=Sum('advance_deductions'),
            total_tax=Sum('tax_deducted'),
            total_amount_paid=Sum('amount_paid'),
            total_balance_due=Sum('balance_due'),
            total_records=Count('id')
        )
        summary["total_advances_paid"] = advance_summary["total_paid"]
        summary["total_outstanding_advances"] = advance_summary["outstanding"]
        summary["total_cash_outflow"] = (summary["total_net"] or Decimal("0.00")) + advance_summary["total_paid"]
        if period_start and period_end:
            calendar_summary = get_work_calendar_service().get_range_summary(period_start, period_end)
            summary.update({
                "total_calendar_days": calendar_summary["total_calendar_days"],
                "total_working_days": calendar_summary["total_working_days"],
                "weekly_off_days": calendar_summary["weekly_off_days"],
                "official_holidays": calendar_summary["official_holidays"],
                "calendar_summary": calendar_summary,
            })
        
        method_breakdown = queryset.values('payment_method', 'currency').annotate(
            count=Count('id'),
            total_net=Sum('net_pay')
        )
        
        return Response({
            'summary': summary,
            'payment_method_breakdown': method_breakdown,
            'period': period or 'all_time'
        })

    @action(detail=False, methods=['get'])
    def monthly_report(self, request):
        """Generate monthly payroll report"""
        year = int(request.query_params.get('year', datetime.now().year))
        month = int(request.query_params.get('month', datetime.now().month))
        start, end = calendar_month_bounds(year, month, get_module_calendar("payroll", request=request))
        
        payrolls = self.get_queryset().filter(
            payroll_period_start__gte=start,
            payroll_period_start__lte=end,
        )
        
        report = {
            'year': year,
            'month': month,
            'total_employees': payrolls.count(),
            'total_gross': payrolls.aggregate(total=Sum('gross_pay'))['total'] or 0,
            'total_net': payrolls.aggregate(total=Sum('net_pay'))['total'] or 0,
            'total_advance_deductions': payrolls.aggregate(total=Sum('advance_deductions'))['total'] or 0,
            'total_advances_paid': salary_advance_totals(
                salary_advance_queryset(start=start, end=end)
            )["total_paid"],
            'total_balance_due': payrolls.aggregate(total=Sum('balance_due'))['total'] or 0,
            'total_amount_paid': payrolls.aggregate(total=Sum('amount_paid'))['total'] or 0,
            'payment_methods': {},
            'department_breakdown': {},
        }
        report['total_cash_outflow'] = report['total_net'] + report['total_advances_paid']
        
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
    permission_classes = [RBACPermission]
    rbac_resource = "attendance"

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
        calendar_type = get_module_calendar("attendance", request=self.request)

        if employee_id:
            queryset = queryset.filter(employee_id=employee_id)

        if status:
            queryset = queryset.filter(status=status)

        if date_param:
            date_param = parse_calendar_date(date_param, calendar_type)
            queryset = queryset.filter(date=date_param)

        if month and year:
            start, end = calendar_month_bounds(year, month, calendar_type)
            queryset = queryset.filter(date__gte=start, date__lte=end)
        elif year:
            start, end = calendar_year_bounds(year, calendar_type)
            queryset = queryset.filter(date__gte=start, date__lte=end)

        if search:
            queryset = queryset.filter(
                Q(employee__first_name__icontains=search) |
                Q(employee__last_name__icontains=search) |
                Q(employee__employee_id__icontains=search)
            )

        return queryset.select_related('employee')

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        if not has_permission(self.request.user, "attendance.update"):
            instance = self.get_object()
            if instance.created_by_id != self.request.user.id:
                raise PermissionDenied("You can only update your own attendance entries.")
        serializer.save()

    
    
    @action(detail=False, methods=["post"])
    @transaction.atomic
    def bulk_mark(self, request):
        serializer = BulkAttendanceSerializer(data=request.data, context={"request": request})
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

            existing = Attendance.objects.filter(
                employee=employee,
                date=attendance_date,
            ).first()

            if existing and not has_permission(request.user, "attendance.update"):
                if existing.created_by_id != request.user.id:
                    errors.append({
                        "employee": record["employee"],
                        "error": "You can only update your own attendance entries."
                    })
                    continue

            if not existing:
                defaults["created_by"] = request.user

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
        target_date = parse_calendar_date(target_date, get_module_calendar("attendance", request=request))

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
        work_calendar = get_work_calendar_service().get_date_info(target_date)

        return Response({
            'date': target_date.isoformat(),
            'work_calendar': work_calendar,
            'is_working_day': work_calendar['is_working_day'],
            'day_type': work_calendar['day_type'],
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
        start, end = calendar_month_bounds(year, month, get_module_calendar("attendance", request=request))

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
            date__gte=start,
            date__lte=end,
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
        calendar_summary = get_work_calendar_service().get_range_summary(
            start,
            end,
        )
        total_working_days = calendar_summary["total_working_days"]
        attendance_percentage = Decimal("0.00")
        if total_working_days:
            attendance_percentage = (
                effective_days / Decimal(total_working_days) * Decimal("100")
            ).quantize(Decimal("0.01"))

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
            'total_calendar_days': calendar_summary["total_calendar_days"],
            'total_working_days': total_working_days,
            'weekly_off_days': calendar_summary["weekly_off_days"],
            'official_holidays': calendar_summary["official_holidays"],
            'attendance_percentage': attendance_percentage,
            'calendar_summary': calendar_summary,
        })


from collections import defaultdict

from django.http import HttpResponse
from django.utils import timezone
from rest_framework.views import APIView

from reportlab.platypus import (
    SimpleDocTemplate,
    Table,
    TableStyle,
    Paragraph,
    Spacer,
    PageBreak,
)
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet

from .models import Payroll, Employee
from accounts.permissions import RBACPermission
from reports.branding import build_pdf_branding_elements, draw_pdf_branding_footer


class PayrollPDFExportView(APIView):
    permission_classes = [RBACPermission]
    rbac_resource = "payrolls"

    def get(self, request):
        queryset = Payroll.objects.select_related("employee")

        employee_id = request.GET.get("employee_id")
        payment_method = request.GET.get("payment_method")
        start_date = request.GET.get("start_date")
        end_date = request.GET.get("end_date")

        # Apply filters
        if employee_id:
            queryset = queryset.filter(employee_id=employee_id)

        if payment_method:
            queryset = queryset.filter(payment_method=payment_method)

        if start_date:
            queryset = queryset.filter(payment_date__gte=start_date)

        if end_date:
            queryset = queryset.filter(payment_date__lte=end_date)

        queryset = queryset.order_by(
            "-payment_date",
            "-payroll_period_start",
        )

        # Employee display
        employee_name = "All Employees"

        if employee_id:
            try:
                employee_name = Employee.objects.get(
                    id=employee_id
                ).full_name
            except Employee.DoesNotExist:
                pass

        # Response
        response = HttpResponse(content_type="application/pdf")

        filename = (
            f"payroll_report_{timezone.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        )

        response["Content-Disposition"] = (
            f'attachment; filename="{filename}"'
        )

        doc = SimpleDocTemplate(
            response,
            leftMargin=20,
            rightMargin=20,
            topMargin=20,
            bottomMargin=32,
        )

        styles = getSampleStyleSheet()
        elements = []

        company, branding = build_pdf_branding_elements(
            title="Payroll Report",
            subtitle=f"Generated: {timezone.now().strftime('%Y-%m-%d %H:%M')}",
            request=request,
            styles=styles,
        )
        elements.extend(branding)

        filter_table = Table(
            [
                ["Employee", employee_name],
                ["Payment Method", payment_method or "All"],
                ["Start Date", start_date or "Any"],
                ["End Date", end_date or "Any"],
                ["Total Records", str(queryset.count())],
            ],
            colWidths=[130, 320],
        )

        filter_table.setStyle(
            TableStyle(
                [
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.black),
                    ("BACKGROUND", (0, 0), (0, -1), colors.lightgrey),
                    ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ]
            )
        )

        elements.append(
            Paragraph("Applied Filters", styles["Heading2"])
        )

        elements.append(filter_table)

        elements.append(Spacer(1, 20))

        # ==========================================
        # SUMMARY BY CURRENCY
        # ==========================================

        currency_summary = defaultdict(
            lambda: {
                "gross": 0,
                "net": 0,
                "cash_outflow": 0,
                "bonus": 0,
                "allowances": 0,
                "deductions": 0,
                "advance_deductions": 0,
                "salary_advances": 0,
                "amount_paid": 0,
                "balance_due": 0,
                "tax": 0,
                "overtime": 0,
                "count": 0,
            }
        )

        for payroll in queryset:
            curr = payroll.currency

            currency_summary[curr]["gross"] += float(
                payroll.gross_pay or 0
            )

            currency_summary[curr]["net"] += float(
                payroll.net_pay or 0
            )
            currency_summary[curr]["cash_outflow"] += float(
                payroll.net_pay or 0
            )

            currency_summary[curr]["bonus"] += float(
                payroll.bonus or 0
            )

            currency_summary[curr]["allowances"] += float(
                payroll.allowances or 0
            )

            currency_summary[curr]["deductions"] += float(
                payroll.deductions or 0
            )
            currency_summary[curr]["advance_deductions"] += float(
                payroll.advance_deductions or 0
            )
            currency_summary[curr]["amount_paid"] += float(
                payroll.amount_paid or 0
            )
            currency_summary[curr]["balance_due"] += float(
                payroll.balance_due or 0
            )

            currency_summary[curr]["tax"] += float(
                payroll.tax_deducted or 0
            )

            currency_summary[curr]["overtime"] += float(
                payroll.overtime_amount or 0
            )

            currency_summary[curr]["count"] += 1

        if not payment_method:
            advance_summary = salary_advance_totals(
                salary_advance_queryset(
                    start=start_date,
                    end=end_date,
                    employee_id=employee_id,
                )
            )
            currency_summary["AFN"]["salary_advances"] += float(
                advance_summary["total_paid"] or 0
            )
            currency_summary["AFN"]["cash_outflow"] += float(
                advance_summary["total_paid"] or 0
            )

        elements.append(
            Paragraph("Payroll Summary", styles["Heading1"])
        )

        for currency, data in currency_summary.items():
            elements.append(
                Paragraph(
                    f"Currency: {currency}",
                    styles["Heading3"],
                )
            )

            summary_table = Table(
                [
                    ["Metric", "Value"],
                    ["Payroll Records", str(data["count"])],
                    [
                        "Total Gross Pay",
                        f"{currency} {data['gross']:,.2f}",
                    ],
                    [
                        "Total Net Pay",
                        f"{currency} {data['net']:,.2f}",
                    ],
                    [
                        "Salary Advances Paid",
                        f"{currency} {data['salary_advances']:,.2f}",
                    ],
                    [
                        "Advance Deductions",
                        f"{currency} {data['advance_deductions']:,.2f}",
                    ],
                    [
                        "Payroll Cash Outflow",
                        f"{currency} {data['cash_outflow']:,.2f}",
                    ],
                    [
                        "Amount Already Paid",
                        f"{currency} {data['amount_paid']:,.2f}",
                    ],
                    [
                        "Outstanding Salary",
                        f"{currency} {data['balance_due']:,.2f}",
                    ],
                    [
                        "Total Bonus",
                        f"{currency} {data['bonus']:,.2f}",
                    ],
                    [
                        "Total Allowances",
                        f"{currency} {data['allowances']:,.2f}",
                    ],
                    [
                        "Total Deductions",
                        f"{currency} {data['deductions']:,.2f}",
                    ],
                    [
                        "Total Tax",
                        f"{currency} {data['tax']:,.2f}",
                    ],
                    [
                        "Total Overtime",
                        f"{currency} {data['overtime']:,.2f}",
                    ],
                ],
                colWidths=[220, 180],
            )

            summary_table.setStyle(
                TableStyle(
                    [
                        ("GRID", (0, 0), (-1, -1), 0.5, colors.black),
                        (
                            "BACKGROUND",
                            (0, 0),
                            (-1, 0),
                            colors.lightgrey,
                        ),
                        (
                            "FONTNAME",
                            (0, 0),
                            (-1, 0),
                            "Helvetica-Bold",
                        ),
                    ]
                )
            )

            elements.append(summary_table)
            elements.append(Spacer(1, 15))

        # ==========================================
        # DETAILS
        # ==========================================

        elements.append(PageBreak())

        elements.append(
            Paragraph("Payroll Details", styles["Heading1"])
        )

        payroll_data = [
            [
                "Employee",
                "Employee ID",
                "Period",
                "Gross",
                "Advances",
                "Net",
                "Paid",
                "Balance",
                "Currency",
                "Method",
            ]
        ]

        for payroll in queryset:
            payroll_data.append(
                [
                    payroll.employee.full_name,
                    payroll.employee.employee_id,
                    (
                        f"{payroll.payroll_period_start}"
                        f"\n{payroll.payroll_period_end}"
                    ),
                    f"{float(payroll.gross_pay):,.2f}",
                    f"{float(payroll.advance_deductions):,.2f}",
                    f"{float(payroll.net_pay):,.2f}",
                    f"{float(payroll.amount_paid):,.2f}",
                    f"{float(payroll.balance_due):,.2f}",
                    payroll.currency,
                    payroll.get_payment_method_display(),
                ]
            )

        details_table = Table(
            payroll_data,
            repeatRows=1,
            colWidths=[
                105,
                60,
                82,
                55,
                55,
                55,
                55,
                55,
                40,
                62,
            ],
        )

        details_table.setStyle(
            TableStyle(
                [
                    ("GRID", (0, 0), (-1, -1), 0.4, colors.black),
                    (
                        "BACKGROUND",
                        (0, 0),
                        (-1, 0),
                        colors.HexColor("#dbeafe"),
                    ),
                    (
                        "FONTNAME",
                        (0, 0),
                        (-1, 0),
                        "Helvetica-Bold",
                    ),
                    ("FONTSIZE", (0, 0), (-1, -1), 8),
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ]
            )
        )

        elements.append(details_table)

        doc.build(
            elements,
            onFirstPage=lambda canvas, document: draw_pdf_branding_footer(
                canvas,
                document,
                company=company,
            ),
            onLaterPages=lambda canvas, document: draw_pdf_branding_footer(
                canvas,
                document,
                company=company,
            ),
        )

        return response
    
# apps/hr/views.py

# apps/hr/views.py

from django.db import models

from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet

from .models import Attendance


class AttendancePDFExportView(APIView):
    def get(self, request):
        queryset = Attendance.objects.select_related("employee")

        employee = request.GET.get("employee")
        status = request.GET.get("status")
        date = request.GET.get("date")
        month = request.GET.get("month")
        year = request.GET.get("year")
        search = request.GET.get("search")

        if employee:
            queryset = queryset.filter(employee__employee_id__icontains=employee)

        if status:
            queryset = queryset.filter(status=status)

        if date:
            queryset = queryset.filter(date=date)

        if month:
            queryset = queryset.filter(date__month=month)

        if year:
            queryset = queryset.filter(date__year=year)

        if search:
            queryset = queryset.filter(
                employee__first_name__icontains=search
            ) | queryset.filter(
                employee__last_name__icontains=search
            ) | queryset.filter(
                employee__employee_id__icontains=search
            )

        response = HttpResponse(content_type="application/pdf")
        response["Content-Disposition"] = (
            f'attachment; filename="attendance-report-{timezone.now().date()}.pdf"'
        )

        doc = SimpleDocTemplate(
            response,
            leftMargin=20,
            rightMargin=20,
            topMargin=20,
            bottomMargin=32,
        )
        styles = getSampleStyleSheet()

        elements = []

        company, branding = build_pdf_branding_elements(
            title="Attendance Report",
            subtitle=f"Generated: {timezone.now().strftime('%Y-%m-%d %H:%M')}",
            request=request,
            styles=styles,
        )
        elements.extend(branding)

        # Applied Filters
        filter_data = [
            ["Filter", "Value"],
            ["Employee", employee or "All"],
            ["Status", status or "All"],
            ["Date", date or "All"],
            ["Month", month or "All"],
            ["Year", year or "All"],
            ["Search", search or "All"],
        ]

        filter_table = Table(filter_data, colWidths=[120, 250])
        filter_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.lightgrey),
                    ("GRID", (0, 0), (-1, -1), 1, colors.black),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ]
            )
        )

        elements.append(
            Paragraph("Applied Filters", styles["Heading2"])
        )
        elements.append(filter_table)
        elements.append(Spacer(1, 20))

        # Summary
        summary = queryset.aggregate(
            total=Count("id"),
            present=Count("id", filter=models.Q(status="present")),
            absent=Count("id", filter=models.Q(status="absent")),
            half_day=Count("id", filter=models.Q(status="half_day")),
            leave=Count("id", filter=models.Q(status="leave")),
            overtime=Sum("overtime_hours"),
        )

        summary_data = [
            ["Metric", "Value"],
            ["Total Records", summary["total"] or 0],
            ["Present", summary["present"] or 0],
            ["Absent", summary["absent"] or 0],
            ["Half Day", summary["half_day"] or 0],
            ["Leave", summary["leave"] or 0],
            ["Total Overtime Hours", summary["overtime"] or 0],
        ]

        summary_table = Table(summary_data, colWidths=[200, 150])

        summary_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.lightgrey),
                    ("GRID", (0, 0), (-1, -1), 1, colors.black),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ]
            )
        )

        elements.append(
            Paragraph("Summary", styles["Heading2"])
        )
        elements.append(summary_table)
        elements.append(Spacer(1, 20))

        # Attendance Records
        data = [
            [
                "Employee",
                "Employee ID",
                "Date",
                "Status",
                "Check In",
                "Check Out",
                "OT Hours",
            ]
        ]

        for record in queryset.order_by("-date"):
            data.append(
                [
                    record.employee.full_name,
                    record.employee.employee_id,
                    str(record.date),
                    record.status,
                    str(record.check_in or "-"),
                    str(record.check_out or "-"),
                    str(record.overtime_hours),
                ]
            )

        attendance_table = Table(
            data,
            colWidths=[110, 70, 70, 60, 60, 60, 50],
        )

        attendance_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.lightgrey),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.black),
                    ("FONTSIZE", (0, 0), (-1, -1), 8),
                ]
            )
        )

        elements.append(
            Paragraph("Attendance Records", styles["Heading2"])
        )
        elements.append(attendance_table)

        doc.build(
            elements,
            onFirstPage=lambda canvas, document: draw_pdf_branding_footer(
                canvas,
                document,
                company=company,
            ),
            onLaterPages=lambda canvas, document: draw_pdf_branding_footer(
                canvas,
                document,
                company=company,
            ),
        )

        return response
