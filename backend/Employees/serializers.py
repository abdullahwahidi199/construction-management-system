from rest_framework import serializers
from .models import Employee, Payroll


class EmployeeSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()
    total_payrolls = serializers.SerializerMethodField()
    latest_payroll = serializers.SerializerMethodField()

    class Meta:
        model = Employee
        fields = [
            'id', 'employee_id', 'first_name', 'last_name', 'full_name',
            'email', 'phone', 'address', 'department', 'position',
            'employment_type', 'hire_date', 'termination_date',
            'salary', 'hourly_rate', 'emergency_contact_name',
            'emergency_contact_phone', 'is_active', 'notes',
            'total_payrolls', 'latest_payroll',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at',"employee_id"]

    def get_total_payrolls(self, obj):
        return obj.payrolls.count()

    def get_latest_payroll(self, obj):
        latest = obj.payrolls.first()
        if latest:
            return {
                'id': latest.id,
                'period': f"{latest.payroll_period_start} to {latest.payroll_period_end}",
                'net_pay': latest.net_pay,
                # 'status': latest.payment_status
            }
        return None

    def validate_email(self, value):
        if Employee.objects.filter(email=value).exclude(id=self.instance.id if self.instance else None).exists():
            raise serializers.ValidationError("An employee with this email already exists.")
        return value

    def validate_employee_id(self, value):
        if Employee.objects.filter(employee_id=value).exclude(id=self.instance.id if self.instance else None).exists():
            raise serializers.ValidationError("An employee with this ID already exists.")
        return value


class EmployeeListSerializer(serializers.ModelSerializer):
    """Simplified serializer for list views"""
    full_name = serializers.ReadOnlyField()

    class Meta:
        model = Employee
        fields = [
            'id', 'employee_id', 'first_name', 'last_name', 'full_name',
            'department', 'position', 'employment_type', 'is_active',
            'salary', 'hire_date'
        ]
        read_only_fields = ["employee_id"]


class PayrollSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    employee_id = serializers.CharField(source='employee.employee_id', read_only=True)
    
    class Meta:
        model = Payroll
        fields = [
            'id', 'employee', 'employee_name', 'employee_id',
            'payroll_period_start', 'payroll_period_end',
            'basic_salary', 'overtime_hours', 'overtime_rate',
            'overtime_amount', 'bonus', 'allowances',
            'deductions', 'tax_deducted', 'currency',
            'gross_pay', 'net_pay',
            'payment_method', 'payment_date', 'notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'overtime_amount', 'gross_pay', 'net_pay']

    def create(self, validated_data):
        # Calculate the payroll totals automatically
        payroll = Payroll(**validated_data)
        payroll.calculate_totals()
        payroll.save()
        return payroll

    def update(self, instance, validated_data):
        # Update and recalculate
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.calculate_totals()
        instance.save()
        return instance


class PayrollListSerializer(serializers.ModelSerializer):
    """Simplified serializer for list views"""
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    employee_id = serializers.CharField(source='employee.employee_id', read_only=True)

    class Meta:
        model = Payroll
        fields = [
            'id', 'employee', 'employee_name', 'employee_id',
            'payroll_period_start', 'payroll_period_end','currency',
            'gross_pay', 'net_pay',  'payment_date'
        ]


class PayrollBulkCreateSerializer(serializers.Serializer):
    """Serializer for bulk payroll creation"""
    employee_ids = serializers.ListField(
        child=serializers.IntegerField(),
        help_text="List of employee IDs to create payroll for"
    )
    payroll_period_start = serializers.DateField()
    payroll_period_end = serializers.DateField()
    
    # Optional fields that will be applied to all payrolls
    bonus = serializers.DecimalField(max_digits=12, decimal_places=2, default=0)
    allowances = serializers.DecimalField(max_digits=12, decimal_places=2, default=0)
    deductions = serializers.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax_percentage = serializers.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        default=10,
        help_text="Tax percentage to deduct from gross pay"
    )
    payment_method = serializers.CharField(max_length=20, default="bank_transfer")
    notes = serializers.CharField(required=False, allow_blank=True)


# Add to your existing serializers.py

from .models import Attendance
from datetime import date


class AttendanceSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    employee_identifier = serializers.CharField(source='employee.employee_id', read_only=True)

    class Meta:
        model = Attendance
        fields = [
            'id', 'employee', 'employee_name', 'employee_identifier',
            'date', 'status', 'check_in', 'check_out',
            'overtime_hours', 'note',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def validate(self, data):
        # Prevent future dates
        attendance_date = data.get('date', getattr(self.instance, 'date', None))
        if attendance_date and attendance_date > date.today():
            raise serializers.ValidationError({
                "date": "Cannot mark attendance for future dates."
            })

        # If both check_in and check_out provided, check_out must be after check_in
        check_in = data.get('check_in', getattr(self.instance, 'check_in', None))
        check_out = data.get('check_out', getattr(self.instance, 'check_out', None))
        if check_in and check_out and check_out <= check_in:
            raise serializers.ValidationError({
                "check_out": "Check-out time must be after check-in time."
            })

        return data

    def validate_employee(self, value):
        if not value.is_active:
            raise serializers.ValidationError("Cannot mark attendance for inactive employee.")
        return value


class AttendanceListSerializer(serializers.ModelSerializer):
    """Lighter serializer for list views"""
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    employee_identifier = serializers.CharField(source='employee.employee_id', read_only=True)

    class Meta:
        model = Attendance
        fields = [
            'id', 'employee', 'employee_name', 'employee_identifier',
            'date', 'status', 'check_in', 'check_out', 'overtime_hours'
        ]


class BulkAttendanceSerializer(serializers.Serializer):
    """
    For marking attendance of multiple employees at once for a single date.
    This is the most common use case — supervisor marks everyone's attendance for today.
    """
    date = serializers.DateField()
    records = serializers.ListField(
        child=serializers.DictField(),
        help_text="List of {employee: id, status: 'present/absent/half_day/leave', check_in: '08:00', check_out: '17:00', overtime_hours: 0, note: ''}"
    )

    def validate_date(self, value):
        if value > date.today():
            raise serializers.ValidationError("Cannot mark attendance for future dates.")
        return value

    def validate_records(self, value):
        if not value:
            raise serializers.ValidationError("At least one record is required.")

        valid_statuses = ['present', 'absent', 'half_day', 'leave']
        for i, record in enumerate(value):
            if 'employee' not in record:
                raise serializers.ValidationError(
                    f"Record {i + 1}: 'employee' field is required."
                )
            if 'status' not in record:
                raise serializers.ValidationError(
                    f"Record {i + 1}: 'status' field is required."
                )
            if record['status'] not in valid_statuses:
                raise serializers.ValidationError(
                    f"Record {i + 1}: status must be one of {valid_statuses}."
                )
        return value