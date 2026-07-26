from rest_framework import serializers
from common.serializers import CalendarModelSerializer
from .models import Expense
from project.models import Project
from .services import approval_history, is_expense_approval_enabled

class ExpenseSerializer(CalendarModelSerializer):
    calendar_module = "expenses"
    project = serializers.PrimaryKeyRelatedField(
        queryset=Project.objects.all(),
        required=False,
        allow_null=True,
    )
    # Add read-only calculated fields to API responses
    total_usd = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)
    total_afn = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)
    # Show project name in responses while accepting project ID on create/update
    project_name = serializers.SerializerMethodField()
    expense_scope_display = serializers.CharField(source="get_expense_scope_display", read_only=True)
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
            "expense_scope",
            "expense_scope_display",
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
            "expense_scope_display",
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

    def get_project_name(self, obj):
        return obj.project_label

    def validate(self, data):
        # API level validation matching model rules
        instance = self.instance
        amount_afn = data.get("amount_afn", getattr(instance, "amount_afn", 0))
        amount_usd = data.get("amount_usd", getattr(instance, "amount_usd", 0))
        expense_scope = data.get(
            "expense_scope",
            getattr(instance, "expense_scope", Expense.ExpenseScope.PROJECT),
        )
        project = data.get("project", getattr(instance, "project", None))

        if amount_afn <= 0 and amount_usd <=0:
            raise serializers.ValidationError("Expense must have at least one amount (AFN or USD) greater than 0")
        if amount_afn > 0 and amount_usd > 0:
            raise serializers.ValidationError("Expense cannot contain both AFN and USD amounts")
        if expense_scope == Expense.ExpenseScope.OFFICE and project:
            raise serializers.ValidationError("Office expenses cannot be linked to a project")
        if expense_scope == Expense.ExpenseScope.PROJECT and not project:
            raise serializers.ValidationError("Project expenses must be linked to a project")
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
