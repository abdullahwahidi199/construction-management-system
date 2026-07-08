from django.conf import settings
from django.db import models
from django.db.models import Max

class Employee(models.Model):
    EMPLOYMENT_TYPE_CHOICES = [
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
    address = models.TextField()
    
    department = models.CharField(
        max_length=50,
        choices=DEPARTMENT_CHOICES,
    )
    
    position = models.CharField(max_length=100)
    
    employment_type = models.CharField(
        max_length=20,
        choices=EMPLOYMENT_TYPE_CHOICES,
        default="full_time",
    )
    
    hire_date = models.DateField()
    termination_date = models.DateField(null=True, blank=True)
    
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

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.employee_id})"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"
    
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
    # social_security = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    gross_pay = models.DecimalField(max_digits=12, decimal_places=2)
    net_pay = models.DecimalField(max_digits=12, decimal_places=2)
    
    
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
        
        total_deductions = self.deductions + self.tax_deducted 
        self.net_pay = self.gross_pay - total_deductions
        
        return self
    

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
