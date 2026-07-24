from datetime import date
from decimal import Decimal

from django.db.models import Sum
from rest_framework import serializers
from common.serializers import CalendarModelSerializer

from .models import DailyWorker, WorkerAdvance, WorkerAttendance, WorkerPayroll


class DailyWorkerSerializer(CalendarModelSerializer):
    calendar_module = "daily_workers"
    assigned_project_name = serializers.CharField(source="assigned_project.name", read_only=True)
    total_days_worked = serializers.SerializerMethodField()
    total_earnings = serializers.SerializerMethodField()
    pending_advances = serializers.SerializerMethodField()
    trade = serializers.CharField(source="skill_type", read_only=True)

    class Meta:
        model = DailyWorker
        fields = "__all__"
        read_only_fields = ["worker_id", "created_at", "updated_at"]

    def get_total_days_worked(self, obj):
        return sum(att.paid_days for att in obj.attendances.all())

    def get_total_earnings(self, obj):
        return obj.payrolls.aggregate(total=Sum("net_amount"))["total"] or Decimal("0.00")

    def get_pending_advances(self, obj):
        return obj.advances.aggregate(total=Sum("remaining_balance"))["total"] or Decimal("0.00")

    def validate(self, data):
        joining_date = data.get("joining_date", getattr(self.instance, "joining_date", None))
        if joining_date and joining_date > date.today():
            raise serializers.ValidationError({"joining_date": "Joining date cannot be in the future."})
        return data


class DailyWorkerListSerializer(CalendarModelSerializer):
    calendar_module = "daily_workers"
    assigned_project_name = serializers.CharField(source="assigned_project.name", read_only=True)
    trade = serializers.CharField(source="skill_type", read_only=True)
    is_active = serializers.BooleanField(read_only=True)

    class Meta:
        model = DailyWorker
        fields = [
            "id",
            "worker_id",
            "full_name",
            "phone",
            "skill_type",
            "trade",
            "specialization",
            "daily_rate",
            "overtime_hourly_rate",
            "currency",
            "assigned_project",
            "assigned_project_name",
            "status",
            "is_active",
            "joining_date",
        ]


class WorkerAttendanceSerializer(CalendarModelSerializer):
    calendar_module = "daily_worker_attendance"
    worker_name = serializers.CharField(source="worker.full_name", read_only=True)
    worker_code = serializers.CharField(source="worker.worker_id", read_only=True)
    skill_type = serializers.CharField(source="worker.skill_type", read_only=True)
    trade = serializers.CharField(source="worker.skill_type", read_only=True)
    project_name = serializers.CharField(source="project.name", read_only=True)

    class Meta:
        model = WorkerAttendance
        fields = "__all__"
        read_only_fields = ["created_at", "updated_at", "created_by"]

    def validate(self, data):
        attendance_date = data.get("date", getattr(self.instance, "date", None))
        status = data.get("status", getattr(self.instance, "status", None))
        overtime_hours = data.get("overtime_hours", getattr(self.instance, "overtime_hours", Decimal("0.00")))
        worker = data.get("worker", getattr(self.instance, "worker", None))

        if attendance_date and attendance_date > date.today():
            raise serializers.ValidationError({"date": "Cannot mark attendance for future dates."})
        if worker and not worker.is_active:
            raise serializers.ValidationError({"worker": "Cannot mark attendance for inactive workers."})
        if status == "absent" and overtime_hours and overtime_hours > 0:
            raise serializers.ValidationError({"overtime_hours": "Absent workers cannot have overtime."})
        return data


class BulkWorkerAttendanceSerializer(serializers.Serializer):
    date = serializers.DateField()
    project = serializers.IntegerField(required=False, allow_null=True)
    records = serializers.ListField(child=serializers.DictField())

    def to_internal_value(self, data):
        from common.calendar_utils import get_module_calendar, parse_calendar_date

        if isinstance(data, dict) and data.get("date"):
            data = data.copy()
            data["date"] = parse_calendar_date(data["date"], get_module_calendar("daily_worker_attendance", request=self.context.get("request")))
        return super().to_internal_value(data)

    def validate_date(self, value):
        if value > date.today():
            raise serializers.ValidationError("Cannot mark attendance for future dates.")
        return value

    def validate_records(self, value):
        if not value:
            raise serializers.ValidationError("At least one record is required.")
        valid_statuses = {choice[0] for choice in WorkerAttendance.STATUS_CHOICES}
        for index, record in enumerate(value, start=1):
            if "worker" not in record or "status" not in record:
                raise serializers.ValidationError(f"Record {index}: worker and status are required.")
            if record["status"] not in valid_statuses:
                raise serializers.ValidationError(f"Record {index}: invalid status.")
        return value


class WorkerAdvanceSerializer(CalendarModelSerializer):
    calendar_module = "worker_advances"
    worker_name = serializers.CharField(source="worker.full_name", read_only=True)
    worker_code = serializers.CharField(source="worker.worker_id", read_only=True)
    status = serializers.SerializerMethodField()

    class Meta:
        model = WorkerAdvance
        fields = "__all__"
        read_only_fields = ["created_at", "updated_at", "created_by", "status"]

    def get_status(self, obj):
        return "paid" if obj.is_paid else "open"

    def validate(self, data):
        if self.instance is None and "remaining_balance" not in data:
            data["remaining_balance"] = data.get("amount")
        if data.get("remaining_balance") and data.get("amount") and data["remaining_balance"] > data["amount"]:
            raise serializers.ValidationError({"remaining_balance": "Remaining balance cannot exceed amount."})
        return data


class WorkerPayrollSerializer(CalendarModelSerializer):
    calendar_module = "daily_worker_payroll"
    worker_name = serializers.CharField(source="worker.full_name", read_only=True)
    worker_id_code = serializers.CharField(source="worker.worker_id", read_only=True)
    project_name = serializers.CharField(source="project.name", read_only=True)
    total_days_worked = serializers.DecimalField(max_digits=7, decimal_places=2, read_only=True)
    total_overtime_hours = serializers.DecimalField(max_digits=7, decimal_places=2, read_only=True)
    net_pay = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    is_paid = serializers.BooleanField(read_only=True)

    class Meta:
        model = WorkerPayroll
        fields = "__all__"
        read_only_fields = [
            "present_days",
            "half_days",
            "absent_days",
            "overtime_hours",
            "gross_amount",
            "advances",
            "net_amount",
            "created_at",
            "updated_at",
            "created_by",
        ]
        extra_kwargs = {
            "daily_rate_applied": {"required": False},
            "overtime_rate_applied": {"required": False},
        }

    def validate(self, data):
        worker = data.get("worker", getattr(self.instance, "worker", None))
        period_start = data.get("period_start", getattr(self.instance, "period_start", None))
        period_end = data.get("period_end", getattr(self.instance, "period_end", None))
        if period_start and period_end and period_start > period_end:
            raise serializers.ValidationError({"period_end": "End date must be after start date."})
        if worker and not worker.is_active and self.instance is None:
            raise serializers.ValidationError({"worker": "Cannot create payroll for an inactive worker."})
        if worker and self.instance is None and "daily_rate_applied" not in data:
            data["daily_rate_applied"] = worker.daily_rate
        if worker and self.instance is None and "overtime_rate_applied" not in data:
            data["overtime_rate_applied"] = worker.overtime_hourly_rate
        return data


class GenerateWorkerPayrollSerializer(serializers.Serializer):
    worker = serializers.IntegerField(required=False, allow_null=True)
    worker_ids = serializers.ListField(child=serializers.IntegerField(), required=False)
    project = serializers.IntegerField(required=False, allow_null=True)
    period_start = serializers.DateField()
    period_end = serializers.DateField()
    payment_method = serializers.ChoiceField(choices=WorkerPayroll.PAYMENT_METHOD_CHOICES, default="cash")
    deductions = serializers.DecimalField(max_digits=12, decimal_places=2, default=0)
    notes = serializers.CharField(required=False, allow_blank=True)

    def to_internal_value(self, data):
        from common.calendar_utils import get_module_calendar, parse_calendar_date

        if isinstance(data, dict):
            data = data.copy()
            calendar_type = get_module_calendar("daily_worker_payroll", request=self.context.get("request"))
            for field in ["period_start", "period_end"]:
                if data.get(field):
                    data[field] = parse_calendar_date(data[field], calendar_type)
        return super().to_internal_value(data)

    def validate(self, data):
        if data["period_start"] > data["period_end"]:
            raise serializers.ValidationError("Start date must be before end date.")
        return data
