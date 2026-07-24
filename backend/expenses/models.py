from django.db import models
from django.conf import settings
from project.models import Project  # Assuming projects app with Project model
from django.db import transaction
from django.db.models import Max
from django.utils import timezone


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
    class ApprovalStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"

    # Expense categories for future use, all historical imports default to general
    EXPENSE_TYPE_CHOICES = [
        ("general", "General Expense"),  # All your current Excel sheet entries
        ("material", "Construction Material"),
        ("construction", "Construction"),
        ("staff_salary", "Staff Salary"),
        ("daily_wage", "Daily Worker Wage"),
        ("contract_payment", "Contract/Subcontractor Payment"),
        ("equipment", "Equipment Rental/Purchase"),
        ("utility", "Utility Bill"),
        ("other", "Other"),
    ]

    # Link expense to its parent project (each Excel sheet is 1 project)
    project = models.ForeignKey(
        Project,
        on_delete=models.PROTECT, # Prevents accidental deletion of projects with expenses
        related_name="expenses"
    )

    # Matches your S/N / شماره column, keeps your original numbering from Excel
    # serial_number = models.PositiveIntegerField(help_text="Serial number as shown on project expense sheet")
    serial_number = models.PositiveIntegerField(
        editable=False,  # 👈 user cannot set it
        help_text="Auto-generated per project"
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
        ordering = ["project", "expense_date", "serial_number"]
        # Prevent duplicate serial numbers per project (matches how your Excel works)
        constraints = [
            models.UniqueConstraint(fields=["project", "serial_number"], name="unique_serial_per_project")
        ]

    def __str__(self):
        return f"{self.project.name} - Expense #{self.serial_number} ({self.expense_date})"

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

    def clean(self):
        # Add database level validation matching your business rules
        if self.amount_afn <=0 and self.amount_usd <=0:
            raise ValidationError("Expense must have at least one amount (AFN or USD) greater than 0")
        if self.amount_afn > 0 and self.amount_usd > 0:
            raise ValidationError("Expense cannot contain both AFN and USD amounts")
    
    def save(self, *args, **kwargs):
        if not self.serial_number:
            with transaction.atomic():
                last_serial = (
                    Expense.objects
                    .filter(project=self.project)
                    .aggregate(max_serial=Max("serial_number"))
                    .get("max_serial")
                )

                self.serial_number = (last_serial or 0) + 1

        super().save(*args, **kwargs)
