from rest_framework import serializers

from .models import AuditLog, AuditRetentionPolicy
from .utils import get_changed_fields


class AuditLogListSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    changed_field_count = serializers.SerializerMethodField()
    is_financial = serializers.SerializerMethodField()
    currency = serializers.SerializerMethodField()

    class Meta:
        model = AuditLog
        fields = [
            "id",
            "timestamp",
            "username",
            "action",
            "status",
            "model_name",
            "object_id",
            "object_repr",
            "endpoint",
            "ip_address",
            "changed_field_count",
            "is_financial",
            "currency",
        ]

    def get_changed_field_count(self, obj):
        return len(obj.extra_metadata.get("changed_fields", {}))

    def get_is_financial(self, obj):
        return bool(obj.extra_metadata.get("is_financial"))

    def get_currency(self, obj):
        return obj.extra_metadata.get("currency")


class AuditLogDetailSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    field_changes = serializers.SerializerMethodField()
    financial_changes = serializers.SerializerMethodField()
    warnings = serializers.SerializerMethodField()

    class Meta:
        model = AuditLog
        fields = [
            "id",
            "timestamp",
            "username",
            "action",
            "status",
            "model_name",
            "object_id",
            "object_repr",
            "old_data",
            "new_data",
            "field_changes",
            "financial_changes",
            "warnings",
            "description",
            "ip_address",
            "user_agent",
            "request_method",
            "endpoint",
            "extra_metadata",
        ]

    def get_field_changes(self, obj):
        return obj.extra_metadata.get("changed_fields") or get_changed_fields(obj.old_data, obj.new_data)

    def get_financial_changes(self, obj):
        return obj.extra_metadata.get("financial_changes", {})

    def get_warnings(self, obj):
        return obj.extra_metadata.get("warnings", [])


class AuditRetentionPolicySerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditRetentionPolicy
        fields = ["id", "keep_forever", "archive_after_months", "updated_at", "updated_by"]
        read_only_fields = ["id", "updated_at", "updated_by"]

    def validate(self, attrs):
        keep_forever = attrs.get("keep_forever", getattr(self.instance, "keep_forever", True))
        archive_after_months = attrs.get("archive_after_months", getattr(self.instance, "archive_after_months", None))
        if not keep_forever and not archive_after_months:
            raise serializers.ValidationError("archive_after_months is required when logs are not kept forever.")
        return attrs

