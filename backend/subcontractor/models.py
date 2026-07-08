from decimal import Decimal
from datetime import timedelta
from django.db import transaction

from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from .utils.file_compress import compress_image,compress_pdf

# ──────────────────────────────────────────────
# Choice Classes
# ──────────────────────────────────────────────

class SpecializationChoices(models.TextChoices):
    CONCRETE    = 'concrete',    'Concrete'
    STEEL       = 'steel',       'Steel'
    ELECTRICAL  = 'electrical',  'Electrical'
    PLUMBING    = 'plumbing',    'Plumbing'
    FINISHING   = 'finishing',   'Finishing'
    EXCAVATION  = 'excavation',  'Excavation'
    HVAC        = 'hvac',        'HVAC'
    LANDSCAPING = 'landscaping', 'Landscaping'
    OTHER       = 'other',       'Other'


class ContractStatusChoices(models.TextChoices):
    DRAFT      = 'draft',      'Draft'
    ACTIVE     = 'active',     'Active'
    COMPLETED  = 'completed',  'Completed'
    TERMINATED = 'terminated', 'Terminated'
    CANCELLED  = 'cancelled',  'Cancelled'


class PaymentTypeChoices(models.TextChoices):
    ADVANCE           = 'advance',           'Advance'
    PROGRESS          = 'progress',          'Progress'
    RETENTION_RELEASE = 'retention_release', 'Retention Release'
    FINAL             = 'final',             'Final'
    OTHER             = 'other',             'Other'


class DocumentTypeChoices(models.TextChoices):
    SIGNED_CONTRACT = 'signed_contract', 'Signed Contract'
    BOQ             = 'boq',             'BOQ File'
    DRAWING         = 'drawing',         'Drawing'
    INVOICE         = 'invoice',         'Invoice'
    QUOTATION       = 'quotation',       'Quotation'
    SUPPORTING      = 'supporting',      'Supporting Document'

class CurrencyChoices(models.TextChoices):
    AFN = "AFN", "Afghan Afghani"
    USD = "USD", "US Dollar"


# ──────────────────────────────────────────────
# Subcontractor
# ──────────────────────────────────────────────

class Subcontractor(models.Model):
    """
    A subcontractor entity that can hold multiple contracts across projects.
    Soft-deleted via is_active=False rather than real deletion.
    """
    name                = models.CharField(max_length=255, db_index=True)
    contact_person      = models.CharField(max_length=255, blank=True, default='')
    phone               = models.CharField(max_length=50, blank=True, default='')
    email               = models.EmailField(blank=True, default='')
    address             = models.TextField(blank=True, default='')
    tax_number          = models.CharField(max_length=100, blank=True, default='')
    registration_number = models.CharField(max_length=100, blank=True, default='')
    specialization      = models.CharField(
        max_length=50,
        choices=SpecializationChoices.choices,
        db_index=True,
    )
    notes               = models.TextField(blank=True, default='')
    is_active           = models.BooleanField(default=True, db_index=True)
    created_at          = models.DateTimeField(auto_now_add=True)
    updated_at          = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        indexes = [
            models.Index(fields=['name', 'specialization']),
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        return self.name

    # ── soft-delete helpers ────────────────────

    def soft_delete(self):
        self.is_active = False
        self.save(update_fields=['is_active', 'updated_at'])

    def restore(self):
        self.is_active = True
        self.save(update_fields=['is_active', 'updated_at'])


# ──────────────────────────────────────────────
# Contract
# ──────────────────────────────────────────────

class Contract(models.Model):
    """
    A contract between the company and a subcontractor for a specific project.
    Financial summary fields are computed as properties so they always
    reflect the latest approved variations and payments.
    """

    # ── core relationships ─────────────────────
    project = models.ForeignKey(
        # Adjust the string to match your actual Project model path
        'project.Project',
        on_delete=models.CASCADE,
        related_name='subcontractor_contracts',
    )
    subcontractor = models.ForeignKey(
        Subcontractor,
        on_delete=models.PROTECT,        # prevent deletion when contracts exist
        related_name='contracts',
    )

    # ── identity ───────────────────────────────
    contract_number = models.CharField(
    max_length=100,
    unique=True,
    db_index=True,
    editable=False,
)
    title           = models.CharField(max_length=255)

    # ── scope ──────────────────────────────────
    scope_of_work = models.TextField(blank=True, default='')

    # ── financial ──────────────────────────────
    currency = models.CharField(
    max_length=3,
    choices=CurrencyChoices.choices,
    default=CurrencyChoices.AFN,
    db_index=True,
)
    contract_value        = models.DecimalField(
        max_digits=15, decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
    )
    retention_percentage  = models.DecimalField(
        max_digits=5, decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0')), MaxValueValidator(Decimal('100'))],
    )
    # auto-calculated on save; stored so it can be queried without joins
    retention_amount      = models.DecimalField(
        max_digits=15, decimal_places=2,
        default=Decimal('0.00'), editable=False,
    )

    # ── schedule ───────────────────────────────
    start_date = models.DateField()
    end_date   = models.DateField()

    # ── progress ───────────────────────────────
    completion_percentage = models.DecimalField(
        max_digits=5, decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0')), MaxValueValidator(Decimal('100'))],
    )

    # ── lifecycle ──────────────────────────────
    status = models.CharField(
        max_length=20,
        choices=ContractStatusChoices.choices,
        default=ContractStatusChoices.DRAFT,
        db_index=True,
    )
    notes      = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['contract_number']),
            models.Index(fields=['status']),
            models.Index(fields=['project', 'status']),
            models.Index(fields=['subcontractor', 'status']),
            models.Index(fields=['start_date', 'end_date']),
        ]

    def __str__(self):
        return f"{self.contract_number} – {self.title}"

    # ── model-level validation ─────────────────

    def clean(self):
        super().clean()
        errors = {}
        if self.start_date and self.end_date and self.start_date > self.end_date:
            errors['end_date'] = 'End date must be on or after start date.'
        if errors:
            raise models.ValidationError(errors)

    # ── save override ──────────────────────────

    

    def save(self, *args, **kwargs):

        if not self.contract_number:
            with transaction.atomic():
                last_contract = (
                    Contract.objects
                    .select_for_update()
                    .order_by("-id")
                    .first()
                )

                next_number = 1

                if last_contract:
                    try:
                        next_number = int(
                            last_contract.contract_number.split("-")[-1]
                        ) + 1
                    except Exception:
                        next_number = last_contract.id + 1

                self.contract_number = f"CNT-{next_number:06d}"

        self.retention_amount = (
            self.contract_value *
            self.retention_percentage /
            Decimal("100")
        )

        if (
            self.completion_percentage == Decimal("100")
            and self.status != ContractStatusChoices.COMPLETED
        ):
            self.status = ContractStatusChoices.COMPLETED

        super().save(*args, **kwargs)
    # ── helper: can the contract accept payments? ─

    def can_accept_payments(self):
        return self.status in (
            ContractStatusChoices.ACTIVE,
            ContractStatusChoices.DRAFT,
        )

    # ── financial properties ───────────────────
    # These use a _cached attribute convention so that
    # ViewSets can annotate the queryset to avoid N+1.

    @property
    def total_variation_amount(self):
        """Sum of amount_change for approved variations."""
        if hasattr(self, '_total_variation_amount'):
            return self._total_variation_amount
        result = self.variations.filter(approved=True).aggregate(
            total=models.Sum('amount_change'),
        )['total']
        return result or Decimal('0.00')

    @property
    def total_variation_days(self):
        """Sum of days_added for approved variations."""
        if hasattr(self, '_total_variation_days'):
            return self._total_variation_days
        result = self.variations.filter(approved=True).aggregate(
            total=models.Sum('days_added'),
        )['total']
        return result or 0

    @property
    def adjusted_contract_value(self):
        """Original value + approved variation amounts."""
        return self.contract_value + self.total_variation_amount

    @property
    def adjusted_end_date(self):
        """Original end date + approved variation days."""
        return self.end_date + timedelta(days=self.total_variation_days)

    @property
    def total_paid(self):
        """Sum of all payment amounts."""
        if hasattr(self, '_total_paid'):
            return self._total_paid
        result = self.payments.aggregate(total=models.Sum('amount'))['total']
        return result or Decimal('0.00')
    
    @property
    def total_invoiced(self):
        result = self.invoices.aggregate(
            total=models.Sum("amount")
        )["total"]

        return result or Decimal("0.00")

    @property
    def invoice_balance(self):
        return self.total_invoiced - self.total_paid


    @property
    def remaining_amount(self):
        """Adjusted value minus total paid."""
        return self.adjusted_contract_value - self.total_paid

    @property
    def retention_balance(self):
        """Retention held minus retention already released."""
        released = self.payments.filter(
            payment_type=PaymentTypeChoices.RETENTION_RELEASE,
        ).aggregate(total=models.Sum('amount'))['total']
        return self.retention_amount - (released or Decimal('0.00'))

    @property
    def financial_summary(self):
        """Dictionary of all financial computed fields."""
        return {
            'original_contract_value': self.contract_value,
            'retention_percentage':    self.retention_percentage,
            'retention_amount':        self.retention_amount,
            'total_variation_amount':  self.total_variation_amount,
            'adjusted_contract_value': self.adjusted_contract_value,
            'total_paid':              self.total_paid,
            'remaining_amount':        self.remaining_amount,
            'retention_balance':       self.retention_balance,
            'adjusted_end_date':       self.adjusted_end_date,
            'completion_percentage':   self.completion_percentage,
        }


# ──────────────────────────────────────────────
# Contract Document
# ──────────────────────────────────────────────

def contract_document_upload_path(instance, filename):
    """Organise files under contracts/<contract_number>/documents/."""
    return f"contracts/documents/{filename}"


class ContractDocument(models.Model):
    contract      = models.ForeignKey(Contract, on_delete=models.CASCADE, related_name='documents')
    title         = models.CharField(max_length=255)
    document_type = models.CharField(
        max_length=30,
        choices=DocumentTypeChoices.choices,
        default=DocumentTypeChoices.SUPPORTING,
    )
    file          = models.FileField(upload_to=contract_document_upload_path)
    uploaded_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-uploaded_at']

    def __str__(self):
        return f"{self.title} – {self.contract.contract_number}"

    def clean(self):
        super().clean()
        if self.file:
            from .validators import validate_file_extension, validate_file_size
            validate_file_extension(self.file)
            validate_file_size(self.file)

    def save(self, *args, **kwargs):
        if self.file:
            content_type = getattr(self.file, "content_type", "")

            if content_type.startswith("image"):
                self.file = compress_image(self.file, quality=70)

            elif content_type == "application/pdf":
                self.file = compress_pdf(self.file)

        super().save(*args, **kwargs)


# ──────────────────────────────────────────────
# Contract Payment
# ──────────────────────────────────────────────

class ContractPayment(models.Model):
    contract         = models.ForeignKey(Contract, on_delete=models.CASCADE, related_name='payments')
    amount           = models.DecimalField(
        max_digits=15, decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
    )
    payment_date     = models.DateField()
    payment_type     = models.CharField(max_length=20, choices=PaymentTypeChoices.choices)
    reference_number = models.CharField(max_length=100, blank=True, default='')
    notes            = models.TextField(blank=True, default='')
    created_at       = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-payment_date', '-created_at']

    def __str__(self):
        return f"{self.contract.contract_number} – {self.get_payment_type_display()} – {self.amount}"


# ──────────────────────────────────────────────
# Contract Variation / Change Order
# ──────────────────────────────────────────────


from django.db.models import Max
class ContractVariation(models.Model):
    contract = models.ForeignKey(Contract, on_delete=models.CASCADE, related_name='variations')
    variation_number = models.CharField(max_length=100, blank=True)
    description = models.TextField()
    amount_change = models.DecimalField(max_digits=15, decimal_places=2)
    days_added = models.IntegerField(default=0)
    date = models.DateField()
    approved = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.variation_number:
            last_number = (
                ContractVariation.objects
                .filter(contract=self.contract)
                .aggregate(max_num=Max("id"))
                .get("max_num")
            )

            next_seq = 1

            last_var = (
                ContractVariation.objects
                .filter(contract=self.contract)
                .order_by("-created_at")
                .first()
            )

            if last_var and last_var.variation_number.startswith("V"):
                try:
                    next_seq = int(last_var.variation_number[1:]) + 1
                except ValueError:
                    next_seq = 1

            self.variation_number = f"V{next_seq}"

        super().save(*args, **kwargs)


from django.db import models
from django.db.models import Max
from decimal import Decimal
from django.core.validators import MinValueValidator


class InvoiceStatusChoices(models.TextChoices):
    PENDING = "pending", "Pending"
    APPROVED = "approved", "Approved"
    PARTIALLY_PAID = "partially_paid", "Partially Paid"
    PAID = "paid", "Paid"
    CANCELLED = "cancelled", "Cancelled"


class ContractInvoice(models.Model):
    contract = models.ForeignKey(
        Contract,
        on_delete=models.CASCADE,
        related_name="invoices"
    )

    invoice_number = models.CharField(
        max_length=100,
        db_index=True,
        editable=False
    )

    invoice_date = models.DateField()

    due_date = models.DateField(
        null=True,
        blank=True
    )

    description = models.TextField(
        blank=True,
        default=""
    )

    amount = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))]
    )

    status = models.CharField(
        max_length=20,
        choices=InvoiceStatusChoices.choices,
        default=InvoiceStatusChoices.PENDING,
        db_index=True
    )

    notes = models.TextField(
        blank=True,
        default=""
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-invoice_date", "-created_at"]
        unique_together = (
            "contract",
            "invoice_number",
        )

    def save(self, *args, **kwargs):
        if not self.invoice_number:
            last_invoice = (
                ContractInvoice.objects
                .filter(invoice_number__startswith="INV")
                .order_by("-id")
                .first()
            )

            if last_invoice:
                try:
                    last_number = int(
                        last_invoice.invoice_number.replace("INV", "")
                    )
                    next_number = last_number + 1
                except ValueError:
                    next_number = 1
            else:
                next_number = 1

            self.invoice_number = f"INV{next_number:05d}"

        super().save(*args, **kwargs)

    def __str__(self):
        return (
            f"{self.contract.contract_number} - "
            f"{self.invoice_number}"
        )
def invoice_upload_path(instance, filename):
    return f"contracts/invoices/{filename}"
class ContractInvoiceDocument(models.Model):
    invoice = models.ForeignKey(
        ContractInvoice,
        on_delete=models.CASCADE,
        related_name="documents"
    )

    file = models.FileField(
        upload_to=invoice_upload_path
    )

    uploaded_at = models.DateTimeField(
        auto_now_add=True
    )
    def save(self, *args, **kwargs):
        if self.file:
            content_type = getattr(self.file, "content_type", "")

            if content_type.startswith("image"):
                self.file = compress_image(self.file, quality=70)

            elif content_type == "application/pdf":
                self.file = compress_pdf(self.file)

        super().save(*args, **kwargs)