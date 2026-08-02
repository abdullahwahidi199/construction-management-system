from django.db import models
from django.conf import settings
from project.models import Project  # Assuming projects app with Project model
from django.db import transaction
from django.db.models import Max, Q
from django.utils import timezone
from decimal import Decimal, ROUND_HALF_UP
from subcontractor.models import Contract


from django.core.exceptions import ValidationError


class ExpenseQuerySet(models.QuerySet):
    def approved(self):
        return self.filter(approval_status=Expense.ApprovalStatus.APPROVED)

    def pending(self):
        return self.filter(approval_status=Expense.ApprovalStatus.PENDING)

    def rejected(self):
        return self.filter(approval_status=Expense.ApprovalStatus.REJECTED)

    def for_financials(self):
        return self.approved()


class ApprovedExpenseManager(models.Manager):
    def get_queryset(self):
        return ExpenseQuerySet(self.model, using=self._db).approved()

class Expense(models.Model):
    class ExpenseScope(models.TextChoices):
        PROJECT = "project", "Project Expense"
        OFFICE = "office", "Office Expense"

    class ApprovalStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"

    PROJECT_EXPENSE_TYPE_CHOICES = [
        ("general", "General Expense"),
        ("material", "Construction Material"),
        ("construction", "Construction"),
        ("staff_salary", "Staff Salary"),
        ("daily_wage", "Daily Worker Wage"),
        ("contract_payment", "Contract/Subcontractor Payment"),
        ("equipment", "Equipment Rental/Purchase"),
        ("utility", "Utility Bill"),
        ("other", "Other"),
    ]

    OFFICE_EXPENSE_TYPE_CHOICES = [
        ("office_rent", "Office Rent"),
        ("utilities", "Utilities"),
        ("internet", "Internet"),
        ("office_supplies", "Office Supplies"),
        ("staff_meals", "Staff Meals"),
        ("transportation", "Transportation"),
        ("fuel", "Fuel"),
        ("cleaning", "Cleaning"),
        ("maintenance", "Maintenance"),
        ("equipment", "Equipment"),
        ("software_subscriptions", "Software & Subscriptions"),
        ("miscellaneous", "Miscellaneous"),
    ]

    # Expense categories for future use, all historical imports default to general
    EXPENSE_TYPE_CHOICES = [
        *PROJECT_EXPENSE_TYPE_CHOICES,
        ("office_rent", "Office Rent"),
        ("utilities", "Utilities"),
        ("internet", "Internet"),
        ("office_supplies", "Office Supplies"),
        ("staff_meals", "Staff Meals"),
        ("transportation", "Transportation"),
        ("fuel", "Fuel"),
        ("cleaning", "Cleaning"),
        ("maintenance", "Maintenance"),
        ("software_subscriptions", "Software & Subscriptions"),
        ("salaries", "Salaries"),
        ("miscellaneous", "Miscellaneous"),
    ]

    expense_scope = models.CharField(
        max_length=20,
        choices=ExpenseScope.choices,
        default=ExpenseScope.PROJECT,
        db_index=True,
    )

    # Link expense to its parent project (each Excel sheet is 1 project)
    project = models.ForeignKey(
        Project,
        null=True,
        blank=True,
        on_delete=models.PROTECT, # Prevents accidental deletion of projects with expenses
        related_name="expenses"
    )
    contract = models.ForeignKey(
        Contract,
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name="expenses",
        help_text="Optional contract this expense belongs to.",
    )

    # Matches your S/N / شماره column, keeps your original numbering from Excel
    # serial_number = models.PositiveIntegerField(help_text="Serial number as shown on project expense sheet")
    serial_number = models.PositiveIntegerField(
        editable=False,  # 👈 user cannot set it
        help_text="Auto-generated per project or office ledger"
    )

    # Matches your DATE / تاریخ column
    expense_date = models.DateField()

    # Matches your main Description / توضیحات / تفصیلات column
    description = models.TextField(help_text="Details of what the expense was for")
    # Matches your Remarks / ملاحظات column (optional, not used on all sheets)
    remarks = models.TextField(blank=True, default="")

    # Optional field for future use, does not interfere with imports
    paid_to = models.CharField(max_length=255, blank=True, default="", help_text="Person/company paid")

    # Currency fields, exactly matches your sheet structure
    amount_afn = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0.00,
        help_text="Amount paid in Afghan Afghani"
    )
    amount_usd = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0.00,
        help_text="Amount paid in US Dollars"
    )
    # Matches your Exchange Rate / نرخ اسعار column (AFN per 1 USD for this entry)
    exchange_rate = models.DecimalField(
        max_digits=10,
        decimal_places=4,
        default=0.00,
        help_text="Exchange rate (AFN per 1 USD) on expense date"
    )

    expense_type = models.CharField(
        max_length=30,
        choices=EXPENSE_TYPE_CHOICES,
        default="general"
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="created_expenses",
    )
    approval_status = models.CharField(
        max_length=20,
        choices=ApprovalStatus.choices,
        default=ApprovalStatus.APPROVED,
        db_index=True,
    )
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="approved_expenses",
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    approval_notes = models.TextField(blank=True, default="")
    rejected_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="rejected_expenses",
    )
    rejected_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = ExpenseQuerySet.as_manager()
    approved_objects = ApprovedExpenseManager()

    class Meta:
        ordering = ["expense_scope", "project", "expense_date", "serial_number"]
        constraints = [
            models.UniqueConstraint(
                fields=["project", "serial_number"],
                condition=Q(project__isnull=False),
                name="unique_serial_per_project",
            ),
            models.UniqueConstraint(
                fields=["expense_scope", "serial_number"],
                condition=Q(expense_scope="office"),
                name="unique_serial_for_office_expenses",
            ),
            models.CheckConstraint(
                check=(
                    Q(expense_scope="project", project__isnull=False)
                    | Q(expense_scope="office", project__isnull=True)
                ),
                name="expense_scope_matches_project",
            ),
            models.CheckConstraint(
                check=(
                    Q(expense_scope="project")
                    | Q(expense_scope="office", contract__isnull=True)
                ),
                name="office_expenses_do_not_link_contract",
            ),
        ]

    def __str__(self):
        return f"{self.project_label} - Expense #{self.serial_number} ({self.expense_date})"

    @property
    def is_office_expense(self):
        return self.expense_scope == self.ExpenseScope.OFFICE

    @property
    def is_project_expense(self):
        return self.expense_scope == self.ExpenseScope.PROJECT

    @property
    def project_label(self):
        if self.is_office_expense:
            return "Office"
        return self.project.name if self.project_id and self.project else ""

    @property
    def is_approved(self):
        return self.approval_status == self.ApprovalStatus.APPROVED

    @property
    def is_pending(self):
        return self.approval_status == self.ApprovalStatus.PENDING

    @property
    def is_rejected(self):
        return self.approval_status == self.ApprovalStatus.REJECTED

    def mark_approved(self, user, notes=""):
        self.approval_status = self.ApprovalStatus.APPROVED
        self.approved_by = user
        self.approved_at = timezone.now()
        self.approval_notes = notes or ""
        self.rejected_by = None
        self.rejected_at = None

    def mark_rejected(self, user, notes=""):
        self.approval_status = self.ApprovalStatus.REJECTED
        self.rejected_by = user
        self.rejected_at = timezone.now()
        self.approval_notes = notes or ""
        self.approved_by = None
        self.approved_at = None

    # --- CALCULATED PROPERTIES (matches your EXACT Excel formulas!) ---
    @property
    def total_usd(self):
        """USD amount only. AFN is intentionally not converted into USD."""
        return round(self.amount_usd, 2)

    @property
    def total_afn(self):
        """AFN amount only. USD is intentionally not converted into AFN."""
        return round(self.amount_afn, 2)

    @property
    def total_usd_equivalent(self):
        """Expense total converted to USD using this row's exchange rate."""
        total = self.amount_usd or Decimal("0.00")
        if self.amount_afn and self.exchange_rate and self.exchange_rate > 0:
            total += self.amount_afn / self.exchange_rate
        return total.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    @property
    def total_afn_equivalent(self):
        """Expense total converted to AFN using this row's exchange rate."""
        total = self.amount_afn or Decimal("0.00")
        if self.amount_usd and self.exchange_rate and self.exchange_rate > 0:
            total += self.amount_usd * self.exchange_rate
        return total.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    def clean(self):
        # Add database level validation matching your business rules
        if self.expense_scope == self.ExpenseScope.OFFICE and self.project_id:
            raise ValidationError("Office expenses cannot be linked to a project")
        if self.expense_scope == self.ExpenseScope.OFFICE and self.contract_id:
            raise ValidationError("Office expenses cannot be linked to a contract")
        if self.expense_scope == self.ExpenseScope.PROJECT and not self.project_id:
            raise ValidationError("Project expenses must be linked to a project")
        if self.contract_id and self.project_id and self.contract.project_id != self.project_id:
            raise ValidationError("Expense contract must belong to the selected project")
        if self.amount_afn <=0 and self.amount_usd <=0:
            raise ValidationError("Expense must have at least one amount (AFN or USD) greater than 0")
        if self.amount_afn > 0 and self.amount_usd > 0:
            raise ValidationError("Expense cannot contain both AFN and USD amounts")

    def _serial_scope_filter(self):
        if self.is_office_expense:
            return {"expense_scope": self.ExpenseScope.OFFICE}
        return {"project_id": self.project_id}

    def _serial_ledger_changed(self):
        if not self.pk:
            return False

        previous = (
            Expense.objects
            .filter(pk=self.pk)
            .values("expense_scope", "project_id")
            .first()
        )
        if not previous:
            return False

        return (
            previous["expense_scope"] != self.expense_scope
            or previous["project_id"] != self.project_id
        )

    def save(self, *args, **kwargs):
        should_generate_serial = (
            not self.serial_number
            or self._serial_ledger_changed()
        )

        if should_generate_serial:
            with transaction.atomic():
                last_serial = (
                    Expense.objects
                    .filter(**self._serial_scope_filter())
                    .exclude(pk=self.pk)
                    .aggregate(max_serial=Max("serial_number"))
                    .get("max_serial")
                )

                self.serial_number = (last_serial or 0) + 1

                update_fields = kwargs.get("update_fields")
                if update_fields is not None:
                    kwargs["update_fields"] = set(update_fields) | {"serial_number"}

        super().save(*args, **kwargs)


class ExpenseEditRequest(models.Model):
    class ApprovalStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"

    expense = models.ForeignKey(
        Expense,
        on_delete=models.CASCADE,
        related_name="edit_requests",
    )
    original_values = models.JSONField(default=dict)
    proposed_values = models.JSONField(default=dict)
    changed_fields = models.JSONField(default=list)
    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="requested_expense_edits",
    )
    requested_at = models.DateTimeField(auto_now_add=True)
    approval_status = models.CharField(
        max_length=20,
        choices=ApprovalStatus.choices,
        default=ApprovalStatus.PENDING,
        db_index=True,
    )
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="reviewed_expense_edits",
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    approval_notes = models.TextField(blank=True, default="")
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-requested_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["expense"],
                condition=Q(approval_status="pending"),
                name="unique_pending_edit_request_per_expense",
            ),
        ]

    def __str__(self):
        return f"Edit request for {self.expense}"

    @property
    def is_pending(self):
        return self.approval_status == self.ApprovalStatus.PENDING

    @property
    def is_approved(self):
        return self.approval_status == self.ApprovalStatus.APPROVED

    @property
    def is_rejected(self):
        return self.approval_status == self.ApprovalStatus.REJECTED

    def mark_approved(self, user, notes=""):
        self.approval_status = self.ApprovalStatus.APPROVED
        self.reviewed_by = user
        self.reviewed_at = timezone.now()
        self.approval_notes = notes or ""

    def mark_rejected(self, user, notes=""):
        self.approval_status = self.ApprovalStatus.REJECTED
        self.reviewed_by = user
        self.reviewed_at = timezone.now()
        self.approval_notes = notes or ""
