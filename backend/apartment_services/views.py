from collections import defaultdict
from decimal import Decimal

from django.db import transaction
from django.db.models import DecimalField, F, OuterRef, Q, Subquery, Sum, Value
from django.db.models.functions import Coalesce
from django.shortcuts import get_object_or_404
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from accounts.permissions import RBACPermission
from accounts.services import has_permission
from common.calendar_utils import get_module_calendar, parse_calendar_date
from project.models import Apartment

from .models import ApartmentServiceSetting, ServiceCharge, ServicePayment
from .serializers import (
    ApartmentServiceSettingSerializer,
    BulkServicePaymentSerializer,
    BulkServiceSettingSerializer,
    ChargeAdjustmentSerializer,
    ServiceChargeSerializer,
    ServicePaymentSerializer,
    ServicePeriodSerializer,
)


ZERO = Decimal("0.00")
MONEY = DecimalField(max_digits=15, decimal_places=2)


def _scope_to_available_projects(queryset, user, field="apartment__project_id"):
    if has_permission(user, "projects.view"):
        return queryset
    return queryset.filter(**{f"{field}__in": user.project_assignments.values("project_id")})


def _payment_total_subquery():
    return (
        ServicePayment.objects.filter(charge_id=OuterRef("pk"))
        .values("charge_id")
        .annotate(total=Sum("amount"))
        .values("total")[:1]
    )


def service_charge_queryset():
    return (
        ServiceCharge.objects.select_related(
            "apartment",
            "apartment__project",
            "apartment__building",
            "apartment__floor",
            "created_by",
            "adjusted_by",
        )
        .prefetch_related("payments", "payments__recorded_by")
        .annotate(
            _paid_total=Coalesce(
                Subquery(_payment_total_subquery(), output_field=MONEY),
                Value(ZERO),
                output_field=MONEY,
            )
        )
    )


def service_payment_queryset():
    paid_for_charge = (
        ServicePayment.objects.filter(charge_id=OuterRef("charge_id"))
        .values("charge_id")
        .annotate(total=Sum("amount"))
        .values("total")[:1]
    )
    return ServicePayment.objects.select_related(
        "charge",
        "charge__apartment",
        "charge__apartment__project",
        "charge__apartment__building",
        "charge__apartment__floor",
        "recorded_by",
    ).annotate(
        _charge_paid_total=Coalesce(
            Subquery(paid_for_charge, output_field=MONEY),
            Value(ZERO),
            output_field=MONEY,
        )
    )


def _period_data(request, value):
    serializer = ServicePeriodSerializer(
        data={"service_period": value},
        context={"request": request},
    )
    serializer.is_valid(raise_exception=True)
    return serializer.validated_data


def _apply_apartment_filters(queryset, request, prefix="apartment__"):
    for parameter, lookup in (
        ("project", f"{prefix}project_id"),
        ("building", f"{prefix}building_id"),
        ("apartment", f"{prefix}id"),
    ):
        value = request.query_params.get(parameter)
        if value:
            queryset = queryset.filter(**{lookup: value})
    search = request.query_params.get("search", "").strip()
    if search:
        queryset = queryset.filter(
            Q(**{f"{prefix}apartment_number__icontains": search})
            | Q(**{f"{prefix}building__name__icontains": search})
            | Q(**{f"{prefix}project__name__icontains": search})
        )
    return queryset


class ApartmentServiceSettingViewSet(
    mixins.CreateModelMixin,
    mixins.UpdateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = ApartmentServiceSettingSerializer
    permission_classes = [RBACPermission]
    rbac_resource = "services"
    rbac_action_permissions = {
        "list": ("services.view", "service_settings.manage"),
        "retrieve": ("services.view", "service_settings.manage"),
        "create": ("service_settings.manage",),
        "update": ("service_settings.manage",),
        "partial_update": ("service_settings.manage",),
        "bulk": ("service_settings.manage",),
    }

    def get_queryset(self):
        queryset = ApartmentServiceSetting.objects.select_related(
            "apartment",
            "apartment__project",
            "apartment__building",
            "apartment__floor",
            "updated_by",
        )
        queryset = _scope_to_available_projects(queryset, self.request.user)
        queryset = _apply_apartment_filters(queryset, self.request)
        active = self.request.query_params.get("active")
        if active in {"1", "true", "yes"}:
            queryset = queryset.filter(is_active=True)
        elif active in {"0", "false", "no"}:
            queryset = queryset.filter(is_active=False)
        return queryset

    def perform_create(self, serializer):
        serializer.save(updated_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    @action(detail=False, methods=["post"], url_path="bulk")
    @transaction.atomic
    def bulk(self, request):
        serializer = BulkServiceSettingSerializer(
            data=request.data,
            context=self.get_serializer_context(),
        )
        serializer.is_valid(raise_exception=True)
        saved = []
        created_count = 0
        updated_count = 0
        for row in serializer.validated_data["validated_rows"]:
            apartment = row.pop("apartment")
            setting, created = ApartmentServiceSetting.objects.update_or_create(
                apartment=apartment,
                defaults={**row, "updated_by": request.user},
            )
            saved.append(setting)
            created_count += int(created)
            updated_count += int(not created)
        return Response({
            "created": created_count,
            "updated": updated_count,
            "settings": ApartmentServiceSettingSerializer(
                saved,
                many=True,
                context=self.get_serializer_context(),
            ).data,
        })


class ServiceChargeViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = ServiceChargeSerializer
    permission_classes = [RBACPermission]
    rbac_resource = "services"
    rbac_action_permissions = {
        "generate": ("service_charges.generate",),
        "adjust": ("service_charges.adjust",),
        "apartment_account": ("services.view",),
        "overview": ("services.view",),
    }

    def get_queryset(self):
        queryset = _scope_to_available_projects(
            service_charge_queryset(),
            self.request.user,
        )
        queryset = _apply_apartment_filters(queryset, self.request)
        service_period = self.request.query_params.get("service_period")
        if service_period:
            period = _period_data(self.request, service_period)
            queryset = queryset.filter(period_start=period["period_start"])
        status_value = self.request.query_params.get("status", "").upper()
        if status_value == ServiceCharge.Status.UNPAID:
            queryset = queryset.filter(_paid_total=ZERO)
        elif status_value == ServiceCharge.Status.PARTIAL:
            queryset = queryset.filter(_paid_total__gt=ZERO, _paid_total__lt=F("amount"))
        elif status_value == ServiceCharge.Status.PAID:
            queryset = queryset.filter(_paid_total__gte=F("amount"))
        elif status_value:
            raise ValidationError({"status": ["Select a valid payment status."]})
        return queryset

    @action(detail=False, methods=["post"], url_path="generate")
    @transaction.atomic
    def generate(self, request):
        serializer = ServicePeriodSerializer(
            data=request.data,
            context=self.get_serializer_context(),
        )
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        settings = ApartmentServiceSetting.objects.select_related(
            "apartment__project",
            "apartment__building",
            "apartment__floor",
        ).filter(is_active=True)
        settings = _scope_to_available_projects(settings, request.user)
        if data.get("project"):
            settings = settings.filter(apartment__project=data["project"])
        if data.get("building"):
            settings = settings.filter(apartment__building=data["building"])
        if data.get("apartment_ids"):
            settings = settings.filter(apartment_id__in=data["apartment_ids"])
        settings = list(settings)
        apartment_ids = [setting.apartment_id for setting in settings]
        existing_ids = set(
            ServiceCharge.objects.filter(
                apartment_id__in=apartment_ids,
                period_start=data["period_start"],
            ).values_list("apartment_id", flat=True)
        )
        currency_totals = defaultdict(lambda: ZERO)
        eligible_totals = defaultdict(lambda: ZERO)
        for setting in settings:
            eligible_totals[setting.currency] += setting.default_fee
            if setting.apartment_id not in existing_ids:
                currency_totals[setting.currency] += setting.default_fee

        summary = {
            "service_period": data["service_period"],
            "period_start": data["period_start"].isoformat(),
            "period_end": data["period_end"].isoformat(),
            "eligible": len(settings),
            "already_existed": len(existing_ids),
            "to_create": len(settings) - len(existing_ids),
            "expected_totals": {key: str(value) for key, value in currency_totals.items()},
            "eligible_totals": {key: str(value) for key, value in eligible_totals.items()},
        }
        if data["preview"]:
            return Response(summary)

        new_charges = [
            ServiceCharge(
                apartment=setting.apartment,
                period_start=data["period_start"],
                period_end=data["period_end"],
                amount=setting.default_fee,
                currency=setting.currency,
                created_by=request.user,
            )
            for setting in settings
            if setting.apartment_id not in existing_ids
        ]
        ServiceCharge.objects.bulk_create(new_charges, ignore_conflicts=True)
        final_ids = set(
            ServiceCharge.objects.filter(
                apartment_id__in=apartment_ids,
                period_start=data["period_start"],
            ).values_list("apartment_id", flat=True)
        )
        summary.update({
            "created": max(0, len(final_ids) - len(existing_ids)),
            "skipped": len(settings) - max(0, len(final_ids) - len(existing_ids)),
            "failed": 0,
        })
        return Response(summary, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="adjust")
    @transaction.atomic
    def adjust(self, request, pk=None):
        charge = get_object_or_404(
            _scope_to_available_projects(
                service_charge_queryset().select_for_update(),
                request.user,
            ),
            pk=pk,
        )
        serializer = ChargeAdjustmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        amount = serializer.validated_data["amount"]
        if amount < charge.total_paid:
            raise ValidationError({
                "amount": ["Charge amount cannot be less than the amount already paid."]
            })
        charge.amount = amount
        charge.adjustment_note = serializer.validated_data["adjustment_note"]
        charge.adjusted_by = request.user
        charge.save(update_fields=["amount", "adjustment_note", "adjusted_by", "updated_at"])
        refreshed = service_charge_queryset().get(pk=charge.pk)
        return Response(self.get_serializer(refreshed).data)

    @action(detail=False, methods=["get"], url_path="apartment-account")
    def apartment_account(self, request):
        apartment_id = request.query_params.get("apartment")
        if not apartment_id:
            raise ValidationError({"apartment": ["This query parameter is required."]})
        apartments = _scope_to_available_projects(
            Apartment.objects.select_related("project", "building", "floor"),
            request.user,
            "project_id",
        )
        apartment = get_object_or_404(apartments, pk=apartment_id)
        charges = list(
            service_charge_queryset().filter(apartment=apartment).order_by("-period_start")
        )
        totals = defaultdict(lambda: {"charged": ZERO, "paid": ZERO, "outstanding": ZERO})
        for charge in charges:
            totals[charge.currency]["charged"] += charge.amount
            totals[charge.currency]["paid"] += charge.total_paid
            totals[charge.currency]["outstanding"] += charge.remaining_amount
        setting = ApartmentServiceSetting.objects.filter(apartment=apartment).first()
        return Response({
            "apartment": apartment.id,
            "apartment_number": apartment.apartment_number,
            "setting": ApartmentServiceSettingSerializer(
                setting,
                context=self.get_serializer_context(),
            ).data if setting else None,
            "totals": {
                currency: {key: str(value) for key, value in values.items()}
                for currency, values in totals.items()
            },
            "charges": self.get_serializer(charges, many=True).data,
            "payments": ServicePaymentSerializer(
                service_payment_queryset().filter(charge__apartment=apartment),
                many=True,
                context=self.get_serializer_context(),
            ).data,
        })

    @action(detail=False, methods=["get"], url_path="overview")
    def overview(self, request):
        charges = list(self.get_queryset())
        totals = defaultdict(lambda: {"charged": ZERO, "collected": ZERO, "outstanding": ZERO})
        counts = {"paid": 0, "partial": 0, "unpaid": 0}
        for charge in charges:
            totals[charge.currency]["charged"] += charge.amount
            totals[charge.currency]["collected"] += charge.total_paid
            totals[charge.currency]["outstanding"] += charge.remaining_amount
            counts[charge.payment_status.lower()] += 1
        return Response({
            "currencies": {
                currency: {key: str(value) for key, value in values.items()}
                for currency, values in totals.items()
            },
            "paid_count": counts["paid"],
            "partial_count": counts["partial"],
            "unpaid_count": counts["unpaid"],
            "charge_count": len(charges),
        })


class ServicePaymentViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = ServicePaymentSerializer
    permission_classes = [RBACPermission]
    rbac_resource = "service_payments"
    rbac_action_permissions = {
        "list": ("service_payments.view", "services.view"),
        "retrieve": ("service_payments.view", "services.view"),
        "create": ("service_payments.record",),
        "bulk": ("service_payments.record",),
    }

    def get_queryset(self):
        queryset = service_payment_queryset()
        queryset = _scope_to_available_projects(
            queryset,
            self.request.user,
            "charge__apartment__project_id",
        )
        for parameter, lookup in (
            ("project", "charge__apartment__project_id"),
            ("building", "charge__apartment__building_id"),
            ("apartment", "charge__apartment_id"),
            ("charge", "charge_id"),
            ("payment_method", "payment_method"),
        ):
            value = self.request.query_params.get(parameter)
            if value:
                queryset = queryset.filter(**{lookup: value})
        calendar_type = get_module_calendar("services", request=self.request)
        for parameter, lookup in (
            ("date", "payment_date"),
            ("date_from", "payment_date__gte"),
            ("date_to", "payment_date__lte"),
        ):
            value = self.request.query_params.get(parameter)
            if value:
                try:
                    parsed = parse_calendar_date(value, calendar_type)
                except ValueError as exc:
                    raise ValidationError({parameter: [str(exc)]}) from exc
                queryset = queryset.filter(**{lookup: parsed})
        service_period = self.request.query_params.get("service_period")
        if service_period:
            period = _period_data(self.request, service_period)
            queryset = queryset.filter(charge__period_start=period["period_start"])
        search = self.request.query_params.get("search", "").strip()
        if search:
            queryset = queryset.filter(
                Q(receipt_number__icontains=search)
                | Q(reference_number__icontains=search)
                | Q(charge__apartment__apartment_number__icontains=search)
            )
        return queryset

    def _save_payment(self, serializer, request):
        with transaction.atomic():
            validated = serializer.validated_data
            charge_id = validated["charge"].id
            charges = _scope_to_available_projects(
                service_charge_queryset().select_for_update(),
                request.user,
            )
            charge = get_object_or_404(charges, pk=charge_id)
            key = validated.get("idempotency_key")
            if key:
                existing = ServicePayment.objects.filter(idempotency_key=key).first()
                if existing:
                    if existing.charge_id != charge.id:
                        raise ValidationError({
                            "idempotency_key": ["This request key is already in use."]
                        })
                    return existing, False
            amount = validated["amount"]
            submitted_currency = validated.get("currency", charge.currency)
            errors = {}
            if submitted_currency != charge.currency:
                errors["currency"] = ["Payment currency must match the service charge currency."]
            if amount > charge.remaining_amount:
                errors["amount"] = ["Payment amount cannot exceed the outstanding balance."]
            if errors:
                raise ValidationError(errors)
            payment = serializer.save(
                charge=charge,
                currency=charge.currency,
                recorded_by=request.user,
            )
            return payment, True

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payment, created = self._save_payment(serializer, request)
        result = self.get_serializer(payment).data
        result["duplicate_prevented"] = not created
        return Response(
            result,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    @action(detail=False, methods=["post"], url_path="bulk")
    def bulk(self, request):
        envelope = BulkServicePaymentSerializer(data=request.data)
        envelope.is_valid(raise_exception=True)
        results = []
        created_count = 0
        failed_count = 0
        for index, row in enumerate(envelope.validated_data["rows"]):
            serializer = self.get_serializer(data=row)
            if not serializer.is_valid():
                results.append({"index": index, "success": False, "errors": serializer.errors})
                failed_count += 1
                continue
            try:
                payment, created = self._save_payment(serializer, request)
            except ValidationError as exc:
                results.append({"index": index, "success": False, "errors": exc.detail})
                failed_count += 1
            else:
                results.append({
                    "index": index,
                    "success": True,
                    "created": created,
                    "payment": self.get_serializer(payment).data,
                })
                created_count += int(created)
        return Response({
            "created": created_count,
            "failed": failed_count,
            "results": results,
        }, status=status.HTTP_207_MULTI_STATUS if failed_count else status.HTTP_201_CREATED)

