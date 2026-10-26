from decimal import Decimal
import uuid

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models

from project.models import Apartment, ApartmentPayment, Project


ZERO = Decimal("0.00")


def generate_service_receipt():
    return f"SRV-{uuid.uuid4().hex.upper()}"


class ApartmentServiceSetting(models.Model):
    apartment = models.OneToOneField(
        Apartment,
        on_delete=models.CASCADE,
        related_name="service_setting",
    )
    default_fee = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=ZERO,
        validators=[MinValueValidator(ZERO)],
    )
    currency = models.CharField(
        max_length=3,
        choices=Project.CURRENCY_CHOICES,
        default="AFN",
    )
    is_active = models.BooleanField(default=True)
    notes = models.TextField(blank=True)
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="updated_apartment_service_settings",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = [
            "apartment__project__name",
            "apartment__building__name",
            "apartment__floor__floor_number",
            "apartment__apartment_number",
        ]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(default_fee__gte=0),
                name="service_setting_fee_non_negative",
            ),
        ]

    def __str__(self):
        return f"{self.apartment} - {self.currency} {self.default_fee}"


class ServiceCharge(models.Model):
    class Status(models.TextChoices):
        UNPAID = "UNPAID", "Unpaid"
        PARTIAL = "PARTIAL", "Partial"
        PAID = "PAID", "Paid"

    apartment = models.ForeignKey(
        Apartment,
        on_delete=models.PROTECT,
        related_name="service_charges",
    )
    period_start = models.DateField()
    period_end = models.DateField()
    amount = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        validators=[MinValueValidator(ZERO)],
    )
    currency = models.CharField(
        max_length=3,
        choices=Project.CURRENCY_CHOICES,
        default="AFN",
    )
    adjustment_note = models.TextField(blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="created_service_charges",
    )
    adjusted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="adjusted_service_charges",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-period_start", "apartment__apartment_number", "id"]
        constraints = [
            models.UniqueConstraint(
                fields=["apartment", "period_start"],
                name="unique_service_charge_apartment_period",
            ),
            models.CheckConstraint(
                condition=models.Q(amount__gte=0),
                name="service_charge_amount_non_negative",
            ),
            models.CheckConstraint(
                condition=models.Q(period_end__gte=models.F("period_start")),
                name="service_charge_period_ordered",
            ),
        ]
        indexes = [
            models.Index(fields=["period_start", "period_end"], name="svc_charge_period_idx"),
            models.Index(fields=["apartment", "period_start"], name="svc_charge_apt_period_idx"),
        ]

    @property
    def total_paid(self):
        annotated = getattr(self, "_paid_total", None)
        if annotated is not None:
            return annotated
        prefetched = getattr(self, "_prefetched_objects_cache", {}).get("payments")
        if prefetched is not None:
            return sum((payment.amount for payment in prefetched), ZERO)
        return self.payments.aggregate(total=models.Sum("amount"))["total"] or ZERO

    @property
    def remaining_amount(self):
        return self.amount - self.total_paid

    @property
    def payment_status(self):
        paid = self.total_paid
        if paid <= ZERO:
            return self.Status.UNPAID
        if paid >= self.amount:
            return self.Status.PAID
        return self.Status.PARTIAL

    def __str__(self):
        return f"{self.apartment} ({self.period_start} - {self.period_end})"


class ServicePayment(models.Model):
    charge = models.ForeignKey(
        ServiceCharge,
        on_delete=models.PROTECT,
        related_name="payments",
    )
    receipt_number = models.CharField(
        max_length=100,
        unique=True,
        default=generate_service_receipt,
        editable=False,
    )
    amount = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))],
    )
    currency = models.CharField(
        max_length=3,
        choices=Project.CURRENCY_CHOICES,
        default="AFN",
    )
    payment_date = models.DateField()
    payment_method = models.CharField(
        max_length=20,
        choices=ApartmentPayment.Method.choices,
    )
    reference_number = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)
    idempotency_key = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    recorded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="recorded_service_payments",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-payment_date", "-created_at"]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(amount__gt=0),
                name="service_payment_amount_positive",
            ),
        ]
        indexes = [
            models.Index(fields=["payment_date"], name="svc_payment_date_idx"),
        ]

    def __str__(self):
        return self.receipt_number

