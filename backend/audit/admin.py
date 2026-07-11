from django.contrib import admin

from .models import AuditLog, AuditRetentionPolicy


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ("timestamp", "user", "action", "status", "model_name", "object_id")
    list_filter = ("status", "action", "model_name", "timestamp")
    search_fields = ("action", "model_name", "object_id", "object_repr", "description", "user__username")
    readonly_fields = [field.name for field in AuditLog._meta.fields]


@admin.register(AuditRetentionPolicy)
class AuditRetentionPolicyAdmin(admin.ModelAdmin):
    list_display = ("keep_forever", "archive_after_months", "updated_at", "updated_by")

