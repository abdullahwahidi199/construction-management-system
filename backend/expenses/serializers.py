from rest_framework import serializers
from common.serializers import CalendarModelSerializer
from .models import Expense
from project.models import Project
from .services import approval_history, is_expense_approval_enabled

class ExpenseSerializer(CalendarModelSerializer):
    calendar_module = "expenses"
    # Add read-only calculated fields to API responses
    total_usd = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)
    total_afn = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)
    # Show project name in responses while accepting project ID on create/update
    project_name = serializers.CharField(source="project.name", read_only=True)
    created_by_name = serializers.CharField(source="created_by.username", read_only=True)
    approved_by_name = serializers.CharField(source="approved_by.username", read_only=True)
    rejected_by_name = serializers.CharField(source="rejected_by.username", read_only=True)
    can_print = serializers.SerializerMethodField()
    can_export = serializers.SerializerMethodField()
    approval_history = serializers.SerializerMethodField()

    class Meta:
        model = Expense
        fields = [
            "id",
            "project",
            "project_name",
            "serial_number",
            "expense_date",
            "description",
            "remarks",
            "paid_to",
            "amount_afn",
            "amount_usd",
            "exchange_rate",
            "expense_type",
            "total_usd",
            "total_afn",
            "created_by",
            "created_by_name",
            "approval_status",
            "approved_by",
            "approved_by_name",
            "approved_at",
            "approval_notes",
            "rejected_by",
            "rejected_by_name",
            "rejected_at",
            "can_print",
            "can_export",
            "approval_history",
            "created_at",
            "updated_at"
        ]
        read_only_fields = [
            "serial_number",
            "created_by",
            "created_by_name",
            "approval_status",
            "approved_by",
            "approved_by_name",
            "approved_at",
            "approval_notes",
            "rejected_by",
            "rejected_by_name",
            "rejected_at",
            "can_print",
            "can_export",
            "approval_history",
            "created_at",
            "updated_at",
        ]

    def get_can_print(self, obj):
        return obj.approval_status == Expense.ApprovalStatus.APPROVED

    def get_can_export(self, obj):
        return obj.approval_status == Expense.ApprovalStatus.APPROVED

    def get_approval_history(self, obj):
        return approval_history(obj)

    def validate(self, data):
        # API level validation matching model rules
        amount_afn = data.get("amount_afn", 0)
        amount_usd = data.get("amount_usd", 0)
        exchange_rate = data.get("exchange_rate", 0)

        if amount_afn <= 0 and amount_usd <=0:
            raise serializers.ValidationError("Expense must have at least one amount (AFN or USD) greater than 0")
        if amount_afn > 0 and exchange_rate <=0:
            raise serializers.ValidationError("Exchange rate is required when recording AFN expenses")
        return data
    

class ProjectExpenseSerializer(CalendarModelSerializer):
    calendar_module = "expenses"
    class Meta:
        model = Expense
        fields = [
            "id",
            "serial_number",
            "total_usd",
            "total_afn"
        ]


class ExpenseApprovalActionSerializer(serializers.Serializer):
    approval_notes = serializers.CharField(
        required=False,
        allow_blank=True,
        trim_whitespace=True,
    )


class ExpenseApprovalSettingsSerializer(serializers.Serializer):
    enabled = serializers.BooleanField(default=False)

    def to_representation(self, instance):
        if isinstance(instance, dict):
            return {"enabled": bool(instance.get("enabled", False))}
        return {"enabled": is_expense_approval_enabled()}
