from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.db.models import Q, Sum, Count
from datetime import date

# Import your existing permissions
from accounts.permissions import RBACPermission 
from accounts.services import has_permission

from .models import DailyWorker, WorkerAttendance, WorkerPayroll
from .serializers import (
    DailyWorkerSerializer, WorkerAttendanceSerializer, 
    BulkWorkerAttendanceSerializer, WorkerPayrollSerializer,
    GenerateWorkerPayrollSerializer
)

class DailyWorkerViewSet(viewsets.ModelViewSet):
    queryset = DailyWorker.objects.all()
    serializer_class = DailyWorkerSerializer
    permission_classes = [RBACPermission]
    rbac_resource = "daily_workers"

    def get_queryset(self):
        qs = super().get_queryset()
        search = self.request.query_params.get('search')
        trade = self.request.query_params.get('trade')
        is_active = self.request.query_params.get('is_active')

        if search:
            qs = qs.filter(Q(first_name__icontains=search) | Q(last_name__icontains=search) | Q(worker_id__icontains=search))
        if trade:
            qs = qs.filter(trade=trade)
        if is_active is not None:
            qs = qs.filter(is_active=(is_active.lower() == 'true'))
        return qs


class WorkerAttendanceViewSet(viewsets.ModelViewSet):
    queryset = WorkerAttendance.objects.select_related('worker')
    serializer_class = WorkerAttendanceSerializer
    permission_classes = [RBACPermission]
    rbac_resource = "daily_worker_attendance"

    def get_queryset(self):
        qs = super().get_queryset()
        worker = self.request.query_params.get('worker')
        date_param = self.request.query_params.get('date')
        site = self.request.query_params.get('project_site')

        if worker: qs = qs.filter(worker_id=worker)
        if date_param: qs = qs.filter(date=date_param)
        if site: qs = qs.filter(project_site__icontains=site)
        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=["post"])
    @transaction.atomic
    def bulk_mark(self, request):
        """Mark attendance for multiple construction workers at once (e.g. by the Foreman)"""
        serializer = BulkWorkerAttendanceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        target_date = data["date"]
        project_site = data.get("project_site", "")
        
        created_count = 0
        updated_count = 0

        for record in data["records"]:
            worker_id = record["worker"]
            try:
                worker = DailyWorker.objects.get(id=worker_id, is_active=True)
            except DailyWorker.DoesNotExist:
                continue

            defaults = {
                "status": record["status"],
                "overtime_hours": record.get("overtime_hours", 0),
                "notes": record.get("notes", ""),
                "project_site": project_site
            }

            obj, created = WorkerAttendance.objects.update_or_create(
                worker=worker,
                date=target_date,
                defaults=defaults
            )
            
            if created:
                obj.created_by = request.user
                obj.save()
                created_count += 1
            else:
                updated_count += 1

        return Response({
            "message": f"Successfully marked attendance.",
            "created": created_count,
            "updated": updated_count
        })

    @action(detail=False, methods=['get'])
    def daily_status(self, request):
        """Shows who is present/absent on the site today"""
        target_date = request.query_params.get('date', str(date.today()))
        
        attendances = WorkerAttendance.objects.filter(date=target_date)
        marked_ids = attendances.values_list('worker_id', flat=True)
        unmarked = DailyWorker.objects.filter(is_active=True).exclude(id__in=marked_ids)

        return Response({
            "date": target_date,
            "present_count": attendances.filter(status='present').count(),
            "half_day_count": attendances.filter(status='half_day').count(),
            "absent_count": attendances.filter(status='absent').count(),
            "unmarked_count": unmarked.count(),
            "marked_records": WorkerAttendanceSerializer(attendances, many=True).data,
            "unmarked_workers": DailyWorkerSerializer(unmarked, many=True).data
        })


class WorkerPayrollViewSet(viewsets.ModelViewSet):
    queryset = WorkerPayroll.objects.select_related('worker')
    serializer_class = WorkerPayrollSerializer
    permission_classes = [RBACPermission]
    rbac_resource = "daily_worker_payroll"

    def get_queryset(self):
        qs = super().get_queryset()
        worker = self.request.query_params.get('worker')
        is_paid = self.request.query_params.get('is_paid')

        if worker: qs = qs.filter(worker_id=worker)
        if is_paid is not None: qs = qs.filter(is_paid=(is_paid.lower() == 'true'))
        return qs

    @action(detail=False, methods=['post'])
    @transaction.atomic
    def generate(self, request):
        """
        MAGIC ENDPOINT: Automatically creates payrolls based strictly on attendance records!
        Provide start date, end date, and optional list of worker IDs.
        """
        serializer = GenerateWorkerPayrollSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        start_date = serializer.validated_data['period_start']
        end_date = serializer.validated_data['period_end']
        worker_ids = serializer.validated_data.get('worker_ids', [])
        payment_method = serializer.validated_data['payment_method']

        workers = DailyWorker.objects.filter(is_active=True)
        if worker_ids:
            workers = workers.filter(id__in=worker_ids)

        generated_payrolls = []
        errors = []

        for worker in workers:
            # Prevent duplicate generation
            if WorkerPayroll.objects.filter(worker=worker, period_start=start_date, period_end=end_date).exists():
                errors.append(f"Payroll already exists for {worker.full_name} in this period.")
                continue

            # Check if they actually worked in this period
            has_attendance = WorkerAttendance.objects.filter(
                worker=worker, date__gte=start_date, date__lte=end_date
            ).exists()

            if not has_attendance:
                continue # Skip workers who didn't show up at all this week/month

            payroll = WorkerPayroll(
                worker=worker,
                period_start=start_date,
                period_end=end_date,
                daily_rate_applied=worker.daily_rate,
                overtime_rate_applied=worker.overtime_hourly_rate,
                currency=worker.currency,
                payment_method=payment_method,
                created_by=request.user
            )
            
            payroll.calculate_from_attendance()
            payroll.save()
            generated_payrolls.append(WorkerPayrollSerializer(payroll).data)

        return Response({
            "message": f"Generated {len(generated_payrolls)} payroll records.",
            "generated": generated_payrolls,
            "errors": errors
        })

    @action(detail=True, methods=['patch'])
    def mark_paid(self, request, pk=None):
        payroll = self.get_object()
        payroll.is_paid = True
        payroll.payment_date = request.data.get('payment_date', date.today())
        payroll.save()
        return Response(self.get_serializer(payroll).data)