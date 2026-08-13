from rest_framework import serializers
from django.db import transaction
from common.serializers import CalendarModelSerializer
from common.calendar_utils import CALENDAR_SHAMSI, get_module_calendar, to_shamsi
from decimal import Decimal, InvalidOperation
from .models import Employee, Payroll, PayrollAdvanceDeduction, PayrollPayment, SalaryAdvance


def decimal_value(value, default="0.00"):
    try:
        return Decimal(str(value if value not in [None, ""] else default))
    except (InvalidOperation, TypeError, ValueError):
        raise serializers.ValidationError("Enter a valid amount.")


class EmployeeSerializer(CalendarModelSerializer):
    calendar_module = "employees"
    full_name = serializers.ReadOnlyField()
    employment_type_display = serializers.CharField(source="get_employment_type_display", read_only=True)
    project_name = serializers.CharField(source="project.name", read_only=True)
    total_payrolls = serializers.SerializerMethodField()
    latest_payroll = serializers.SerializerMethodField()

    class Meta:
        model = Employee
        fields = [
            'id', 'employee_id', 'first_name', 'last_name', 'full_name',
            'email', 'phone', 'address', 'department', 'position',
            'employment_type', 'employment_type_display', 'project', 'project_name',
            'job_type', 'hire_date',
            'salary', 'hourly_rate', 'emergency_contact_name',
            'emergency_contact_phone', 'is_active', 'notes',
            'total_payrolls', 'latest_payroll',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at',"employee_id"]
        extra_kwargs = {
            'email': {
                'required': False,
                'allow_null': True,
                'allow_blank': True,
            },
            'address': {
                'required': False,
                'allow_blank': True,
            },
        }

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
        if not value:
            return None

        if Employee.objects.filter(email=value).exclude(
            id=self.instance.id if self.instance else None
        ).exists():
            raise serializers.ValidationError(
                "An employee with this email already exists."
            )

        return value
    def validate_employee_id(self, value):
        if Employee.objects.filter(employee_id=value).exclude(id=self.instance.id if self.instance else None).exists():
            raise serializers.ValidationError("An employee with this ID already exists.")
        return value

    def validate(self, data):
        data = super().validate(data)
        employment_type = data.get("employment_type", getattr(self.instance, "employment_type", Employee.EmploymentType.OFFICE))
        project = data.get("project", getattr(self.instance, "project", None))

        if employment_type == Employee.EmploymentType.PROJECT and not project:
            raise serializers.ValidationError({"project": "Project employees must be assigned to a project."})
        if employment_type == Employee.EmploymentType.OFFICE:
            incoming_project = getattr(self, "initial_data", {}).get("project")
            if incoming_project not in [None, "", "null"]:
                raise serializers.ValidationError({"project": "Office employees cannot be assigned to a project."})
            data["project"] = None
        return data


class EmployeeListSerializer(CalendarModelSerializer):
    calendar_module = "employees"
    """Simplified serializer for list views"""
    full_name = serializers.ReadOnlyField()
    employment_type_display = serializers.CharField(source="get_employment_type_display", read_only=True)
    project_name = serializers.CharField(source="project.name", read_only=True)

    class Meta:
        model = Employee
        fields = [
            'id', 'employee_id', 'first_name', 'last_name', 'full_name',
            'department', 'position', 'employment_type', 'employment_type_display',
            'project', 'project_name', 'job_type', 'is_active',
            'salary', 'hire_date',
        ]
        read_only_fields = ["employee_id"]


class SalaryAdvanceSerializer(CalendarModelSerializer):
    calendar_module = "payroll"
    employee_name = serializers.CharField(source="employee.full_name", read_only=True)
    employee_id = serializers.CharField(source="employee.employee_id", read_only=True)
    advance_month = serializers.SerializerMethodField()
    amount_deducted = serializers.SerializerMethodField()
    advance_status = serializers.SerializerMethodField()
    advance_status_label = serializers.SerializerMethodField()

    class Meta:
        model = SalaryAdvance
        fields = [
            "id",
            "employee",
            "employee_name",
            "employee_id",
            "amount",
            "remaining_balance",
            "amount_deducted",
            "date",
            "advance_month",
            "reason",
            "notes",
            "status",
            "advance_status",
            "advance_status_label",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["remaining_balance", "created_at", "updated_at"]

    def validate(self, data):
        amount = data.get("amount", getattr(self.instance, "amount", Decimal("0.00")))
        remaining = data.get("remaining_balance", getattr(self.instance, "remaining_balance", amount))
        if amount < Decimal("0.01"):
            raise serializers.ValidationError({"amount": "Advance amount must be greater than zero."})
        if remaining < 0:
            raise serializers.ValidationError({"remaining_balance": "Remaining balance cannot be negative."})
        if remaining > amount:
            raise serializers.ValidationError({"remaining_balance": "Remaining balance cannot exceed the advance amount."})
        return data

    def create(self, validated_data):
        if "created_by" not in validated_data and self.context.get("request"):
            validated_data["created_by"] = self.context["request"].user
        return SalaryAdvance.objects.create(**validated_data)

    def get_advance_month(self, obj):
        calendar_type = get_module_calendar("payroll", request=self.context.get("request"))
        if calendar_type == CALENDAR_SHAMSI:
            year, month, _ = to_shamsi(obj.date)
            return f"{year}-{month:02d}"
        return f"{obj.date.year}-{obj.date.month:02d}"

    def get_amount_deducted(self, obj):
        return obj.amount - obj.remaining_balance

    def get_advance_status(self, obj):
        if obj.status == "cancelled":
            return "cancelled"
        if obj.remaining_balance <= 0:
            return "fully_deducted"
        if obj.remaining_balance < obj.amount:
            return "partially_deducted"
        return "outstanding"

    def get_advance_status_label(self, obj):
        return {
            "cancelled": "Cancelled",
            "fully_deducted": "Fully Deducted",
            "partially_deducted": "Partially Deducted",
            "outstanding": "Outstanding",
        }[self.get_advance_status(obj)]


class PayrollAdvanceDeductionSerializer(CalendarModelSerializer):
    calendar_module = "payroll"
    advance_date = serializers.DateField(source="advance.date", read_only=True)
    advance_reason = serializers.CharField(source="advance.reason", read_only=True)
    advance_amount = serializers.DecimalField(
        source="advance.amount",
        max_digits=12,
        decimal_places=2,
        read_only=True,
    )
    remaining_balance = serializers.DecimalField(
        source="advance.remaining_balance",
        max_digits=12,
        decimal_places=2,
        read_only=True,
    )

    class Meta:
        model = PayrollAdvanceDeduction
        fields = [
            "id",
            "advance",
            "advance_date",
            "advance_reason",
            "advance_amount",
            "amount",
            "remaining_balance",
        ]


class PayrollPaymentSerializer(CalendarModelSerializer):
    calendar_module = "payroll"

    class Meta:
        model = PayrollPayment
        fields = [
            "id",
            "payroll",
            "amount",
            "payment_date",
            "payment_method",
            "reference_number",
            "notes",
            "created_at",
        ]
        read_only_fields = ["payroll", "created_at"]

    def validate(self, data):
        payroll = self.context.get("payroll")
        amount = data.get("amount")
        if amount is not None and amount <= 0:
            raise serializers.ValidationError({"amount": "Payment amount must be greater than zero."})
        if payroll and amount and amount > payroll.balance_due:
            raise serializers.ValidationError({
                "amount": "Payment amount cannot exceed the remaining unpaid balance."
            })
        return data

    def create(self, validated_data):
        payroll = self.context["payroll"]
        payment = PayrollPayment.objects.create(
            payroll=payroll,
            created_by=self.context.get("request").user if self.context.get("request") else None,
            **validated_data,
        )
        payroll.refresh_payment_totals(save=True)
        if payment.payment_date and not payroll.payment_date:
            payroll.payment_date = payment.payment_date
            payroll.payment_method = payment.payment_method
            payroll.save(update_fields=["payment_date", "payment_method", "updated_at"])
        return payment


class PayrollSerializer(CalendarModelSerializer):
    calendar_module = "payroll"
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    employee_id = serializers.CharField(source='employee.employee_id', read_only=True)
    allocation_type = serializers.CharField(read_only=True)
    allocation_type_display = serializers.CharField(source="get_allocation_type_display", read_only=True)
    employment_type = serializers.CharField(source="allocation_type", read_only=True)
    employment_type_display = serializers.CharField(source="get_allocation_type_display", read_only=True)
    project = serializers.PrimaryKeyRelatedField(read_only=True)
    project_name = serializers.CharField(source="project.name", read_only=True)
    payments = PayrollPaymentSerializer(many=True, read_only=True)
    applied_advances = PayrollAdvanceDeductionSerializer(
        source="advance_deduction_records",
        many=True,
        read_only=True,
    )
    total_deductions = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    payable_before_advances = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    advance_deduction_mode = serializers.ChoiceField(
        choices=["all", "selected", "partial", "none", "keep"],
        write_only=True,
        required=False,
    )
    advance_deductions_payload = serializers.ListField(
        child=serializers.DictField(),
        write_only=True,
        required=False,
    )
    selected_advance_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
    )
    partial_advance_amount = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        write_only=True,
        required=False,
    )
    payment_amount = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        write_only=True,
        required=False,
    )
    payment_reference_number = serializers.CharField(write_only=True, required=False, allow_blank=True)
    payment_notes = serializers.CharField(write_only=True, required=False, allow_blank=True)
    
    class Meta:
        model = Payroll
        fields = [
            'id', 'employee', 'employee_name', 'employee_id',
            'allocation_type', 'allocation_type_display',
            'employment_type', 'employment_type_display', 'project', 'project_name',
            'payroll_period_start', 'payroll_period_end',
            'basic_salary', 'overtime_hours', 'overtime_rate',
            'overtime_amount', 'bonus', 'allowances',
            'deductions', 'tax_deducted', 'advance_deductions', 'currency',
            'gross_pay', 'net_pay', 'total_deductions', 'payable_before_advances',
            'amount_paid', 'balance_due', 'payment_status',
            'payment_method', 'payment_date', 'notes',
            'payments', 'applied_advances',
            'advance_deduction_mode', 'advance_deductions_payload',
            'selected_advance_ids', 'partial_advance_amount',
            'payment_amount', 'payment_reference_number', 'payment_notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'created_at', 'updated_at', 'overtime_amount', 'gross_pay', 'net_pay',
            'advance_deductions', 'amount_paid', 'balance_due', 'payment_status',
        ]
        validators = []

    def validate(self, data):
        data = super().validate(data)
        employee = data.get("employee", getattr(self.instance, "employee", None))
        period_start = data.get(
            "payroll_period_start",
            getattr(self.instance, "payroll_period_start", None),
        )
        period_end = data.get(
            "payroll_period_end",
            getattr(self.instance, "payroll_period_end", None),
        )

        if period_start and period_end and period_start > period_end:
            raise serializers.ValidationError({
                "payroll_period_end": "Payroll period end must be on or after the start date."
            })

        if employee and period_start and period_end:
            duplicate = Payroll.objects.filter(
                employee=employee,
                payroll_period_start=period_start,
                payroll_period_end=period_end,
            )
            if self.instance:
                duplicate = duplicate.exclude(pk=self.instance.pk)
            if duplicate.exists():
                raise serializers.ValidationError({
                    "non_field_errors": [
                        (
                            "A payroll already exists for this employee and selected month. "
                            "Please review the existing payroll before creating another one."
                        )
                    ]
                })

        return data

    def _advance_queryset(self, employee, through_date=None):
        queryset = SalaryAdvance.objects.select_for_update().filter(
            employee=employee,
            status="active",
            remaining_balance__gt=0,
        )
        if through_date:
            queryset = queryset.filter(date__lte=through_date)
        return queryset.order_by("date", "id")

    def _build_advance_plan(self, employee, payable_amount, mode, payload=None, selected_ids=None, partial_amount=None, through_date=None):
        payable_amount = decimal_value(payable_amount)
        if payable_amount < 0:
            raise serializers.ValidationError("Payroll deductions are greater than gross pay.")
        if mode in ["none", "keep"]:
            return []

        plan = []
        seen = set()

        if payload is not None:
            for item in payload:
                advance_id = item.get("advance") or item.get("id")
                if not advance_id:
                    raise serializers.ValidationError("Each selected advance must include an advance id.")
                if advance_id in seen:
                    raise serializers.ValidationError("The same salary advance cannot be deducted twice.")
                seen.add(advance_id)
                amount = decimal_value(item.get("amount"))
                if amount <= 0:
                    raise serializers.ValidationError("Advance deduction amounts must be greater than zero.")
                try:
                    advance = self._advance_queryset(employee, through_date=through_date).get(id=advance_id)
                except SalaryAdvance.DoesNotExist:
                    raise serializers.ValidationError("Selected advance is not active for this employee or payroll month.")
                if amount > advance.remaining_balance:
                    raise serializers.ValidationError("Advance deduction cannot exceed the remaining advance balance.")
                plan.append((advance, amount))
        elif mode == "selected":
            if not selected_ids:
                return []
            for advance in self._advance_queryset(employee, through_date=through_date).filter(id__in=selected_ids):
                if advance.id in seen:
                    raise serializers.ValidationError("The same salary advance cannot be deducted twice.")
                seen.add(advance.id)
                plan.append((advance, advance.remaining_balance))
            if len(plan) != len(set(selected_ids)):
                raise serializers.ValidationError("One or more selected advances are not active for this employee or payroll month.")
        elif mode == "partial":
            amount_left = decimal_value(partial_amount)
            if amount_left <= 0:
                return []
            total_outstanding = sum((advance.remaining_balance for advance in self._advance_queryset(employee, through_date=through_date)), Decimal("0.00"))
            if amount_left > total_outstanding:
                raise serializers.ValidationError("Partial advance deduction cannot exceed outstanding advances.")
            for advance in self._advance_queryset(employee, through_date=through_date):
                if amount_left <= 0:
                    break
                amount = min(advance.remaining_balance, amount_left)
                plan.append((advance, amount))
                amount_left -= amount
        else:
            plan = [(advance, advance.remaining_balance) for advance in self._advance_queryset(employee, through_date=through_date)]

        total = sum((amount for _advance, amount in plan), Decimal("0.00"))
        if total > payable_amount:
            raise serializers.ValidationError(
                "Salary advance deductions cannot be greater than the remaining payable salary."
            )
        return plan

    def _apply_advance_plan(self, payroll, plan):
        PayrollAdvanceDeduction.objects.filter(payroll=payroll).delete()
        for advance, amount in plan:
            advance.remaining_balance -= amount
            if advance.remaining_balance < 0:
                raise serializers.ValidationError("Salary advance remaining balance cannot be negative.")
            advance.save(update_fields=["remaining_balance", "status", "updated_at"])
            PayrollAdvanceDeduction.objects.create(
                payroll=payroll,
                advance=advance,
                amount=amount,
            )

    def _release_existing_advances(self, payroll):
        for deduction in payroll.advance_deduction_records.select_related("advance").all():
            advance = deduction.advance
            if advance.status != "cancelled":
                advance.remaining_balance += deduction.amount
                advance.save(update_fields=["remaining_balance", "status", "updated_at"])
        payroll.advance_deduction_records.all().delete()

    def _create_initial_payment(self, payroll, payment_amount, reference_number="", notes=""):
        if not payment_amount and payroll.payment_date and not payroll.payments.exists():
            payment_amount = payroll.net_pay
        if not payment_amount:
            payroll.refresh_payment_totals(save=True)
            return
        payment_amount = decimal_value(payment_amount)
        if payment_amount > payroll.net_pay:
            raise serializers.ValidationError("Payment amount cannot exceed net salary.")
        PayrollPayment.objects.create(
            payroll=payroll,
            amount=payment_amount,
            payment_date=payroll.payment_date or date.today(),
            payment_method=payroll.payment_method,
            reference_number=reference_number,
            notes=notes,
            created_by=self.context.get("request").user if self.context.get("request") else None,
        )
        payroll.refresh_payment_totals(save=True)

    def create(self, validated_data):
        mode = validated_data.pop("advance_deduction_mode", "all")
        payload = validated_data.pop("advance_deductions_payload", None)
        selected_ids = validated_data.pop("selected_advance_ids", None)
        partial_amount = validated_data.pop("partial_advance_amount", None)
        payment_amount = validated_data.pop("payment_amount", None)
        reference_number = validated_data.pop("payment_reference_number", "")
        payment_notes = validated_data.pop("payment_notes", "")

        with transaction.atomic():
            payroll = Payroll(**validated_data)
            payroll.advance_deductions = Decimal("0.00")
            payroll.calculate_totals()
            plan = self._build_advance_plan(
                payroll.employee,
                payroll.payable_before_advances,
                mode,
                payload=payload,
                selected_ids=selected_ids,
                partial_amount=partial_amount,
                through_date=payroll.payroll_period_end,
            )
            payroll.advance_deductions = sum((amount for _advance, amount in plan), Decimal("0.00"))
            payroll.calculate_totals()
            if payroll.net_pay < 0:
                raise serializers.ValidationError("Payroll net pay cannot be negative.")
            payroll.save()
            self._apply_advance_plan(payroll, plan)
            self._create_initial_payment(payroll, payment_amount, reference_number, payment_notes)
        return payroll

    def update(self, instance, validated_data):
        mode = validated_data.pop("advance_deduction_mode", "keep")
        payload = validated_data.pop("advance_deductions_payload", None)
        selected_ids = validated_data.pop("selected_advance_ids", None)
        partial_amount = validated_data.pop("partial_advance_amount", None)
        payment_amount = validated_data.pop("payment_amount", None)
        reference_number = validated_data.pop("payment_reference_number", "")
        payment_notes = validated_data.pop("payment_notes", "")

        with transaction.atomic():
            if mode != "keep":
                self._release_existing_advances(instance)
                instance.advance_deductions = Decimal("0.00")

            for attr, value in validated_data.items():
                setattr(instance, attr, value)

            if "employee" in validated_data:
                instance.snapshot_employee_allocation()

            instance.calculate_totals()

            if mode != "keep":
                plan = self._build_advance_plan(
                    instance.employee,
                    instance.payable_before_advances,
                    mode,
                    payload=payload,
                    selected_ids=selected_ids,
                    partial_amount=partial_amount,
                    through_date=instance.payroll_period_end,
                )
                instance.advance_deductions = sum((amount for _advance, amount in plan), Decimal("0.00"))
                instance.calculate_totals()
            else:
                if instance.advance_deductions > instance.payable_before_advances:
                    raise serializers.ValidationError(
                        "Salary advance deductions cannot be greater than the remaining payable salary."
                    )

            if instance.net_pay < 0:
                raise serializers.ValidationError("Payroll net pay cannot be negative.")

            instance.save()
            if mode != "keep":
                self._apply_advance_plan(instance, plan)
            self._create_initial_payment(instance, payment_amount, reference_number, payment_notes)
        return instance


class PayrollListSerializer(CalendarModelSerializer):
    calendar_module = "payroll"
    """Simplified serializer for list views"""
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    employee_id = serializers.CharField(source='employee.employee_id', read_only=True)
    allocation_type = serializers.CharField(read_only=True)
    allocation_type_display = serializers.CharField(source="get_allocation_type_display", read_only=True)
    employment_type = serializers.CharField(source="allocation_type", read_only=True)
    employment_type_display = serializers.CharField(source="get_allocation_type_display", read_only=True)
    project = serializers.PrimaryKeyRelatedField(read_only=True)
    project_name = serializers.CharField(source="project.name", read_only=True)

    class Meta:
        model = Payroll
        fields = [
            'id', 'employee', 'employee_name', 'employee_id',
            'allocation_type', 'allocation_type_display',
            'employment_type', 'employment_type_display', 'project', 'project_name',
            'payroll_period_start', 'payroll_period_end','currency',
            'gross_pay', 'net_pay', 'advance_deductions',
            'amount_paid', 'balance_due', 'payment_status', 'payment_date'
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

    def to_internal_value(self, data):
        from common.calendar_utils import get_module_calendar, parse_calendar_date

        if isinstance(data, dict):
            data = data.copy()
            calendar_type = get_module_calendar("payroll", request=self.context.get("request"))
            for field in ["payroll_period_start", "payroll_period_end"]:
                if data.get(field):
                    data[field] = parse_calendar_date(data[field], calendar_type)
        return super().to_internal_value(data)


# Add to your existing serializers.py

from .models import Attendance
from datetime import date


class AttendanceSerializer(CalendarModelSerializer):
    calendar_module = "attendance"
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


class AttendanceListSerializer(CalendarModelSerializer):
    calendar_module = "attendance"
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

    def to_internal_value(self, data):
        from common.calendar_utils import get_module_calendar, parse_calendar_date

        if isinstance(data, dict) and data.get("date"):
            data = data.copy()
            data["date"] = parse_calendar_date(data["date"], get_module_calendar("attendance", request=self.context.get("request")))
        return super().to_internal_value(data)

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
