from collections import Counter
from decimal import Decimal
import uuid

from rest_framework import serializers

from accounts.services import has_permission
from common.calendar_utils import calendar_month_bounds, format_calendar_date, get_module_calendar
from common.serializers import CalendarModelSerializer
from project.models import Apartment, ApartmentPayment, Building, Project

from .models import ApartmentServiceSetting, ServiceCharge, ServicePayment


ZERO = Decimal("0.00")


def validate_project_access(serializer, project):
    request = serializer.context.get("request")
    if not request or has_permission(request.user, "projects.view"):
        return
    if not project.user_assignments.filter(user=request.user).exists():
        raise serializers.ValidationError("The selected project is not available to you.")


class ApartmentLabelsMixin(serializers.Serializer):
    project = serializers.IntegerField(source="apartment.project_id", read_only=True)
    project_name = serializers.CharField(source="apartment.project.name", read_only=True)
    building = serializers.IntegerField(source="apartment.building_id", read_only=True)
    building_name = serializers.CharField(source="apartment.building.name", read_only=True)
    floor = serializers.IntegerField(source="apartment.floor_id", read_only=True)
    floor_number = serializers.IntegerField(source="apartment.floor.floor_number", read_only=True)
    apartment_number = serializers.CharField(source="apartment.apartment_number", read_only=True)


class ApartmentServiceSettingSerializer(ApartmentLabelsMixin, serializers.ModelSerializer):
    updated_by_name = serializers.CharField(source="updated_by.get_username", read_only=True)

    class Meta:
        model = ApartmentServiceSetting
        fields = [
            "id", "apartment", "apartment_number", "project", "project_name",
            "building", "building_name", "floor", "floor_number", "default_fee",
            "currency", "is_active", "notes", "updated_by", "updated_by_name",
            "created_at", "updated_at",
        ]
        read_only_fields = ["updated_by", "created_at", "updated_at"]

    def validate_apartment(self, apartment):
        validate_project_access(self, apartment.project)
        return apartment

    def validate_default_fee(self, value):
        if value < ZERO:
            raise serializers.ValidationError("Service fee cannot be negative.")
        return value


class ServiceSettingBulkRowSerializer(serializers.Serializer):
    apartment = serializers.PrimaryKeyRelatedField(
        queryset=Apartment.objects.select_related("project", "building", "floor")
    )
    default_fee = serializers.DecimalField(max_digits=15, decimal_places=2, min_value=ZERO)
    currency = serializers.ChoiceField(choices=Project.CURRENCY_CHOICES, default="AFN")
    is_active = serializers.BooleanField(default=True)
    notes = serializers.CharField(required=False, allow_blank=True, default="")


class BulkServiceSettingSerializer(serializers.Serializer):
    rows = serializers.ListField(child=serializers.DictField(), allow_empty=False)

    def validate(self, attrs):
        validated_rows = []
        row_errors = {}
        for index, row in enumerate(attrs["rows"]):
            serializer = ServiceSettingBulkRowSerializer(data=row, context=self.context)
            if serializer.is_valid():
                data = serializer.validated_data
                try:
                    validate_project_access(self, data["apartment"].project)
                except serializers.ValidationError as exc:
                    row_errors[str(index)] = {"apartment": exc.detail}
                else:
                    validated_rows.append((index, data))
            else:
                row_errors[str(index)] = serializer.errors

        ids = [row["apartment"].id for _, row in validated_rows]
        duplicate_ids = {value for value, count in Counter(ids).items() if count > 1}
        for index, row in validated_rows:
            if row["apartment"].id in duplicate_ids:
                row_errors.setdefault(str(index), {})["apartment"] = [
                    "An apartment can appear only once in a bulk request."
                ]
        if row_errors:
            raise serializers.ValidationError({"rows": row_errors})
        attrs["validated_rows"] = [row for _, row in validated_rows]
        return attrs


class ServiceChargeSerializer(ApartmentLabelsMixin, CalendarModelSerializer):
    calendar_module = "services"
    total_paid = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)
    remaining_amount = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)
    payment_status = serializers.CharField(read_only=True)
    created_by_name = serializers.CharField(source="created_by.get_username", read_only=True)
    adjusted_by_name = serializers.CharField(source="adjusted_by.get_username", read_only=True)

    class Meta:
        model = ServiceCharge
        fields = [
            "id", "apartment", "apartment_number", "project", "project_name",
            "building", "building_name", "floor", "floor_number", "period_start",
            "period_end", "amount", "currency", "total_paid", "remaining_amount",
            "payment_status", "adjustment_note", "created_by", "created_by_name",
            "adjusted_by", "adjusted_by_name", "created_at", "updated_at",
        ]
        read_only_fields = fields


class ServicePeriodSerializer(serializers.Serializer):
    service_period = serializers.RegexField(regex=r"^-?\d{1,4}-\d{2}$")
    project = serializers.PrimaryKeyRelatedField(queryset=Project.objects.all(), required=False)
    building = serializers.PrimaryKeyRelatedField(
        queryset=Building.objects.select_related("project"), required=False
    )
    apartment_ids = serializers.ListField(
        child=serializers.IntegerField(min_value=1), required=False, allow_empty=False
    )
    preview = serializers.BooleanField(required=False, default=False)

    def validate(self, attrs):
        project = attrs.get("project")
        building = attrs.get("building")
        if project:
            validate_project_access(self, project)
        if building:
            validate_project_access(self, building.project)
        if project and building and building.project_id != project.id:
            raise serializers.ValidationError({
                "building": ["The building does not belong to the selected project."]
            })
        try:
            year, month = attrs["service_period"].split("-")
            period_start, period_end = calendar_month_bounds(
                year,
                month,
                get_module_calendar("services", request=self.context.get("request")),
            )
        except (TypeError, ValueError):
            raise serializers.ValidationError({
                "service_period": ["Select a valid service month."]
            })
        attrs["period_start"] = period_start
        attrs["period_end"] = period_end
        return attrs


class ChargeAdjustmentSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=15, decimal_places=2, min_value=ZERO)
    adjustment_note = serializers.CharField(allow_blank=False)


class ServicePaymentSerializer(CalendarModelSerializer):
    calendar_module = "services"
    idempotency_key = serializers.UUIDField(write_only=True, required=False, validators=[])
    apartment = serializers.IntegerField(source="charge.apartment_id", read_only=True)
    apartment_number = serializers.CharField(source="charge.apartment.apartment_number", read_only=True)
    project = serializers.IntegerField(source="charge.apartment.project_id", read_only=True)
    project_name = serializers.CharField(source="charge.apartment.project.name", read_only=True)
    building = serializers.IntegerField(source="charge.apartment.building_id", read_only=True)
    building_name = serializers.CharField(source="charge.apartment.building.name", read_only=True)
    period_start = serializers.SerializerMethodField()
    period_end = serializers.SerializerMethodField()
    charge_amount = serializers.DecimalField(
        source="charge.amount", max_digits=15, decimal_places=2, read_only=True
    )
    previous_paid = serializers.SerializerMethodField()
    charge_total_paid = serializers.SerializerMethodField()
    charge_remaining = serializers.SerializerMethodField()
    recorded_by_name = serializers.CharField(source="recorded_by.get_username", read_only=True)
    payment_method_display = serializers.CharField(source="get_payment_method_display", read_only=True)

    class Meta:
        model = ServicePayment
        fields = [
            "id", "charge", "apartment", "apartment_number", "project", "project_name",
            "building", "building_name", "period_start", "period_end", "charge_amount",
            "previous_paid", "charge_total_paid", "charge_remaining",
            "receipt_number", "amount", "currency", "payment_date", "payment_method",
            "payment_method_display", "reference_number", "notes", "idempotency_key",
            "recorded_by", "recorded_by_name", "created_at", "updated_at",
        ]
        read_only_fields = [
            "receipt_number", "recorded_by", "created_at", "updated_at",
        ]

    def validate_amount(self, value):
        if value <= ZERO:
            raise serializers.ValidationError("Payment amount must be positive.")
        return value

    def get_period_start(self, obj):
        return format_calendar_date(
            obj.charge.period_start,
            get_module_calendar("services", request=self.context.get("request")),
        )

    def get_period_end(self, obj):
        return format_calendar_date(
            obj.charge.period_end,
            get_module_calendar("services", request=self.context.get("request")),
        )

    def _charge_paid(self, obj):
        value = getattr(obj, "_charge_paid_total", None)
        return value if value is not None else obj.charge.total_paid

    def get_previous_paid(self, obj):
        return self._charge_paid(obj) - obj.amount

    def get_charge_total_paid(self, obj):
        return self._charge_paid(obj)

    def get_charge_remaining(self, obj):
        return obj.charge.amount - self._charge_paid(obj)

    def validate_charge(self, charge):
        validate_project_access(self, charge.apartment.project)
        return charge

    def create(self, validated_data):
        key = validated_data.pop("idempotency_key", None) or uuid.uuid4()
        return ServicePayment.objects.create(idempotency_key=key, **validated_data)


class BulkServicePaymentSerializer(serializers.Serializer):
    rows = serializers.ListField(child=serializers.DictField(), allow_empty=False)

