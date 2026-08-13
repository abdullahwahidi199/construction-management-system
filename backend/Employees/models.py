from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django.db import models
from django.db.models import Max, Q, Sum
from decimal import Decimal
from project.models import Project

class Employee(models.Model):
    class EmploymentType(models.TextChoices):
        PROJECT = "PROJECT", "Project Employee"
        OFFICE = "OFFICE", "Office Employee"

    JOB_TYPE_CHOICES = [
        ("full_time", "Full Time"),
        ("part_time", "Part Time"),
        ("contract", "Contract"),
        ("temporary", "Temporary"),
    ]

    DEPARTMENT_CHOICES = [
        ("management", "Management"),
        ("engineering", "Engineering"),
        ("construction", "Construction"),
        ("administration", "Administration"),
        ("finance", "Finance"),
        ("hr", "Human Resources"),
        ("procurement", "Procurement"),
        ("safety", "Safety"),
    ]

    employee_id = models.CharField(
        max_length=50,
        unique=True,
        editable=False
    )

    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(unique=True,null=True,blank=True)
    phone = models.CharField(max_length=20)
    address = models.TextField(null=True,blank=True)
    
    department = models.CharField(
        max_length=50,
        choices=DEPARTMENT_CHOICES,
    )
    
    position = models.CharField(max_length=100)
    
    employment_type = models.CharField(
        max_length=20,
        choices=EmploymentType.choices,
        default=EmploymentType.OFFICE,
    )
    project = models.ForeignKey(
        Project,
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name="assigned_employees",
    )
    job_type = models.CharField(
        max_length=20,
        choices=JOB_TYPE_CHOICES,
        default="full_time",
    )
    
    hire_date = models.DateField()
    # termination_date = models.DateField(null=True, blank=True)
    
    salary = models.DecimalField(max_digits=12, decimal_places=2)
    hourly_rate = models.DecimalField(
        max_digits=8, 
        decimal_places=2, 
        null=True, 
        blank=True,
        help_text="For part-time/hourly workers"
    )
    
    emergency_contact_name = models.CharField(max_length=200, blank=True)
    emergency_contact_phone = models.CharField(max_length=20, blank=True)
    
    is_active = models.BooleanField(default=True)
    
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-hire_date"]
        verbose_name = "Employee"
        verbose_name_plural = "Employees"
        constraints = [
            models.CheckConstraint(
                check=(
                    Q(employment_type="PROJECT", project__isnull=False)
                    | Q(employment_type="OFFICE", project__isnull=True)
                ),
                name="employee_employment_type_matches_project",
            ),
        ]

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.employee_id})"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

    def clean(self):
        if self.employment_type == self.EmploymentType.PROJECT and not self.project_id:
            raise ValidationError({"project": "Project employees must be assigned to a project."})
        if self.employment_type == self.EmploymentType.OFFICE and self.project_id:
            raise ValidationError({"project": "Office employees cannot be assigned to a project."})
    
    def save(self, *args, **kwargs):
        if not self.employee_id:
            last_employee = Employee.objects.order_by("-employee_id").first()

            if last_employee:
                last_num = int(last_employee.employee_id.split("-")[1])
                next_num = last_num + 1
            else:
                next_num = 1

            self.employee_id = f"EMP-{next_num:04d}"

        super().save(*args, **kwargs)


class Payroll(models.Model):
    class AllocationType(models.TextChoices):
        PROJECT = "PROJECT", "Project Payroll"
        OFFICE = "OFFICE", "Office Payroll"

    PAYMENT_STATUS_CHOICES = [
        ("pending", "Pending"),
        ("partially_paid", "Partially Paid"),
        ("fully_paid", "Fully Paid"),
    ]

    PAYMENT_METHOD_CHOICES = [
        ("bank_transfer", "Bank Transfer"),
        ("check", "Check"),
        ("cash", "Cash"),
    ]
    CURRENCY_CHOICES = [
        ("AFN", "Afghani (AFN)"),
        ("USD", "US Dollar (USD)"),
    ]

    currency = models.CharField(
    max_length=3,
    choices=CURRENCY_CHOICES,
    default="AFN"
)

    employee = models.ForeignKey(
        Employee,
        on_delete=models.PROTECT,
        related_name="payrolls"
    )
    allocation_type = models.CharField(
        max_length=20,
        choices=AllocationType.choices,
        default=AllocationType.OFFICE,
        db_index=True,
    )
    project = models.ForeignKey(
        Project,
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name="employee_payrolls",
    )
    
    payroll_period_start = models.DateField()
    payroll_period_end = models.DateField()
    
    basic_salary = models.DecimalField(max_digits=12, decimal_places=2)
    overtime_hours = models.DecimalField(
        max_digits=6, 
        decimal_places=2, 
        default=0
    )
    overtime_rate = models.DecimalField(
        max_digits=8, 
        decimal_places=2, 
        default=0
    )
    overtime_amount = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        default=0
    )
    
    bonus = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    allowances = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    deductions = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    tax_deducted = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    advance_deductions = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    # social_security = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    gross_pay = models.DecimalField(max_digits=12, decimal_places=2)
    net_pay = models.DecimalField(max_digits=12, decimal_places=2)
    amount_paid = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    balance_due = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    payment_status = models.CharField(
        max_length=20,
        choices=PAYMENT_STATUS_CHOICES,
        default="pending",
    )
    
    
    payment_method = models.CharField(
        max_length=20,
        choices=PAYMENT_METHOD_CHOICES,
        default="bank_transfer"
    )
    payment_date = models.DateField(null=True, blank=True)
    
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="created_payrolls",
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-payroll_period_start"]
        verbose_name = "Payroll"
        verbose_name_plural = "Payrolls"
        unique_together = ["employee", "payroll_period_start", "payroll_period_end"]
        constraints = [
            models.CheckConstraint(
                check=(
                    Q(allocation_type="PROJECT", project__isnull=False)
                    | Q(allocation_type="OFFICE", project__isnull=True)
                ),
                name="payroll_allocation_matches_project",
            ),
        ]

    def __str__(self):
        return f"Payroll: {self.employee.full_name} - {self.payroll_period_start} to {self.payroll_period_end}"

    def calculate_totals(self):
        """Calculate overtime, gross, and net pay"""
        if self.overtime_hours and self.overtime_rate:
            self.overtime_amount = self.overtime_hours * self.overtime_rate
        
        self.gross_pay = (
            self.basic_salary + 
            self.overtime_amount + 
            self.bonus + 
            self.allowances
        )
        
        total_deductions = self.deductions + self.tax_deducted + self.advance_deductions
        self.net_pay = self.gross_pay - total_deductions
        self.balance_due = max(self.net_pay - self.amount_paid, Decimal("0.00"))
        
        return self

    def snapshot_employee_allocation(self):
        if self.employee.employment_type == Employee.EmploymentType.PROJECT:
            self.allocation_type = self.AllocationType.PROJECT
            self.project_id = self.employee.project_id
        else:
            self.allocation_type = self.AllocationType.OFFICE
            self.project = None
        return self

    def clean(self):
        if self.allocation_type == self.AllocationType.PROJECT and not self.project_id:
            raise ValidationError({"project": "Project payroll must be linked to a project."})
        if self.allocation_type == self.AllocationType.OFFICE and self.project_id:
            raise ValidationError({"project": "Office payroll cannot be linked to a project."})

    def save(self, *args, **kwargs):
        if not self.pk and self.employee_id:
            self.snapshot_employee_allocation()
        super().save(*args, **kwargs)

    @property
    def total_deductions(self):
        return self.deductions + self.tax_deducted + self.advance_deductions

    @property
    def payable_before_advances(self):
        return self.gross_pay - self.deductions - self.tax_deducted

    def refresh_payment_totals(self, save=False):
        paid = Decimal("0.00")
        if self.pk:
            paid = self.payments.aggregate(total=Sum("amount"))["total"] or Decimal("0.00")

        self.amount_paid = paid
        self.balance_due = max(self.net_pay - paid, Decimal("0.00"))

        if paid <= 0:
            self.payment_status = "pending"
        elif self.balance_due > 0:
            self.payment_status = "partially_paid"
        else:
            self.payment_status = "fully_paid"

        if save:
            self.save(update_fields=["amount_paid", "balance_due", "payment_status", "updated_at"])
        return self
    

class SalaryAdvance(models.Model):
    STATUS_CHOICES = [
        ("active", "Active"),
        ("deducted", "Deducted"),
        ("cancelled", "Cancelled"),
    ]

    employee = models.ForeignKey(
        Employee,
        on_delete=models.PROTECT,
        related_name="salary_advances",
    )
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))],
    )
    remaining_balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    date = models.DateField()
    reason = models.CharField(max_length=200, blank=True)
    notes = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="active")
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="created_salary_advances",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-date", "-created_at"]

    def __str__(self):
        return f"{self.employee.full_name} advance {self.amount}"

    def save(self, *args, **kwargs):
        if not self.pk and not self.remaining_balance:
            self.remaining_balance = self.amount
        if self.status != "cancelled":
            self.status = "deducted" if self.remaining_balance <= 0 else "active"
        super().save(*args, **kwargs)


class PayrollAdvanceDeduction(models.Model):
    payroll = models.ForeignKey(
        Payroll,
        on_delete=models.CASCADE,
        related_name="advance_deduction_records",
    )
    advance = models.ForeignKey(
        SalaryAdvance,
        on_delete=models.PROTECT,
        related_name="payroll_deductions",
    )
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))],
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["advance__date", "id"]
        unique_together = ["payroll", "advance"]

    def __str__(self):
        return f"{self.payroll_id} - {self.advance_id}: {self.amount}"


class PayrollPayment(models.Model):
    payroll = models.ForeignKey(
        Payroll,
        on_delete=models.CASCADE,
        related_name="payments",
    )
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))],
    )
    payment_date = models.DateField()
    payment_method = models.CharField(
        max_length=20,
        choices=Payroll.PAYMENT_METHOD_CHOICES,
        default="bank_transfer",
    )
    reference_number = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="created_payroll_payments",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["payment_date", "created_at"]

    def __str__(self):
        return f"{self.payroll_id} payment {self.amount}"


# Add this to your existing models.py

class Attendance(models.Model):
    STATUS_CHOICES = [
        ("present", "Present"),
        ("absent", "Absent"),
        ("half_day", "Half Day"),
        ("leave", "Leave"),
    ]

    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name="attendances"
    )
    date = models.DateField()
    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default="present"
    )
    check_in = models.TimeField(null=True, blank=True)
    check_out = models.TimeField(null=True, blank=True)
    overtime_hours = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        default=0,
        help_text="Extra hours worked beyond normal shift"
    )
    note = models.CharField(max_length=255, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="created_attendance_records",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-date", "employee__first_name"]
        unique_together = ["employee", "date"]
        verbose_name = "Attendance"
        verbose_name_plural = "Attendance Records"

    def __str__(self):
        return f"{self.employee.full_name} - {self.date} - {self.status}"
