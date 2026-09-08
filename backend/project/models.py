# models.py
from decimal import Decimal
import uuid

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models


def generate_sale_reference():
    return f"SALE-{uuid.uuid4().hex.upper()}"


def generate_payment_receipt():
    return f"RCPT-{uuid.uuid4().hex.upper()}"


class Project(models.Model):
    CURRENCY_CHOICES = [
        ("AFN", "Afghani (AFN)"),
        ("USD", "US Dollar (USD)"),
    ]

    STATUS_CHOICES = [
        ("planning", "Planning"),
        ("ongoing", "Ongoing"),
        ("completed", "Completed"),
        ("on_hold", "On Hold"),
    ]

    PROPERTY_TYPE_CHOICES = [
        ("residential", "Residential"),
        ("commercial", "Commercial"),
        ("mixed", "Mixed Use"),
    ]

    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    property_type = models.CharField(
        max_length=20,
        choices=PROPERTY_TYPE_CHOICES,
    )

    location = models.CharField(max_length=255)

    total_floors = models.PositiveIntegerField(default=1)

    start_date = models.DateField()
    expected_completion_date = models.DateField(
        null=True,
        blank=True,
    )

    actual_completion_date = models.DateField(
        null=True,
        blank=True,
    )

    estimated_budget = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0,
    )
    budget_currency = models.CharField(
        max_length=3,
        choices=CURRENCY_CHOICES,
        default="AFN",
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="planning",
    )

    notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.name


class Building(models.Model):
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="buildings",
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name", "id"]

    def __str__(self):
        return f"{self.project} - {self.name}"


class Floor(models.Model):
    building = models.ForeignKey(
        Building,
        on_delete=models.CASCADE,
        related_name="floors",
    )
    floor_number = models.IntegerField()
    name = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["floor_number", "id"]
        constraints = [
            models.UniqueConstraint(
                fields=["building", "floor_number"],
                name="unique_floor_number_per_building",
            ),
        ]

    def __str__(self):
        return self.name or f"Floor {self.floor_number}"


class Apartment(models.Model):
    class Status(models.TextChoices):
        AVAILABLE = "AVAILABLE", "Available"
        SOLD = "SOLD", "Sold"

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="apartments",
    )
    building = models.ForeignKey(
        Building,
        on_delete=models.CASCADE,
        related_name="apartments",
    )
    floor = models.ForeignKey(
        Floor,
        on_delete=models.CASCADE,
        related_name="apartments",
    )
    apartment_number = models.CharField(max_length=50)
    apartment_type = models.CharField(max_length=100, blank=True)
    area = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
    )
    bedrooms = models.PositiveSmallIntegerField(null=True, blank=True)
    description = models.TextField(blank=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.AVAILABLE,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["building__name", "floor__floor_number", "apartment_number", "id"]
        constraints = [
            models.UniqueConstraint(
                fields=["floor", "apartment_number"],
                name="unique_apartment_number_per_floor",
            ),
            models.CheckConstraint(
                condition=models.Q(area__isnull=True) | models.Q(area__gte=0),
                name="apartment_area_non_negative",
            ),
        ]

    def __str__(self):
        return self.apartment_number


class Customer(models.Model):
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="apartment_customers",
    )
    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=50, blank=True)
    email = models.EmailField(blank=True)
    address = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name", "id"]

    def __str__(self):
        return self.name


class ApartmentSale(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        CANCELLED = "CANCELLED", "Cancelled"

    class PaymentStatus(models.TextChoices):
        UNPAID = "UNPAID", "Unpaid"
        PARTIALLY_PAID = "PARTIALLY_PAID", "Partially Paid"
        PAID = "PAID", "Paid"
        CANCELLED = "CANCELLED", "Cancelled"

    apartment = models.ForeignKey(
        Apartment,
        on_delete=models.PROTECT,
        related_name="sales",
    )
    customer = models.ForeignKey(
        Customer,
        on_delete=models.PROTECT,
        related_name="apartment_sales",
    )
    reference_number = models.CharField(
        max_length=100,
        unique=True,
        default=generate_sale_reference,
        editable=False,
    )
    sale_date = models.DateField()
    sale_price = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))],
    )
    currency = models.CharField(max_length=3, choices=Project.CURRENCY_CHOICES)
    notes = models.TextField(blank=True)
    cancellation_reason = models.TextField(blank=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE,
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="created_apartment_sales",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    cancelled_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="cancelled_apartment_sales",
    )

    class Meta:
        ordering = ["-sale_date", "-created_at"]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(sale_price__gt=0),
                name="apartment_sale_price_positive",
            ),
            models.UniqueConstraint(
                fields=["apartment"],
                condition=models.Q(status="ACTIVE"),
                name="unique_active_sale_per_apartment",
            ),
        ]

    @property
    def total_paid(self):
        annotated_total = getattr(self, "_paid_total", None)
        if annotated_total is not None:
            return annotated_total
        prefetched = getattr(self, "_prefetched_objects_cache", {}).get("payments")
        if prefetched is not None:
            return sum((payment.amount for payment in prefetched), Decimal("0.00"))
        return self.payments.aggregate(total=models.Sum("amount"))["total"] or Decimal("0.00")

    @property
    def remaining_balance(self):
        return self.sale_price - self.total_paid

    @property
    def payment_status(self):
        if self.status == self.Status.CANCELLED:
            return self.PaymentStatus.CANCELLED
        paid = self.total_paid
        if paid <= 0:
            return self.PaymentStatus.UNPAID
        if paid >= self.sale_price:
            return self.PaymentStatus.PAID
        return self.PaymentStatus.PARTIALLY_PAID

    def __str__(self):
        return self.reference_number


class ApartmentPayment(models.Model):
    class Method(models.TextChoices):
        CASH = "CASH", "Cash"
        BANK_TRANSFER = "BANK_TRANSFER", "Bank Transfer"
        CHEQUE = "CHEQUE", "Cheque"
        OTHER = "OTHER", "Other"

    sale = models.ForeignKey(
        ApartmentSale,
        on_delete=models.CASCADE,
        related_name="payments",
    )
    customer = models.ForeignKey(
        Customer,
        on_delete=models.PROTECT,
        related_name="apartment_payments",
    )
    receipt_number = models.CharField(
        max_length=100,
        unique=True,
        default=generate_payment_receipt,
        editable=False,
    )
    amount = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))],
    )
    currency = models.CharField(max_length=3, choices=Project.CURRENCY_CHOICES)
    payment_date = models.DateField()
    payment_method = models.CharField(max_length=20, choices=Method.choices)
    reference = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)
    recorded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="recorded_apartment_payments",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-payment_date", "-created_at"]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(amount__gt=0),
                name="apartment_payment_amount_positive",
            ),
        ]

    def __str__(self):
        return self.receipt_number
