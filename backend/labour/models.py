from django.db import models
from django.conf import settings
from django.db.models import Sum

class DailyWorker(models.Model):
    TRADE_CHOICES = [
        ("laborer", "General Laborer"),
        ("mason", "Mason"),
        ("carpenter", "Carpenter"),
        ("electrician", "Electrician"),
        ("plumber", "Plumber"),
        ("painter", "Painter"),
        ("welder", "Welder"),
        ("steel_fixer", "Steel Fixer"),
        ("other", "Other"),
    ]

    worker_id = models.CharField(max_length=50, unique=True, editable=False)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    phone = models.CharField(max_length=20, blank=True, null=True)
    national_id = models.CharField(max_length=50, blank=True, null=True, help_text="Tazkira / ID Card Number")
    
    trade = models.CharField(max_length=50, choices=TRADE_CHOICES, default="laborer")
    
    daily_rate = models.DecimalField(max_digits=10, decimal_places=2, help_text="Standard pay per full day")
    overtime_hourly_rate = models.DecimalField(max_digits=8, decimal_places=2, default=0, help_text="Pay per hour of overtime")
    
    currency = models.CharField(max_length=3, choices=[("AFN", "AFN"), ("USD", "USD")], default="AFN")
    
    is_active = models.BooleanField(default=True)
    joined_date = models.DateField(auto_now_add=True)
    notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-joined_date"]
        verbose_name = "Daily Worker"
        verbose_name_plural = "Daily Workers"

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.worker_id}) - {self.get_trade_display()}"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

    def save(self, *args, **kwargs):
        if not self.worker_id:
            last_worker = DailyWorker.objects.order_by("-worker_id").first()
            if last_worker and "-" in last_worker.worker_id:
                try:
                    last_num = int(last_worker.worker_id.split("-")[1])
                    next_num = last_num + 1
                except ValueError:
                    next_num = 1
            else:
                next_num = 1
            self.worker_id = f"DWRK-{next_num:04d}"
        super().save(*args, **kwargs)


class WorkerAttendance(models.Model):
    STATUS_CHOICES = [
        ("present", "Present"),
        ("absent", "Absent"),
        ("half_day", "Half Day"),
    ]

    worker = models.ForeignKey(DailyWorker, on_delete=models.CASCADE, related_name="attendances")
    date = models.DateField()
    
    # Often daily workers are assigned to specific construction sites/projects
    project_site = models.CharField(max_length=200, blank=True, null=True) 
    
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="present")
    overtime_hours = models.DecimalField(max_digits=4, decimal_places=2, default=0)
    
    notes = models.CharField(max_length=255, blank=True)
    
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL, related_name="created_worker_attendance"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-date", "worker__first_name"]
        unique_together = ["worker", "date"]
        verbose_name = "Worker Attendance"

    def __str__(self):
        return f"{self.worker.full_name} - {self.date} - {self.status}"

    @property
    def days_counted(self):
        """Returns mathematical value of the attendance day"""
        if self.status == 'present': return 1.0
        elif self.status == 'half_day': return 0.5
        return 0.0


class WorkerPayroll(models.Model):
    worker = models.ForeignKey(DailyWorker, on_delete=models.PROTECT, related_name="payrolls")
    
    period_start = models.DateField()
    period_end = models.DateField()
    
    total_days_worked = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    total_overtime_hours = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    
    daily_rate_applied = models.DecimalField(max_digits=10, decimal_places=2)
    overtime_rate_applied = models.DecimalField(max_digits=8, decimal_places=2)
    
    base_pay = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    overtime_pay = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    bonus = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    deductions = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    net_pay = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    currency = models.CharField(max_length=3, default="AFN")
    
    is_paid = models.BooleanField(default=False)
    payment_date = models.DateField(null=True, blank=True)
    payment_method = models.CharField(
        max_length=20, 
        choices=[("cash", "Cash"), ("bank_transfer", "Bank Transfer"), ("mobile_money", "Mobile Money")], 
        default="cash"
    )

    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-period_start"]
        unique_together = ["worker", "period_start", "period_end"]

    def calculate_from_attendance(self):
        """Auto-calculate days and overtime based on attendance records within the period"""
        attendances = WorkerAttendance.objects.filter(
            worker=self.worker,
            date__gte=self.period_start,
            date__lte=self.period_end
        )
        
        # Calculate standard days (Present = 1, Half Day = 0.5)
        presents = attendances.filter(status='present').count()
        half_days = attendances.filter(status='half_day').count()
        
        self.total_days_worked = presents + (half_days * 0.5)
        
        # Sum overtime hours
        ot_agg = attendances.aggregate(total_ot=Sum('overtime_hours'))
        self.total_overtime_hours = ot_agg['total_ot'] or 0

        # Calculate Finances
        self.base_pay = float(self.total_days_worked) * float(self.daily_rate_applied)
        self.overtime_pay = float(self.total_overtime_hours) * float(self.overtime_rate_applied)
        
        self.net_pay = (self.base_pay + self.overtime_pay + float(self.bonus)) - float(self.deductions)
        return self 