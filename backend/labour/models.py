from decimal import Decimal

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models
from django.db.models import Sum

from project.models import Project


class DailyWorker(models.Model):
    SKILL_CHOICES = [
        ("mason", "Mason"),
        ("carpenter", "Carpenter"),
        ("electrician", "Electrician"),
        ("painter", "Painter"),
        ("plumber", "Plumber"),
        ("steel_fixer", "Steel Fixer"),
        ("driver", "Driver"),
        ("excavator_operator", "Excavator Operator"),
        ("helper", "Helper"),
        ("other", "Other"),
    ]
    CURRENCY_CHOICES = [("AFN", "Afghani (AFN)"), ("USD", "US Dollar (USD)")]
    STATUS_CHOICES = [("active", "Active"), ("inactive", "Inactive")]

    worker_id = models.CharField(max_length=50, unique=True, editable=False)
    full_name = models.CharField(max_length=200)
    father_name = models.CharField(max_length=200, blank=True)
    phone = models.CharField(max_length=20)
    national_id = models.CharField(max_length=50, blank=True, null=True)
    address = models.TextField(blank=True)
    emergency_contact = models.CharField(max_length=200, blank=True)
    daily_rate = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.00"))],
    )
    overtime_hourly_rate = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(Decimal("0.00"))],
    )
    currency = models.CharField(max_length=3, choices=CURRENCY_CHOICES, default="AFN")
    skill_type = models.CharField(max_length=50, choices=SKILL_CHOICES, default="helper")
    specialization = models.CharField(max_length=150, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="active")
    joining_date = models.DateField()
    notes = models.TextField(blank=True)
    assigned_project = models.ForeignKey(
        Project,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="assigned_daily_workers",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-joining_date", "full_name"]
        verbose_name = "Daily Worker"
        verbose_name_plural = "Daily Workers"

    def __str__(self):
        return f"{self.full_name} ({self.worker_id})"

    @property
    def is_active(self):
        return self.status == "active"

    @property
    def trade(self):
        return self.skill_type

    def save(self, *args, **kwargs):
        if not self.worker_id:
            last_worker = DailyWorker.objects.order_by("-worker_id").first()
            next_num = 1
            if last_worker and "-" in last_worker.worker_id:
                try:
                    next_num = int(last_worker.worker_id.split("-")[1]) + 1
                except (ValueError, IndexError):
                    next_num = 1
            self.worker_id = f"DWRK-{next_num:04d}"
        super().save(*args, **kwargs)


class WorkerAttendance(models.Model):
    STATUS_CHOICES = [
        ("present", "Present"),
        ("absent", "Absent"),
        ("half_day", "Half Day"),
        ("overtime", "Overtime"),
    ]

    worker = models.ForeignKey(
        DailyWorker,
        on_delete=models.CASCADE,
        related_name="attendances",
    )
    project = models.ForeignKey(
        Project,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="worker_attendances",
    )
    date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="present")
    overtime_hours = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(Decimal("0.00"))],
    )
    notes = models.CharField(max_length=255, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="created_worker_attendance",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-date", "worker__full_name"]
        unique_together = ["worker", "date"]
        verbose_name = "Worker Attendance"
        verbose_name_plural = "Worker Attendance Records"

    def __str__(self):
        return f"{self.worker.full_name} - {self.date} - {self.status}"

    @property
    def paid_days(self):
        if self.status in {"present", "overtime"}:
            return Decimal("1.00")
        if self.status == "half_day":
            return Decimal("0.50")
        return Decimal("0.00")


class WorkerAdvance(models.Model):
    worker = models.ForeignKey(
        DailyWorker,
        on_delete=models.CASCADE,
        related_name="advances",
    )
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))],
    )
    currency = models.CharField(max_length=3, choices=DailyWorker.CURRENCY_CHOICES, default="AFN")
    date = models.DateField()
    description = models.TextField(blank=True)
    remaining_balance = models.DecimalField(max_digits=12, decimal_places=2)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="created_worker_advances",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-date", "-created_at"]

    def save(self, *args, **kwargs):
        if self.remaining_balance is None:
            self.remaining_balance = self.amount
        super().save(*args, **kwargs)

    @property
    def is_paid(self):
        return self.remaining_balance <= 0


class WorkerPayroll(models.Model):
    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("approved", "Approved"),
        ("paid", "Paid"),
    ]
    PAYMENT_METHOD_CHOICES = [
        ("cash", "Cash"),
        ("bank_transfer", "Bank Transfer"),
        ("mobile_money", "Mobile Money"),
        ("check", "Check"),
    ]

    worker = models.ForeignKey(
        DailyWorker,
        on_delete=models.PROTECT,
        related_name="payrolls",
    )
    project = models.ForeignKey(
        Project,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="worker_payrolls",
    )
    period_start = models.DateField()
    period_end = models.DateField()
    present_days = models.DecimalField(max_digits=7, decimal_places=2, default=0)
    half_days = models.DecimalField(max_digits=7, decimal_places=2, default=0)
    absent_days = models.DecimalField(max_digits=7, decimal_places=2, default=0)
    overtime_hours = models.DecimalField(max_digits=7, decimal_places=2, default=0)
    daily_rate_applied = models.DecimalField(max_digits=12, decimal_places=2)
    overtime_rate_applied = models.DecimalField(max_digits=10, decimal_places=2)
    gross_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    advances = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    deductions = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    net_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    currency = models.CharField(max_length=3, choices=DailyWorker.CURRENCY_CHOICES, default="AFN")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")
    payment_date = models.DateField(null=True, blank=True)
    payment_method = models.CharField(max_length=30, choices=PAYMENT_METHOD_CHOICES, default="cash")
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="created_worker_payrolls",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-period_start", "worker__full_name"]
        unique_together = ["worker", "project", "period_start", "period_end"]

    @property
    def total_days_worked(self):
        return self.present_days + (self.half_days * Decimal("0.50"))

    @property
    def total_overtime_hours(self):
        return self.overtime_hours

    @property
    def net_pay(self):
        return self.net_amount

    @property
    def is_paid(self):
        return self.status == "paid"

    def calculate_from_attendance(self, apply_advances=True):
        attendances = WorkerAttendance.objects.filter(
            worker=self.worker,
            date__gte=self.period_start,
            date__lte=self.period_end,
        )
        if self.project_id:
            attendances = attendances.filter(project_id=self.project_id)

        self.present_days = Decimal(attendances.filter(status__in=["present", "overtime"]).count())
        self.half_days = Decimal(attendances.filter(status="half_day").count())
        self.absent_days = Decimal(attendances.filter(status="absent").count())
        self.overtime_hours = attendances.aggregate(total=Sum("overtime_hours"))["total"] or Decimal("0.00")

        base_amount = self.total_days_worked * self.daily_rate_applied
        overtime_amount = self.overtime_hours * self.overtime_rate_applied
        self.gross_amount = base_amount + overtime_amount

        if apply_advances:
            unpaid = WorkerAdvance.objects.filter(
                worker=self.worker,
                currency=self.currency,
                remaining_balance__gt=0,
                date__lte=self.period_end,
            ).aggregate(total=Sum("remaining_balance"))["total"] or Decimal("0.00")
            self.advances = min(unpaid, self.gross_amount)

        self.net_amount = self.gross_amount - self.advances - self.deductions
        return self

    def apply_advance_deductions(self):
        remaining = self.advances
        advances = WorkerAdvance.objects.select_for_update().filter(
            worker=self.worker,
            currency=self.currency,
            remaining_balance__gt=0,
            date__lte=self.period_end,
        ).order_by("date", "created_at")
        for advance in advances:
            if remaining <= 0:
                break
            deduction = min(advance.remaining_balance, remaining)
            advance.remaining_balance -= deduction
            advance.save(update_fields=["remaining_balance", "updated_at"])
            remaining -= deduction
