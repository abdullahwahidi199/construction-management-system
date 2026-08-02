from rest_framework import serializers
from common.serializers import CalendarModelSerializer
from .models import Expense, ExpenseEditRequest
from project.models import Project
from subcontractor.models import Contract
from .services import approval_history, is_expense_approval_enabled

class ExpenseSerializer(CalendarModelSerializer):
    calendar_module = "expenses"
    project = serializers.PrimaryKeyRelatedField(
        queryset=Project.objects.all(),
        required=False,
        allow_null=True,
    )
    contract = serializers.PrimaryKeyRelatedField(
        queryset=Contract.objects.all(),
        required=False,
        allow_null=True,
    )
    # Add read-only calculated fields to API responses
    total_usd = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)
    total_afn = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)
    total_usd_equivalent = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)
    total_afn_equivalent = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)
    # Show project name in responses while accepting project ID on create/update
    project_name = serializers.SerializerMethodField()
    contract_label = serializers.SerializerMethodField()
    contract_number = serializers.CharField(source="contract.contract_number", read_only=True)
    contract_title = serializers.CharField(source="contract.title", read_only=True)
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
            "contract",
            "contract_label",
            "contract_number",
            "contract_title",
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
            "total_usd_equivalent",
            "total_afn_equivalent",
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
            "contract_label",
            "contract_number",
            "contract_title",
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

    def get_contract_label(self, obj):
        if not obj.contract_id or not obj.contract:
            return ""
        return f"{obj.contract.contract_number} - {obj.contract.title}"

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
        contract = data.get("contract", getattr(instance, "contract", None))

        if amount_afn <= 0 and amount_usd <=0:
            raise serializers.ValidationError("Expense must have at least one amount (AFN or USD) greater than 0")
        if amount_afn > 0 and amount_usd > 0:
            raise serializers.ValidationError("Expense cannot contain both AFN and USD amounts")
        if expense_scope == Expense.ExpenseScope.OFFICE and project:
            raise serializers.ValidationError("Office expenses cannot be linked to a project")
        if expense_scope == Expense.ExpenseScope.OFFICE and contract:
            raise serializers.ValidationError("Office expenses cannot be linked to a contract")
        if expense_scope == Expense.ExpenseScope.PROJECT and not project:
            raise serializers.ValidationError("Project expenses must be linked to a project")
        if contract and project and contract.project_id != project.id:
            raise serializers.ValidationError({
                "contract": "Selected contract must belong to the selected project."
            })
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


EXPENSE_EDIT_FIELD_LABELS = {
    "expense_scope": "Expense scope",
    "project": "Project",
    "contract": "Contract",
    "expense_date": "Expense date",
    "description": "Description",
    "remarks": "Remarks",
    "paid_to": "Paid to",
    "amount_afn": "Amount AFN",
    "amount_usd": "Amount USD",
    "exchange_rate": "Exchange rate",
    "expense_type": "Expense type",
}


class ExpenseEditRequestSerializer(serializers.ModelSerializer):
    approval_item_type = serializers.SerializerMethodField()
    queue_id = serializers.SerializerMethodField()
    edit_request_id = serializers.IntegerField(source="id", read_only=True)
    expense_id = serializers.IntegerField(read_only=True)
    project = serializers.SerializerMethodField()
    project_name = serializers.SerializerMethodField()
    contract = serializers.SerializerMethodField()
    contract_label = serializers.SerializerMethodField()
    contract_number = serializers.SerializerMethodField()
    contract_title = serializers.SerializerMethodField()
    serial_number = serializers.IntegerField(source="expense.serial_number", read_only=True)
    expense_date = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()
    remarks = serializers.SerializerMethodField()
    paid_to = serializers.SerializerMethodField()
    expense_scope = serializers.SerializerMethodField()
    expense_type = serializers.SerializerMethodField()
    amount_afn = serializers.SerializerMethodField()
    amount_usd = serializers.SerializerMethodField()
    exchange_rate = serializers.SerializerMethodField()
    total_usd = serializers.SerializerMethodField()
    total_afn = serializers.SerializerMethodField()
    created_by = serializers.IntegerField(source="requested_by_id", read_only=True)
    created_by_name = serializers.CharField(source="requested_by.username", read_only=True)
    approval_status = serializers.CharField(read_only=True)
    approval_notes = serializers.CharField(read_only=True)
    created_at = serializers.DateTimeField(source="requested_at", read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)
    approved_by = serializers.SerializerMethodField()
    approved_by_name = serializers.SerializerMethodField()
    approved_at = serializers.SerializerMethodField()
    rejected_by = serializers.SerializerMethodField()
    rejected_by_name = serializers.SerializerMethodField()
    rejected_at = serializers.SerializerMethodField()
    approval_history = serializers.SerializerMethodField()
    field_changes = serializers.SerializerMethodField()

    class Meta:
        model = ExpenseEditRequest
        fields = [
            "id",
            "queue_id",
            "approval_item_type",
            "edit_request_id",
            "expense_id",
            "project",
            "project_name",
            "contract",
            "contract_label",
            "contract_number",
            "contract_title",
            "serial_number",
            "expense_date",
            "description",
            "remarks",
            "paid_to",
            "expense_scope",
            "expense_type",
            "amount_afn",
            "amount_usd",
            "exchange_rate",
            "total_usd",
            "total_afn",
            "created_by",
            "created_by_name",
            "approval_status",
            "approval_notes",
            "created_at",
            "updated_at",
            "approved_by",
            "approved_by_name",
            "approved_at",
            "rejected_by",
            "rejected_by_name",
            "rejected_at",
            "original_values",
            "proposed_values",
            "changed_fields",
            "field_changes",
            "approval_history",
        ]
        read_only_fields = fields

    def get_approval_item_type(self, obj):
        return "expense_edit"

    def get_queue_id(self, obj):
        return f"expense-edit:{obj.id}"

    def _proposed(self, obj, field, fallback=None):
        if field in (obj.proposed_values or {}):
            return obj.proposed_values.get(field)
        return fallback

    def get_project(self, obj):
        return self._proposed(obj, "project", obj.expense.project_id)

    def get_project_name(self, obj):
        project_id = self.get_project(obj)
        if obj.proposed_values.get("expense_scope") == Expense.ExpenseScope.OFFICE:
            return "Office"
        if project_id == obj.expense.project_id:
            return obj.expense.project_label
        project = Project.objects.filter(pk=project_id).only("name").first()
        return project.name if project else obj.expense.project_label

    def get_contract(self, obj):
        return self._proposed(obj, "contract", obj.expense.contract_id)

    def _contract_for_value(self, obj, contract_id):
        if not contract_id:
            return None
        if contract_id == obj.expense.contract_id:
            return obj.expense.contract
        return Contract.objects.filter(pk=contract_id).only(
            "contract_number",
            "title",
        ).first()

    def get_contract_label(self, obj):
        contract = self._contract_for_value(obj, self.get_contract(obj))
        if not contract:
            return ""
        return f"{contract.contract_number} - {contract.title}"

    def get_contract_number(self, obj):
        contract = self._contract_for_value(obj, self.get_contract(obj))
        return contract.contract_number if contract else ""

    def get_contract_title(self, obj):
        contract = self._contract_for_value(obj, self.get_contract(obj))
        return contract.title if contract else ""

    def get_expense_date(self, obj):
        return self._proposed(obj, "expense_date", obj.expense.expense_date.isoformat())

    def get_description(self, obj):
        return self._proposed(obj, "description", obj.expense.description)

    def get_remarks(self, obj):
        return self._proposed(obj, "remarks", obj.expense.remarks)

    def get_paid_to(self, obj):
        return self._proposed(obj, "paid_to", obj.expense.paid_to)

    def get_expense_scope(self, obj):
        return self._proposed(obj, "expense_scope", obj.expense.expense_scope)

    def get_expense_type(self, obj):
        return self._proposed(obj, "expense_type", obj.expense.expense_type)

    def get_amount_afn(self, obj):
        return self._proposed(obj, "amount_afn", str(obj.expense.amount_afn))

    def get_amount_usd(self, obj):
        return self._proposed(obj, "amount_usd", str(obj.expense.amount_usd))

    def get_exchange_rate(self, obj):
        return self._proposed(obj, "exchange_rate", str(obj.expense.exchange_rate))

    def get_total_usd(self, obj):
        return self.get_amount_usd(obj)

    def get_total_afn(self, obj):
        return self.get_amount_afn(obj)

    def get_approved_by(self, obj):
        return obj.reviewed_by_id if obj.is_approved else None

    def get_approved_by_name(self, obj):
        return obj.reviewed_by.username if obj.is_approved and obj.reviewed_by else ""

    def get_approved_at(self, obj):
        return obj.reviewed_at if obj.is_approved else None

    def get_rejected_by(self, obj):
        return obj.reviewed_by_id if obj.is_rejected else None

    def get_rejected_by_name(self, obj):
        return obj.reviewed_by.username if obj.is_rejected and obj.reviewed_by else ""

    def get_rejected_at(self, obj):
        return obj.reviewed_at if obj.is_rejected else None

    def get_field_changes(self, obj):
        original = obj.original_values or {}
        proposed = obj.proposed_values or {}
        return [
            {
                "field": field,
                "label": EXPENSE_EDIT_FIELD_LABELS.get(field, field.replace("_", " ").title()),
                "before": original.get(field),
                "after": proposed.get(field),
                "before_display": self._display_change_value(field, original.get(field)),
                "after_display": self._display_change_value(field, proposed.get(field)),
            }
            for field in (obj.changed_fields or [])
        ]

    def _display_change_value(self, field, value):
        if value in (None, ""):
            return "-"
        if field == "project":
            return (
                Project.objects.filter(pk=value).values_list("name", flat=True).first()
                or "Office"
            )
        if field == "contract":
            row = (
                Contract.objects.filter(pk=value)
                .values_list("contract_number", "title")
                .first()
            )
            return f"{row[0]} - {row[1]}" if row else "-"
        if field == "expense_scope":
            return "Office expense" if value == Expense.ExpenseScope.OFFICE else "Project expense"
        return str(value)

    def get_approval_history(self, obj):
        history = []
        if obj.requested_at:
            history.append({
                "status": "edit requested",
                "at": obj.requested_at.isoformat(),
                "by": getattr(obj.requested_by, "username", None),
                "notes": "",
            })
        if obj.reviewed_at:
            history.append({
                "status": obj.approval_status,
                "at": obj.reviewed_at.isoformat(),
                "by": getattr(obj.reviewed_by, "username", None),
                "notes": obj.approval_notes,
            })
        return history
