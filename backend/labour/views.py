from datetime import date
from decimal import Decimal

from django.db import transaction
from django.db.models import Count, Q, Sum
from django.db.models.functions import Coalesce, TruncMonth
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from accounts.permissions import RBACPermission
from common.calendar_utils import get_module_calendar, parse_calendar_date
from common.work_calendar import get_work_calendar_service
from project.models import Project

from .models import DailyWorker, WorkerAdvance, WorkerAttendance, WorkerPayroll
from .serializers import (
    BulkWorkerAttendanceSerializer,
    DailyWorkerListSerializer,
    DailyWorkerSerializer,
    GenerateWorkerPayrollSerializer,
    WorkerAdvanceSerializer,
    WorkerAttendanceSerializer,
    WorkerPayrollSerializer,
)


class DailyWorkerViewSet(viewsets.ModelViewSet):
    queryset = DailyWorker.objects.select_related("assigned_project").prefetch_related("attendances", "payrolls", "advances")
    permission_classes = [RBACPermission]
    rbac_resource = "daily_workers"

    def get_serializer_class(self):
        return DailyWorkerListSerializer if self.action == "list" else DailyWorkerSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        search = self.request.query_params.get("search")
        skill_type = self.request.query_params.get("skill_type") or self.request.query_params.get("trade")
        status_filter = self.request.query_params.get("status")
        project = self.request.query_params.get("project")
        ordering = self.request.query_params.get("ordering")

        if search:
            qs = qs.filter(
                Q(full_name__icontains=search)
                | Q(father_name__icontains=search)
                | Q(worker_id__icontains=search)
                | Q(phone__icontains=search)
                | Q(national_id__icontains=search)
            )
        if skill_type:
            qs = qs.filter(skill_type=skill_type)
        if status_filter:
            qs = qs.filter(status=status_filter)
        if project:
            qs = qs.filter(assigned_project_id=project)
        if ordering:
            qs = qs.order_by(ordering)
        return qs

    @action(detail=True, methods=["get"])
    def detail_summary(self, request, pk=None):
        worker = self.get_object()
        return Response({
            "worker": DailyWorkerSerializer(worker).data,
            "attendance_history": WorkerAttendanceSerializer(worker.attendances.select_related("project")[:50], many=True).data,
            "payroll_history": WorkerPayrollSerializer(worker.payrolls.select_related("project")[:50], many=True).data,
            "advances": WorkerAdvanceSerializer(worker.advances.all()[:50], many=True).data,
            "projects": list(Project.objects.filter(
                Q(id=worker.assigned_project_id) | Q(worker_attendances__worker=worker) | Q(worker_payrolls__worker=worker)
            ).distinct().values("id", "name", "status", "location")),
            "documents": [],
        })


class WorkerAttendanceViewSet(viewsets.ModelViewSet):
    queryset = WorkerAttendance.objects.select_related("worker", "project")
    serializer_class = WorkerAttendanceSerializer
    permission_classes = [RBACPermission]
    rbac_resource = "daily_worker_attendance"

    def get_queryset(self):
        qs = super().get_queryset()
        worker = self.request.query_params.get("worker")
        project = self.request.query_params.get("project")
        date_param = self.request.query_params.get("date")
        start_date = self.request.query_params.get("start_date")
        end_date = self.request.query_params.get("end_date")
        calendar_type = get_module_calendar("daily_worker_attendance", request=self.request)
        status_param = self.request.query_params.get("status")
        search = self.request.query_params.get("search")

        if worker:
            qs = qs.filter(worker_id=worker)
        if project:
            qs = qs.filter(project_id=project)
        if date_param:
            date_param = parse_calendar_date(date_param, calendar_type)
            qs = qs.filter(date=date_param)
        if start_date:
            start_date = parse_calendar_date(start_date, calendar_type)
            qs = qs.filter(date__gte=start_date)
        if end_date:
            end_date = parse_calendar_date(end_date, calendar_type)
            qs = qs.filter(date__lte=end_date)
        if status_param:
            qs = qs.filter(status=status_param)
        if search:
            qs = qs.filter(Q(worker__full_name__icontains=search) | Q(worker__worker_id__icontains=search))
        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=["post"])
    @transaction.atomic
    def bulk_mark(self, request):
        serializer = BulkWorkerAttendanceSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        target_date = data["date"]
        project_id = data.get("project")
        created, updated, errors = [], [], []

        for record in data["records"]:
            try:
                worker = DailyWorker.objects.get(id=record["worker"], status="active")
            except DailyWorker.DoesNotExist:
                errors.append({"worker": record.get("worker"), "error": "Worker not found or inactive."})
                continue

            defaults = {
                "project_id": project_id or worker.assigned_project_id,
                "status": record["status"],
                "overtime_hours": record.get("overtime_hours") or 0,
                "notes": (record.get("notes") or "").strip(),
            }
            if defaults["status"] == "absent":
                defaults["overtime_hours"] = 0

            obj, was_created = WorkerAttendance.objects.update_or_create(
                worker=worker,
                date=target_date,
                defaults=defaults,
            )
            if was_created:
                obj.created_by = request.user
                obj.save(update_fields=["created_by"])
                created.append(WorkerAttendanceSerializer(obj).data)
            else:
                updated.append(WorkerAttendanceSerializer(obj).data)

        return Response({
            "date": target_date,
            "created_count": len(created),
            "updated_count": len(updated),
            "error_count": len(errors),
            "created": created,
            "updated": updated,
            "errors": errors,
        })

    @action(detail=False, methods=["get"])
    def daily_status(self, request):
        target_date = request.query_params.get("date", str(date.today()))
        target_date = parse_calendar_date(target_date, get_module_calendar("daily_worker_attendance", request=request))
        project = request.query_params.get("project")
        records = self.get_queryset().filter(date=target_date)
        active_workers = DailyWorker.objects.filter(status="active")
        if project:
            active_workers = active_workers.filter(assigned_project_id=project)
            records = records.filter(project_id=project)
        calendar_service = get_work_calendar_service()
        work_calendar = calendar_service.get_date_info(target_date)
        marked_ids = records.values_list("worker_id", flat=True)
        unmarked = active_workers.exclude(id__in=marked_ids)
        counts = dict(records.values_list("status").annotate(count=Count("id")).values_list("status", "count"))
        return Response({
            "date": target_date.isoformat(),
            "work_calendar": work_calendar,
            "is_working_day": work_calendar["is_working_day"],
            "day_type": work_calendar["day_type"],
            "status_counts": {
                "present": counts.get("present", 0),
                "absent": counts.get("absent", 0),
                "half_day": counts.get("half_day", 0),
                "overtime": counts.get("overtime", 0),
            },
            "present_count": counts.get("present", 0) + counts.get("overtime", 0),
            "absent_count": counts.get("absent", 0),
            "half_day_count": counts.get("half_day", 0),
            "unmarked_count": unmarked.count(),
            "marked_records": WorkerAttendanceSerializer(records, many=True).data,
            "unmarked_workers": DailyWorkerListSerializer(unmarked, many=True).data,
        })

    @action(detail=False, methods=["get"])
    def summary(self, request):
        qs = self.get_queryset()
        payload = {
            "total_records": qs.count(),
            "present": qs.filter(status="present").count(),
            "absent": qs.filter(status="absent").count(),
            "half_day": qs.filter(status="half_day").count(),
            "overtime": qs.filter(status="overtime").count(),
            "overtime_hours": qs.aggregate(total=Coalesce(Sum("overtime_hours"), Decimal("0.00")))["total"],
        }
        start_date = request.query_params.get("start_date")
        end_date = request.query_params.get("end_date")
        if start_date and end_date:
            calendar_type = get_module_calendar("daily_worker_attendance", request=request)
            start = parse_calendar_date(start_date, calendar_type)
            end = parse_calendar_date(end_date, calendar_type)
            calendar_summary = get_work_calendar_service().get_range_summary(start, end)
            payload.update({
                "total_calendar_days": calendar_summary["total_calendar_days"],
                "total_working_days": calendar_summary["total_working_days"],
                "weekly_off_days": calendar_summary["weekly_off_days"],
                "official_holidays": calendar_summary["official_holidays"],
                "calendar_summary": calendar_summary,
            })
        return Response(payload)


class WorkerAdvanceViewSet(viewsets.ModelViewSet):
    queryset = WorkerAdvance.objects.select_related("worker")
    serializer_class = WorkerAdvanceSerializer
    permission_classes = [RBACPermission]
    rbac_resource = "worker_advances"

    def get_queryset(self):
        qs = super().get_queryset()
        worker = self.request.query_params.get("worker")
        status_filter = self.request.query_params.get("status")
        if worker:
            qs = qs.filter(worker_id=worker)
        if status_filter == "open":
            qs = qs.filter(remaining_balance__gt=0)
        elif status_filter == "paid":
            qs = qs.filter(remaining_balance__lte=0)
        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class WorkerPayrollViewSet(viewsets.ModelViewSet):
    queryset = WorkerPayroll.objects.select_related("worker", "project")
    serializer_class = WorkerPayrollSerializer
    permission_classes = [RBACPermission]
    rbac_resource = "daily_worker_payroll"

    def get_queryset(self):
        qs = super().get_queryset()
        worker = self.request.query_params.get("worker")
        project = self.request.query_params.get("project")
        status_filter = self.request.query_params.get("status")
        start_date = self.request.query_params.get("start_date")
        end_date = self.request.query_params.get("end_date")
        calendar_type = get_module_calendar("daily_worker_payroll", request=self.request)
        if worker:
            qs = qs.filter(worker_id=worker)
        if project:
            qs = qs.filter(project_id=project)
        if status_filter:
            qs = qs.filter(status=status_filter)
        if start_date:
            start_date = parse_calendar_date(start_date, calendar_type)
            qs = qs.filter(period_start__gte=start_date)
        if end_date:
            end_date = parse_calendar_date(end_date, calendar_type)
            qs = qs.filter(period_end__lte=end_date)
        return qs

    def perform_create(self, serializer):
        payroll = serializer.save(created_by=self.request.user)
        payroll.calculate_from_attendance()
        payroll.save()

    def perform_update(self, serializer):
        payroll = serializer.save()
        payroll.calculate_from_attendance()
        payroll.save()

    @action(detail=False, methods=["post"])
    @transaction.atomic
    def generate(self, request):
        serializer = GenerateWorkerPayrollSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        start_date = data["period_start"]
        end_date = data["period_end"]
        project_id = data.get("project")
        worker_ids = data.get("worker_ids") or ([data["worker"]] if data.get("worker") else [])

        workers = DailyWorker.objects.filter(status="active")
        if worker_ids:
            workers = workers.filter(id__in=worker_ids)
        if project_id:
            workers = workers.filter(Q(assigned_project_id=project_id) | Q(attendances__project_id=project_id)).distinct()

        calendar_service = get_work_calendar_service()
        missing_attendance = []
        for worker in workers:
            working_days = calendar_service.get_working_days(
                start_date,
                end_date,
            )
            if not working_days:
                continue

            attendance = WorkerAttendance.objects.filter(
                worker=worker,
                date__gte=start_date,
                date__lte=end_date,
            )
            if project_id:
                attendance = attendance.filter(project_id=project_id)
            marked_dates = set(attendance.values_list("date", flat=True))
            missing_dates = [
                working_day
                for working_day in working_days
                if working_day not in marked_dates
            ]
            if missing_dates:
                first_missing = missing_dates[0]
                missing_attendance.append({
                    "worker": worker.full_name,
                    "worker_id": worker.id,
                    "date": first_missing.isoformat(),
                    "dates": [day.isoformat() for day in missing_dates],
                    "message": (
                        f"Attendance has not been recorded for {first_missing.isoformat()}. "
                        "Please complete attendance before generating payroll."
                    ),
                })

        if missing_attendance:
            first = missing_attendance[0]
            return Response(
                {
                    "detail": first["message"],
                    "missing_attendance": missing_attendance,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        generated, errors = [], []
        for worker in workers:
            attendance = WorkerAttendance.objects.filter(worker=worker, date__gte=start_date, date__lte=end_date)
            if project_id:
                attendance = attendance.filter(project_id=project_id)
            if not attendance.exists():
                continue
            if WorkerPayroll.objects.filter(worker=worker, project_id=project_id, period_start=start_date, period_end=end_date).exists():
                errors.append({"worker": worker.full_name, "error": "Payroll already exists for this period."})
                continue
            payroll = WorkerPayroll(
                worker=worker,
                project_id=project_id,
                period_start=start_date,
                period_end=end_date,
                daily_rate_applied=worker.daily_rate,
                overtime_rate_applied=worker.overtime_hourly_rate,
                currency=worker.currency,
                payment_method=data["payment_method"],
                deductions=data["deductions"],
                notes=data.get("notes", ""),
                created_by=request.user,
            )
            payroll.calculate_from_attendance()
            payroll.save()
            generated.append(WorkerPayrollSerializer(payroll).data)

        return Response({"message": f"Generated {len(generated)} payroll records.", "generated": generated, "errors": errors}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["patch"])
    def approve(self, request, pk=None):
        payroll = self.get_object()
        payroll.status = "approved"
        payroll.save(update_fields=["status", "updated_at"])
        return Response(self.get_serializer(payroll).data)

    @action(detail=True, methods=["patch"])
    @transaction.atomic
    def mark_paid(self, request, pk=None):
        payroll = self.get_object()
        payroll.status = "paid"
        payroll.payment_date = request.data.get("payment_date") or date.today()
        payroll.payment_method = request.data.get("payment_method") or payroll.payment_method
        payroll.apply_advance_deductions()
        payroll.save(update_fields=["status", "payment_date", "payment_method", "updated_at"])
        return Response(self.get_serializer(payroll).data)

    @action(detail=False, methods=["get"])
    def summary(self, request):
        qs = self.get_queryset()
        payload = {
            "records": qs.count(),
            "gross_amount": qs.aggregate(total=Coalesce(Sum("gross_amount"), Decimal("0.00")))["total"],
            "advances": qs.aggregate(total=Coalesce(Sum("advances"), Decimal("0.00")))["total"],
            "deductions": qs.aggregate(total=Coalesce(Sum("deductions"), Decimal("0.00")))["total"],
            "net_amount": qs.aggregate(total=Coalesce(Sum("net_amount"), Decimal("0.00")))["total"],
            "pending": qs.exclude(status="paid").count(),
            "paid": qs.filter(status="paid").count(),
        }
        start_date = request.query_params.get("start_date")
        end_date = request.query_params.get("end_date")
        if start_date and end_date:
            calendar_type = get_module_calendar("daily_worker_payroll", request=request)
            start = parse_calendar_date(start_date, calendar_type)
            end = parse_calendar_date(end_date, calendar_type)
            calendar_summary = get_work_calendar_service().get_range_summary(start, end)
            payload.update({
                "total_calendar_days": calendar_summary["total_calendar_days"],
                "total_working_days": calendar_summary["total_working_days"],
                "weekly_off_days": calendar_summary["weekly_off_days"],
                "official_holidays": calendar_summary["official_holidays"],
                "calendar_summary": calendar_summary,
            })
        return Response(payload)

    @action(detail=False, methods=["get"])
    def reports(self, request):
        payrolls = self.get_queryset()
        attendance = WorkerAttendance.objects.select_related("worker", "project")
        project = request.query_params.get("project")
        worker = request.query_params.get("worker")
        if project:
            attendance = attendance.filter(project_id=project)
        if worker:
            attendance = attendance.filter(worker_id=worker)

        monthly_labor_cost = list(
            payrolls.annotate(month=TruncMonth("period_start"))
            .values("month", "currency")
            .annotate(total=Coalesce(Sum("net_amount"), Decimal("0.00")), count=Count("id"))
            .order_by("month")
        )
        for row in monthly_labor_cost:
            row["month"] = row["month"].strftime("%Y-%m") if row["month"] else None

        return Response({
            "worker_attendance_summary": list(attendance.values("worker_id", "worker__full_name").annotate(records=Count("id"), overtime_hours=Coalesce(Sum("overtime_hours"), Decimal("0.00")))),
            "worker_payroll_summary": list(payrolls.values("worker_id", "worker__full_name", "currency").annotate(gross=Coalesce(Sum("gross_amount"), Decimal("0.00")), net=Coalesce(Sum("net_amount"), Decimal("0.00")), advances=Coalesce(Sum("advances"), Decimal("0.00")))),
            "monthly_labor_cost": monthly_labor_cost,
            "project_labor_cost": list(payrolls.values("project_id", "project__name", "currency").annotate(total=Coalesce(Sum("net_amount"), Decimal("0.00")), records=Count("id"))),
            "worker_payment_history": WorkerPayrollSerializer(payrolls.filter(status="paid")[:100], many=True).data,
            "attendance_statistics": {
                "present": attendance.filter(status="present").count(),
                "absent": attendance.filter(status="absent").count(),
                "half_day": attendance.filter(status="half_day").count(),
                "overtime": attendance.filter(status="overtime").count(),
            },
            "payroll_statistics": {
                "draft": payrolls.filter(status="draft").count(),
                "approved": payrolls.filter(status="approved").count(),
                "paid": payrolls.filter(status="paid").count(),
            },
        })
