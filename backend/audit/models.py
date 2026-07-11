from django.conf import settings
from django.db import models


class AuditLog(models.Model):
    class Status(models.TextChoices):
        SUCCESS = "success", "Success"
        FAILED = "failed", "Failed"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="audit_logs",
    )
    organization_label = models.CharField(max_length=255, blank=True, default="")
    action = models.CharField(max_length=80, db_index=True)
    model_name = models.CharField(max_length=120, blank=True, default="", db_index=True)
    object_id = models.CharField(max_length=120, blank=True, default="", db_index=True)
    object_repr = models.CharField(max_length=500, blank=True, default="")
    old_data = models.JSONField(default=dict, blank=True)
    new_data = models.JSONField(default=dict, blank=True)
    description = models.TextField(blank=True, default="")
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, default="")
    request_method = models.CharField(max_length=12, blank=True, default="")
    endpoint = models.TextField(blank=True, default="")
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.SUCCESS,
        db_index=True,
    )
    extra_metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["-timestamp"]
        indexes = [
            models.Index(fields=["timestamp"]),
            models.Index(fields=["user"]),
            models.Index(fields=["model_name"]),
            models.Index(fields=["object_id"]),
            models.Index(fields=["action"]),
            models.Index(fields=["model_name", "object_id"]),
            models.Index(fields=["action", "timestamp"]),
            models.Index(fields=["status", "timestamp"]),
        ]

    def __str__(self):
        return f"{self.timestamp:%Y-%m-%d %H:%M:%S} {self.action} {self.model_name}:{self.object_id}"


class AuditRetentionPolicy(models.Model):
    keep_forever = models.BooleanField(default=True)
    archive_after_months = models.PositiveIntegerField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="updated_audit_retention_policies",
    )

    class Meta:
        verbose_name = "Audit retention policy"
        verbose_name_plural = "Audit retention policies"

    def __str__(self):
        if self.keep_forever:
            return "Keep audit logs forever"
        return f"Archive audit logs after {self.archive_after_months} months"

