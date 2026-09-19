# serializers.py
from collections import Counter

from rest_framework import serializers
from accounts.services import has_permission
from common.serializers import CalendarModelSerializer
from .models import (
    Apartment,
    ApartmentPayment,
    ApartmentSale,
    Building,
    Customer,
    Floor,
    Project,
)
from expenses.serializers import ProjectExpenseSerializer
from subcontractor.models import Contract
from subcontractor.serializers import ContractListSerializer
from django.db.models import Avg, Count, Q, Sum
from decimal import Decimal
from labour.models import WorkerPayroll
from Employees.models import Employee, Payroll


ZERO = Decimal("0.00")
SUPPORTED_CURRENCIES = ("AFN", "USD")


def _empty_currency_totals():
    return {currency: ZERO for currency in SUPPORTED_CURRENCIES}


def _validate_project_access(serializer, project):
    request = serializer.context.get("request")
    if not request or has_permission(request.user, "projects.view"):
        return
    if not project.user_assignments.filter(user=request.user).exists():
        raise serializers.ValidationError("The selected project is not available to you.")


class BuildingSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source="project.name", read_only=True)

    class Meta:
        model = Building
        fields = ["id", "project", "project_name", "name", "description", "created_at", "updated_at"]
        read_only_fields = ["created_at", "updated_at"]

    def validate_project(self, value):
        _validate_project_access(self, value)
        return value

    def validate_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("This field may not be blank.")
        return value

    def validate(self, attrs):
        instance = getattr(self, "instance", None)
        project = attrs.get("project")
        if (
            instance
            and project
            and project.id != instance.project_id
            and instance.floors.exists()
        ):
            raise serializers.ValidationError({
                "project": ["A building with floors cannot be moved to another project."],
            })
        return attrs


class FloorSerializer(serializers.ModelSerializer):
    project = serializers.IntegerField(source="building.project_id", read_only=True)
    building_name = serializers.CharField(source="building.name", read_only=True)

    class Meta:
        model = Floor
        fields = ["id", "project", "building", "building_name", "floor_number", "name", "created_at", "updated_at"]
        read_only_fields = ["created_at", "updated_at"]

    def validate_building(self, value):
        _validate_project_access(self, value.project)
        instance = getattr(self, "instance", None)
        if instance and value.id != instance.building_id and instance.apartments.exists():
            raise serializers.ValidationError(
                "A floor with apartments cannot be moved to another building."
            )
        return value


class ApartmentSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source="project.name", read_only=True)
    building_name = serializers.CharField(source="building.name", read_only=True)
    floor_number = serializers.IntegerField(source="floor.floor_number", read_only=True)

    class Meta:
        model = Apartment
        fields = [
            "id", "project", "project_name", "building", "building_name", "floor",
            "floor_number", "apartment_number", "apartment_type", "area", "bedrooms",
            "description", "status", "created_at", "updated_at",
        ]
        read_only_fields = ["status", "created_at", "updated_at"]

    def validate_apartment_number(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("This field may not be blank.")
        return value

    def validate(self, attrs):
        instance = getattr(self, "instance", None)
        project = attrs.get("project", getattr(instance, "project", None))
        building = attrs.get("building", getattr(instance, "building", None))
        floor = attrs.get("floor", getattr(instance, "floor", None))

        if project:
            _validate_project_access(self, project)
        errors = {}
        if project and building and building.project_id != project.id:
            errors["building"] = ["The building does not belong to the selected project."]
        if building and floor and floor.building_id != building.id:
            errors["floor"] = ["The floor does not belong to the selected building."]
        if project and floor and floor.building.project_id != project.id:
            errors["floor"] = ["The floor does not belong to the selected project."]
        if instance and instance.status == Apartment.Status.SOLD:
            protected_fields = {
                "project": instance.project_id,
                "building": instance.building_id,
                "floor": instance.floor_id,
                "apartment_number": instance.apartment_number,
            }
            for field, current_value in protected_fields.items():
                if field not in attrs:
                    continue
                submitted_value = getattr(attrs[field], "id", attrs[field])
                if submitted_value != current_value:
                    errors[field] = ["This field cannot be changed after the apartment is sold."]
        if errors:
            raise serializers.ValidationError(errors)
        return attrs


class FloorBulkRowSerializer(serializers.Serializer):
    floor_number = serializers.IntegerField()
    name = serializers.CharField(required=False, allow_blank=True, max_length=255, default="")


class ApartmentBulkRowSerializer(serializers.Serializer):
    apartment_number = serializers.CharField(max_length=50)
    apartment_type = serializers.CharField(required=False, allow_blank=True, max_length=100, default="")
    area = serializers.DecimalField(required=False, allow_null=True, max_digits=12, decimal_places=2, min_value=ZERO)
    bedrooms = serializers.IntegerField(required=False, allow_null=True, min_value=0, max_value=32767)
    description = serializers.CharField(required=False, allow_blank=True, default="")

    def validate_apartment_number(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("This field may not be blank.")
        return value


class BulkFloorCreateSerializer(serializers.Serializer):
    building = serializers.PrimaryKeyRelatedField(queryset=Building.objects.select_related("project"))
    rows = serializers.ListField(child=serializers.DictField(), allow_empty=False)

    def validate(self, attrs):
        building = attrs["building"]
        _validate_project_access(self, building.project)
        validated_rows = []
        row_errors = {}
        for index, row in enumerate(attrs["rows"]):
            serializer = FloorBulkRowSerializer(data=row)
            if serializer.is_valid():
                validated_rows.append((index, serializer.validated_data))
            else:
                row_errors[str(index)] = serializer.errors

        numbers = [row["floor_number"] for _, row in validated_rows]
        duplicates = {number for number, count in Counter(numbers).items() if count > 1}
        existing = set(
            Floor.objects.filter(building=building, floor_number__in=numbers)
            .values_list("floor_number", flat=True)
        )
        for index, row in validated_rows:
            if row["floor_number"] in duplicates:
                row_errors.setdefault(str(index), {})["floor_number"] = ["Duplicate floor number in this request."]
            elif row["floor_number"] in existing:
                row_errors.setdefault(str(index), {})["floor_number"] = ["This floor already exists in the selected building."]

        if row_errors:
            raise serializers.ValidationError({"rows": row_errors})
        attrs["validated_rows"] = [row for _, row in validated_rows]
        return attrs

    def create(self, validated_data):
        building = validated_data["building"]
        return Floor.objects.bulk_create(
            [Floor(building=building, **row) for row in validated_data["validated_rows"]]
        )


class BulkApartmentCreateSerializer(serializers.Serializer):
    project = serializers.PrimaryKeyRelatedField(queryset=Project.objects.all())
    building = serializers.PrimaryKeyRelatedField(queryset=Building.objects.select_related("project"))
    floor = serializers.PrimaryKeyRelatedField(queryset=Floor.objects.select_related("building__project"))
    rows = serializers.ListField(child=serializers.DictField(), allow_empty=False)

    def validate(self, attrs):
        project = attrs["project"]
        building = attrs["building"]
        floor = attrs["floor"]
        _validate_project_access(self, project)

        relation_errors = {}
        if building.project_id != project.id:
            relation_errors["building"] = ["The building does not belong to the selected project."]
        if floor.building_id != building.id:
            relation_errors["floor"] = ["The floor does not belong to the selected building."]
        if relation_errors:
            raise serializers.ValidationError(relation_errors)

        validated_rows = []
        row_errors = {}
        for index, row in enumerate(attrs["rows"]):
            serializer = ApartmentBulkRowSerializer(data=row)
            if serializer.is_valid():
                validated_rows.append((index, serializer.validated_data))
            else:
                row_errors[str(index)] = serializer.errors

        numbers = [row["apartment_number"] for _, row in validated_rows]
        duplicates = {number for number, count in Counter(numbers).items() if count > 1}
        existing = set(
            Apartment.objects.filter(floor=floor, apartment_number__in=numbers)
            .values_list("apartment_number", flat=True)
        )
        for index, row in validated_rows:
            number = row["apartment_number"]
            if number in duplicates:
                row_errors.setdefault(str(index), {})["apartment_number"] = ["Duplicate apartment number in this request."]
            elif number in existing:
                row_errors.setdefault(str(index), {})["apartment_number"] = ["This apartment already exists on the selected floor."]

        if row_errors:
            raise serializers.ValidationError({"rows": row_errors})
        attrs["validated_rows"] = [row for _, row in validated_rows]
        return attrs

    def create(self, validated_data):
        project = validated_data["project"]
        building = validated_data["building"]
        floor = validated_data["floor"]
        return Apartment.objects.bulk_create(
            [
                Apartment(project=project, building=building, floor=floor, **row)
                for row in validated_data["validated_rows"]
            ]
        )


class CustomerSerializer(CalendarModelSerializer):
    calendar_module = "projects"
    project_name = serializers.CharField(source="project.name", read_only=True)

    class Meta:
        model = Customer
        fields = [
            "id", "project", "project_name", "name", "phone", "email", "address", "notes",
            "created_at", "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]

    def validate_project(self, value):
        _validate_project_access(self, value)
        return value

    def validate_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("This field may not be blank.")
        return value


class ApartmentPaymentSerializer(CalendarModelSerializer):
    calendar_module = "projects"
    sale_reference = serializers.CharField(source="sale.reference_number", read_only=True)
    customer_name = serializers.CharField(source="customer.name", read_only=True)
    payment_method_display = serializers.CharField(source="get_payment_method_display", read_only=True)
    recorded_by_name = serializers.CharField(source="recorded_by.get_username", read_only=True)

    class Meta:
        model = ApartmentPayment
        fields = [
            "id", "sale", "sale_reference", "customer", "customer_name", "receipt_number",
            "amount", "currency", "payment_date", "payment_method", "payment_method_display",
            "reference", "notes", "recorded_by", "recorded_by_name", "created_at", "updated_at",
        ]
        read_only_fields = ["receipt_number", "recorded_by", "created_at", "updated_at"]

    def validate_amount(self, value):
        if value <= ZERO:
            raise serializers.ValidationError("Payment amount must be positive.")
        return value

    def validate(self, attrs):
        sale = attrs.get("sale")
        customer = attrs.get("customer")
        amount = attrs.get("amount")
        currency = attrs.get("currency")
        if sale:
            _validate_project_access(self, sale.apartment.project)
        errors = {}
        if sale and sale.status == ApartmentSale.Status.CANCELLED:
            errors["sale"] = ["Payments cannot be recorded against a cancelled sale."]
        if sale and customer and customer.id != sale.customer_id:
            errors["customer"] = ["The payment customer must match the sale customer."]
        if sale and currency and currency != sale.currency:
            errors["currency"] = ["Payment currency must match the sale currency."]
        if sale and amount is not None and amount > sale.remaining_balance:
            errors["amount"] = ["Payment amount cannot exceed the remaining balance."]
        if errors:
            raise serializers.ValidationError(errors)
        return attrs


class ApartmentSaleSerializer(CalendarModelSerializer):
    calendar_module = "projects"
    project = serializers.IntegerField(source="apartment.project_id", read_only=True)
    project_name = serializers.CharField(source="apartment.project.name", read_only=True)
    building = serializers.IntegerField(source="apartment.building_id", read_only=True)
    apartment_number = serializers.CharField(source="apartment.apartment_number", read_only=True)
    apartment_type = serializers.CharField(source="apartment.apartment_type", read_only=True)
    apartment_area = serializers.DecimalField(
        source="apartment.area", max_digits=12, decimal_places=2, read_only=True
    )
    apartment_bedrooms = serializers.IntegerField(source="apartment.bedrooms", read_only=True)
    apartment_description = serializers.CharField(source="apartment.description", read_only=True)
    building_name = serializers.CharField(source="apartment.building.name", read_only=True)
    floor_number = serializers.IntegerField(source="apartment.floor.floor_number", read_only=True)
    customer_name = serializers.CharField(source="customer.name", read_only=True)
    customer_phone = serializers.CharField(source="customer.phone", read_only=True)
    customer_email = serializers.CharField(source="customer.email", read_only=True)
    customer_address = serializers.CharField(source="customer.address", read_only=True)
    created_by_name = serializers.CharField(source="created_by.get_username", read_only=True)
    total_paid = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)
    remaining_balance = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)
    payment_status = serializers.CharField(read_only=True)
    payments = serializers.SerializerMethodField()
    cancelled_by_name = serializers.CharField(source="cancelled_by.get_username", read_only=True)

    class Meta:
        model = ApartmentSale
        fields = [
            "id", "project", "project_name", "apartment", "apartment_number", "apartment_type",
            "apartment_area", "apartment_bedrooms", "apartment_description", "building",
            "building_name", "floor_number",
            "customer", "customer_name", "customer_phone", "customer_email", "customer_address", "reference_number",
            "sale_date", "sale_price", "currency", "notes", "cancellation_reason", "total_paid", "remaining_balance",
            "status", "payment_status", "payments", "created_by", "created_by_name", "created_at", "updated_at",
            "cancelled_at", "cancelled_by", "cancelled_by_name",
        ]
        read_only_fields = [
            "reference_number", "status", "created_by", "created_at", "updated_at",
            "cancellation_reason", "cancelled_at", "cancelled_by",
        ]

    def validate_sale_price(self, value):
        if value <= ZERO:
            raise serializers.ValidationError("Sale price must be positive.")
        return value

    def get_payments(self, obj):
        request = self.context.get("request")
        if request and not has_permission(request.user, "apartment_payments.view"):
            return []
        return ApartmentPaymentSerializer(
            obj.payments.all(),
            many=True,
            context=self.context,
        ).data

    def validate(self, attrs):
        instance = getattr(self, "instance", None)
        apartment = attrs.get("apartment", getattr(instance, "apartment", None))
        customer = attrs.get("customer", getattr(instance, "customer", None))
        if apartment:
            _validate_project_access(self, apartment.project)
        errors = {}
        if instance and instance.status == ApartmentSale.Status.CANCELLED:
            errors["status"] = ["A cancelled sale cannot be edited."]
        if instance and apartment and apartment.id != instance.apartment_id:
            errors["apartment"] = ["The apartment cannot be changed after a sale is recorded."]
        if not instance and apartment and apartment.status != Apartment.Status.AVAILABLE:
            errors["apartment"] = ["This apartment has already been sold."]
        if (
            not instance
            and apartment
            and ApartmentSale.objects.filter(
                apartment=apartment,
                status=ApartmentSale.Status.ACTIVE,
            ).exists()
        ):
            errors["apartment"] = ["This apartment already has an active sale."]
        if apartment and customer and customer.project_id != apartment.project_id:
            errors["customer"] = ["The customer must belong to the apartment project."]
        if instance:
            sale_price = attrs.get("sale_price", instance.sale_price)
            if sale_price < instance.total_paid:
                errors["sale_price"] = ["Sale price cannot be less than the amount already paid."]
        if errors:
            raise serializers.ValidationError(errors)
        return attrs


class ProjectSerializer(CalendarModelSerializer):
    calendar_module = "projects"
    # expenses = ProjectExpenseSerializer(many=True, read_only=True)
    direct_expenses_usd = serializers.SerializerMethodField()
    direct_expenses_afn = serializers.SerializerMethodField()
    total_expenses_usd = serializers.SerializerMethodField()
    total_expenses_afn = serializers.SerializerMethodField()
    average_expense_exchange_rate = serializers.SerializerMethodField()

    # contracts = serializers.SerializerMethodField()

    total_contract_value = serializers.SerializerMethodField()
    total_contract_payments = serializers.SerializerMethodField()
    remaining_contract_balance = serializers.SerializerMethodField()
    worker_payroll_summary = serializers.SerializerMethodField()
    employee_payroll_summary = serializers.SerializerMethodField()
    payroll_records = serializers.SerializerMethodField()
    assigned_employee_count = serializers.SerializerMethodField()
    project_financial_summary = serializers.SerializerMethodField()
    apartment_summary = serializers.SerializerMethodField()
    class Meta:
        model = Project
        fields = "__all__"

    def get_direct_expenses_usd(self, obj):
        return round(
            sum(float(exp.total_usd) for exp in obj.expenses.approved()),
            2
        )

    def get_apartment_summary(self, obj):
        request = self.context.get("request")
        can_view_inventory = not request or has_permission(request.user, "apartments.view")
        can_view_sales = not request or has_permission(request.user, "apartment_sales.view")
        counts = {"total": 0, "available": 0, "sold": 0, "cancelled_sales": 0}
        if can_view_inventory:
            counts = obj.apartments.aggregate(
                total=Count("id"),
                available=Count("id", filter=Q(status=Apartment.Status.AVAILABLE)),
                sold=Count("id", filter=Q(status=Apartment.Status.SOLD)),
            )
        currencies = {
            currency: {"sales": ZERO, "received": ZERO, "outstanding": ZERO}
            for currency in SUPPORTED_CURRENCIES
        }

        if can_view_sales:
            active_sales = ApartmentSale.objects.filter(
                apartment__project=obj,
                status=ApartmentSale.Status.ACTIVE,
            )
            cancelled_sales = ApartmentSale.objects.filter(
                apartment__project=obj,
                status=ApartmentSale.Status.CANCELLED,
            )
            counts["cancelled_sales"] = cancelled_sales.count()
            sale_totals = (
                active_sales
                .values("currency")
                .annotate(total=Sum("sale_price"))
            )
            for row in sale_totals:
                if row["currency"] in currencies:
                    currencies[row["currency"]]["sales"] = row["total"] or ZERO

            payment_totals = (
                ApartmentPayment.objects.filter(
                    sale__apartment__project=obj,
                    sale__status=ApartmentSale.Status.ACTIVE,
                )
                .values("currency")
                .annotate(total=Sum("amount"))
            )
            for row in payment_totals:
                if row["currency"] in currencies:
                    currencies[row["currency"]]["received"] = row["total"] or ZERO

            cancelled_totals = (
                cancelled_sales.values("currency").annotate(total=Sum("sale_price"))
            )
            for row in cancelled_totals:
                if row["currency"] in currencies:
                    currencies[row["currency"]]["cancelled"] = row["total"] or ZERO

        for totals in currencies.values():
            totals.setdefault("cancelled", ZERO)
            totals["outstanding"] = totals["sales"] - totals["received"]

        return {
            **counts,
            "currencies": currencies,
            "can_view_inventory": can_view_inventory,
            "can_view_sales": can_view_sales,
        }

    def get_direct_expenses_afn(self, obj):
        return round(
            sum(float(exp.total_afn) for exp in obj.expenses.approved()),
            2
        )

    def get_average_expense_exchange_rate(self, obj):
        average = (
            obj.expenses.approved()
            .filter(exchange_rate__gt=0)
            .aggregate(value=Avg("exchange_rate"))["value"]
        )
        return round(float(average), 4) if average is not None else None

    def get_total_expenses_usd(self, obj):
        direct = Decimal(str(self.get_direct_expenses_usd(obj)))
        payroll = self._employee_payroll_totals(obj)["USD"]["paid"]
        return round(float(direct + payroll), 2)

    def get_total_expenses_afn(self, obj):
        direct = Decimal(str(self.get_direct_expenses_afn(obj)))
        payroll = self._employee_payroll_totals(obj)["AFN"]["paid"]
        return round(float(direct + payroll), 2)
    # def get_contracts(self, obj):
    #     contracts = obj.subcontractor_contracts.all()
    #     return ContractListSerializer(contracts, many=True).data
    def _contract_currency(self, contract, obj):
        currency = (contract.currency or "").upper()
        if currency in SUPPORTED_CURRENCIES:
            return currency

        budget_currency = (obj.budget_currency or "").upper()
        if budget_currency in SUPPORTED_CURRENCIES:
            return budget_currency

        return "AFN"

    def _contract_value(self, contract):
        return contract.adjusted_contract_value or ZERO

    def _contract_payments_total(self, contract):
        return (
            contract.payments.aggregate(total=Sum("amount"))["total"]
            or ZERO
        )

    def get_total_contract_value(self, obj):
        totals = _empty_currency_totals()

        for contract in obj.subcontractor_contracts.all():
            currency = self._contract_currency(contract, obj)
            totals[currency] += self._contract_value(contract)

        return totals

    def get_total_contract_payments(self, obj):
        totals = _empty_currency_totals()

        for contract in obj.subcontractor_contracts.all():
            currency = self._contract_currency(contract, obj)
            totals[currency] += self._contract_payments_total(contract)

        return totals

    def get_remaining_contract_balance(self, obj):
        totals = _empty_currency_totals()

        for contract in obj.subcontractor_contracts.all():
            adjusted_value = contract.adjusted_contract_value
            if adjusted_value is None:
                continue

            currency = self._contract_currency(contract, obj)
            totals[currency] += adjusted_value - self._contract_payments_total(contract)

        return totals

    def get_worker_payroll_summary(self, obj):
        summary = {
            "AFN": {
                "gross": Decimal("0.00"),
                "net": Decimal("0.00"),
                "advances": Decimal("0.00"),
                "deductions": Decimal("0.00"),
                "count": 0,
            },
            "USD": {
                "gross": Decimal("0.00"),
                "net": Decimal("0.00"),
                "advances": Decimal("0.00"),
                "deductions": Decimal("0.00"),
                "count": 0,
            },
        }

        payrolls = WorkerPayroll.objects.filter(project=obj)
        for currency in summary.keys():
            totals = payrolls.filter(currency=currency).aggregate(
                gross=Sum("gross_amount"),
                net=Sum("net_amount"),
                advances=Sum("advances"),
                deductions=Sum("deductions"),
            )
            summary[currency] = {
                "gross": totals["gross"] or Decimal("0.00"),
                "net": totals["net"] or Decimal("0.00"),
                "advances": totals["advances"] or Decimal("0.00"),
                "deductions": totals["deductions"] or Decimal("0.00"),
                "count": payrolls.filter(currency=currency).count(),
            }
        return summary

    def _employee_payroll_queryset(self, obj):
        return Payroll.objects.select_related("employee", "project").filter(
            allocation_type=Payroll.AllocationType.PROJECT,
            project=obj,
        )

    def _employee_payroll_totals(self, obj):
        payrolls = self._employee_payroll_queryset(obj)
        summary = {
            "AFN": {"gross": Decimal("0.00"), "net": Decimal("0.00"), "paid": Decimal("0.00"), "balance": Decimal("0.00"), "count": 0},
            "USD": {"gross": Decimal("0.00"), "net": Decimal("0.00"), "paid": Decimal("0.00"), "balance": Decimal("0.00"), "count": 0},
        }
        for currency in summary.keys():
            totals = payrolls.filter(currency=currency).aggregate(
                gross=Sum("gross_pay"),
                net=Sum("net_pay"),
                paid=Sum("amount_paid"),
                balance=Sum("balance_due"),
            )
            summary[currency] = {
                "gross": totals["gross"] or Decimal("0.00"),
                "net": totals["net"] or Decimal("0.00"),
                "paid": totals["paid"] or Decimal("0.00"),
                "balance": totals["balance"] or Decimal("0.00"),
                "count": payrolls.filter(currency=currency).count(),
            }
        return summary

    def get_employee_payroll_summary(self, obj):
        return self._employee_payroll_totals(obj)

    def get_assigned_employee_count(self, obj):
        return Employee.objects.filter(
            employment_type=Employee.EmploymentType.PROJECT,
            project=obj,
            is_active=True,
        ).count()

    def get_payroll_records(self, obj):
        records = self._employee_payroll_queryset(obj).order_by(
            "-payroll_period_start",
            "employee__first_name",
            "employee__last_name",
        )[:50]
        return [
            {
                "id": payroll.id,
                "employee": payroll.employee.full_name,
                "employee_id": payroll.employee.employee_id,
                "period_start": payroll.payroll_period_start,
                "period_end": payroll.payroll_period_end,
                "gross_pay": payroll.gross_pay,
                "net_pay": payroll.net_pay,
                "amount_paid": payroll.amount_paid,
                "payment_date": payroll.payment_date,
                "payment_status": payroll.payment_status,
                "currency": payroll.currency,
            }
            for payroll in records
        ]

    def get_project_financial_summary(self, obj):
        payroll = self._employee_payroll_totals(obj)
        direct_afn = Decimal(str(self.get_direct_expenses_afn(obj)))
        direct_usd = Decimal(str(self.get_direct_expenses_usd(obj)))
        payroll_afn = payroll["AFN"]["paid"]
        payroll_usd = payroll["USD"]["paid"]
        return {
            "contract_value": self.get_total_contract_value(obj),
            "direct_expenses_afn": direct_afn,
            "direct_expenses_usd": direct_usd,
            "payroll_expenses_afn": payroll_afn,
            "payroll_expenses_usd": payroll_usd,
            "total_expenses_afn": direct_afn + payroll_afn,
            "total_expenses_usd": direct_usd + payroll_usd,
            "remaining_budget_afn": (
                obj.estimated_budget - direct_afn - payroll_afn
                if obj.budget_currency == "AFN" else None
            ),
            "remaining_budget_usd": (
                obj.estimated_budget - direct_usd - payroll_usd
                if obj.budget_currency == "USD" else None
            ),
        }
    
class ProjectListSerializer(CalendarModelSerializer):
    calendar_module = "projects"
    class Meta:
        model=Project
        fields=["id","name","status","start_date","location","property_type"]   
