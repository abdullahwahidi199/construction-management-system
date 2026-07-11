# models.py
from django.db import models


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
