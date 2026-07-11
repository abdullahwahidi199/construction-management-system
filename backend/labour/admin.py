from django.contrib import admin

from .models import DailyWorker, WorkerAdvance, WorkerAttendance, WorkerPayroll


@admin.register(DailyWorker)
class DailyWorkerAdmin(admin.ModelAdmin):
    list_display = ("worker_id", "full_name", "phone", "skill_type", "daily_rate", "currency", "status", "assigned_project")
    list_filter = ("status", "skill_type", "currency", "assigned_project")
    search_fields = ("worker_id", "full_name", "father_name", "phone", "national_id")


@admin.register(WorkerAttendance)
class WorkerAttendanceAdmin(admin.ModelAdmin):
    list_display = ("worker", "project", "date", "status", "overtime_hours")
    list_filter = ("status", "date", "project")
    search_fields = ("worker__full_name", "worker__worker_id")


@admin.register(WorkerAdvance)
class WorkerAdvanceAdmin(admin.ModelAdmin):
    list_display = ("worker", "amount", "remaining_balance", "currency", "date")
    list_filter = ("currency", "date")
    search_fields = ("worker__full_name", "worker__worker_id")


@admin.register(WorkerPayroll)
class WorkerPayrollAdmin(admin.ModelAdmin):
    list_display = ("worker", "project", "period_start", "period_end", "gross_amount", "advances", "net_amount", "status")
    list_filter = ("status", "currency", "project", "payment_method")
    search_fields = ("worker__full_name", "worker__worker_id")
