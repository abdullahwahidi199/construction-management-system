
from rest_framework.decorators import api_view
from rest_framework.generics import RetrieveUpdateDestroyAPIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework import mixins, viewsets
from rest_framework.decorators import action

from django.db import transaction
from django.db.models import DecimalField, F, Q, Sum, Value
from django.db.models.functions import Coalesce
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.dateparse import parse_date

from accounts.permissions import RBACPermission
from accounts.services import has_permission
from apartment_services.models import ServiceCharge
from .models import Apartment, ApartmentPayment, ApartmentSale, Building, Customer, Floor, Project
from .serializers import (
    ApartmentPaymentSerializer,
    ApartmentSaleSerializer,
    ApartmentSerializer,
    BuildingSerializer,
    BulkApartmentCreateSerializer,
    BulkFloorCreateSerializer,
    CustomerSerializer,
    FloorSerializer,
    ProjectListSerializer,
    ProjectSerializer,
)
# Create your views here.

@api_view(['GET','POST'])
def project_list_create(request):
    if request.method=='GET':
        if not (
            has_permission(request.user, "projects.view")
            or has_permission(request.user, "projects.view_assigned")
        ):
            raise PermissionDenied()
        projects = _scope_to_available_projects(Project.objects.all(), request.user, "id")
        serializer=ProjectListSerializer(
            projects,
            many=True
        )

        return Response(serializer.data)
    if not has_permission(request.user, "projects.create"):
        raise PermissionDenied()
    
    serializer=ProjectListSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED,
        )
    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST,
    )

def _scope_to_available_projects(queryset, user, field="project_id"):
    if has_permission(user, "projects.view"):
        return queryset
    return queryset.filter(**{f"{field}__in": user.project_assignments.values("project_id")})


class ProjectDetailView(RetrieveUpdateDestroyAPIView):
    queryset = Project.objects.prefetch_related(
        "expenses",
        "subcontractor_contracts__payments",
        "subcontractor_contracts__variations",
        "employee_payrolls__employee",
        "assigned_employees",
    )
    serializer_class = ProjectSerializer
    permission_classes = [RBACPermission]
    rbac_resource = "projects"

    def get_queryset(self):
        return _scope_to_available_projects(super().get_queryset(), self.request.user, "id")

    def perform_destroy(self, instance):
        if ServiceCharge.objects.filter(apartment__project=instance).exists():
            raise ValidationError({
                "detail": ["A project with service charge history cannot be deleted."],
            })
        instance.delete()


class BuildingViewSet(viewsets.ModelViewSet):
    serializer_class = BuildingSerializer
    permission_classes = [RBACPermission]
    rbac_resource = "buildings"

    def get_queryset(self):
        queryset = Building.objects.select_related("project")
        queryset = _scope_to_available_projects(queryset, self.request.user)
        project_id = self.request.query_params.get("project")
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        return queryset

    def perform_destroy(self, instance):
        if ApartmentSale.objects.filter(apartment__building=instance).exists():
            raise ValidationError({"detail": ["A building with apartment sales cannot be deleted."]})
        if ServiceCharge.objects.filter(apartment__building=instance).exists():
            raise ValidationError({"detail": ["A building with service charge history cannot be deleted."]})
        instance.delete()


class FloorViewSet(viewsets.ModelViewSet):
    serializer_class = FloorSerializer
    permission_classes = [RBACPermission]
    rbac_resource = "floors"
    rbac_action_permissions = {"bulk_create": ("floors.bulk_create",)}

    def get_queryset(self):
        queryset = Floor.objects.select_related("building", "building__project")
        queryset = _scope_to_available_projects(queryset, self.request.user, "building__project_id")
        project_id = self.request.query_params.get("project")
        building_id = self.request.query_params.get("building")
        if project_id:
            queryset = queryset.filter(building__project_id=project_id)
        if building_id:
            queryset = queryset.filter(building_id=building_id)
        return queryset

    @action(detail=False, methods=["post"], url_path="bulk")
    @transaction.atomic
    def bulk_create(self, request):
        serializer = BulkFloorCreateSerializer(data=request.data, context=self.get_serializer_context())
        serializer.is_valid(raise_exception=True)
        floors = serializer.save()
        return Response(
            FloorSerializer(floors, many=True, context=self.get_serializer_context()).data,
            status=status.HTTP_201_CREATED,
        )

    def perform_destroy(self, instance):
        if ApartmentSale.objects.filter(apartment__floor=instance).exists():
            raise ValidationError({"detail": ["A floor with apartment sales cannot be deleted."]})
        if ServiceCharge.objects.filter(apartment__floor=instance).exists():
            raise ValidationError({"detail": ["A floor with service charge history cannot be deleted."]})
        instance.delete()


class ApartmentViewSet(viewsets.ModelViewSet):
    serializer_class = ApartmentSerializer
    permission_classes = [RBACPermission]
    rbac_resource = "apartments"
    rbac_action_permissions = {"bulk_create": ("apartments.bulk_create",)}

    def get_queryset(self):
        queryset = Apartment.objects.select_related("project", "building", "floor")
        queryset = _scope_to_available_projects(queryset, self.request.user)
        for field in ("project", "building", "floor", "status"):
            value = self.request.query_params.get(field)
            if value:
                queryset = queryset.filter(**{field: value})
        return queryset

    @action(detail=False, methods=["post"], url_path="bulk")
    @transaction.atomic
    def bulk_create(self, request):
        serializer = BulkApartmentCreateSerializer(data=request.data, context=self.get_serializer_context())
        serializer.is_valid(raise_exception=True)
        apartments = serializer.save()
        return Response(
            ApartmentSerializer(apartments, many=True, context=self.get_serializer_context()).data,
            status=status.HTTP_201_CREATED,
        )

    def perform_destroy(self, instance):
        if ApartmentSale.objects.filter(apartment=instance).exists():
            raise ValidationError({"detail": ["A sold apartment cannot be deleted."]})
        if ServiceCharge.objects.filter(apartment=instance).exists():
            raise ValidationError({"detail": ["An apartment with service charge history cannot be deleted."]})
        instance.delete()


class CustomerViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = CustomerSerializer
    permission_classes = [RBACPermission]
    rbac_resource = "apartment_sales"
    rbac_action_permissions = {
        "list": (
            "apartment_sales.view",
            "apartment_sales.create",
            "apartment_sales.update",
        ),
        "retrieve": (
            "apartment_sales.view",
            "apartment_sales.create",
            "apartment_sales.update",
        ),
        "create": ("apartment_sales.create",),
    }

    def get_queryset(self):
        queryset = Customer.objects.select_related("project")
        queryset = _scope_to_available_projects(queryset, self.request.user)
        project_id = self.request.query_params.get("project")
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        return queryset


class ApartmentSaleViewSet(
    mixins.CreateModelMixin,
    mixins.UpdateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = ApartmentSaleSerializer
    permission_classes = [RBACPermission]
    rbac_resource = "apartment_sales"
    rbac_action_permissions = {"cancel": ("apartment_sales.cancel",)}

    def get_locked_queryset(self):
        queryset = ApartmentSale.objects.select_for_update().select_related(
            "apartment__project",
            "customer",
        )
        return _scope_to_available_projects(
            queryset,
            self.request.user,
            "apartment__project_id",
        )

    def get_queryset(self):
        paid_field = DecimalField(max_digits=15, decimal_places=2)
        queryset = ApartmentSale.objects.select_related(
            "apartment",
            "apartment__project",
            "apartment__building",
            "apartment__floor",
            "customer",
            "created_by",
            "cancelled_by",
        ).prefetch_related("payments", "payments__customer", "payments__recorded_by").annotate(
            _paid_total=Coalesce(Sum("payments__amount"), Value(0), output_field=paid_field)
        )
        queryset = _scope_to_available_projects(queryset, self.request.user, "apartment__project_id")
        project_id = self.request.query_params.get("project")
        building_id = self.request.query_params.get("building")
        apartment_id = self.request.query_params.get("apartment")
        customer_id = self.request.query_params.get("customer")
        payment_status = self.request.query_params.get("payment_status", "").upper()
        sale_status = self.request.query_params.get("status", "").upper()
        sale_date = self.request.query_params.get("date")
        date_from = self.request.query_params.get("date_from")
        date_to = self.request.query_params.get("date_to")
        if project_id:
            queryset = queryset.filter(apartment__project_id=project_id)
        if building_id:
            queryset = queryset.filter(apartment__building_id=building_id)
        if apartment_id:
            queryset = queryset.filter(apartment_id=apartment_id)
        if customer_id:
            queryset = queryset.filter(customer_id=customer_id)
        if sale_status:
            if sale_status not in ApartmentSale.Status.values:
                raise ValidationError({"status": ["Select a valid sale status."]})
            queryset = queryset.filter(status=sale_status)
        for field, value, lookup in (
            ("date", sale_date, "sale_date"),
            ("date_from", date_from, "sale_date__gte"),
            ("date_to", date_to, "sale_date__lte"),
        ):
            if value:
                parsed = parse_date(value)
                if not parsed:
                    raise ValidationError({field: ["Enter a valid date."]})
                queryset = queryset.filter(**{lookup: parsed})

        if payment_status == ApartmentSale.PaymentStatus.UNPAID:
            queryset = queryset.filter(status=ApartmentSale.Status.ACTIVE, _paid_total=0)
        elif payment_status == ApartmentSale.PaymentStatus.PARTIALLY_PAID:
            queryset = queryset.filter(
                status=ApartmentSale.Status.ACTIVE,
                _paid_total__gt=0,
                _paid_total__lt=F("sale_price"),
            )
        elif payment_status == ApartmentSale.PaymentStatus.PAID:
            queryset = queryset.filter(
                status=ApartmentSale.Status.ACTIVE,
                _paid_total__gte=F("sale_price"),
            )
        elif payment_status == ApartmentSale.PaymentStatus.CANCELLED:
            queryset = queryset.filter(status=ApartmentSale.Status.CANCELLED)
        elif payment_status:
            raise ValidationError({"payment_status": ["Select a valid payment status."]})

        if self.request.query_params.get("outstanding", "").lower() in {"1", "true", "yes"}:
            queryset = queryset.filter(
                status=ApartmentSale.Status.ACTIVE,
                _paid_total__lt=F("sale_price"),
            )
        return queryset

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        apartment_id = serializer.validated_data["apartment"].id
        try:
            apartment = Apartment.objects.select_for_update().select_related("project").get(pk=apartment_id)
        except Apartment.DoesNotExist as exc:
            raise ValidationError({"apartment": ["The selected apartment is not available."]}) from exc

        if apartment.status != Apartment.Status.AVAILABLE or ApartmentSale.objects.filter(
            apartment=apartment,
            status=ApartmentSale.Status.ACTIVE,
        ).exists():
            raise ValidationError({"apartment": ["This apartment has already been sold."]})
        customer = serializer.validated_data["customer"]
        if customer.project_id != apartment.project_id:
            raise ValidationError({"customer": ["The customer must belong to the apartment project."]})

        sale = serializer.save(apartment=apartment, created_by=request.user)
        apartment.status = Apartment.Status.SOLD
        apartment.save(update_fields=["status", "updated_at"])
        result = self.get_queryset().get(pk=sale.pk)
        return Response(self.get_serializer(result).data, status=status.HTTP_201_CREATED)

    @transaction.atomic
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = get_object_or_404(self.get_locked_queryset(), pk=kwargs["pk"])
        self.check_object_permissions(request, instance)
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        previous_customer_id = instance.customer_id
        previous_currency = instance.currency
        sale = serializer.save()
        if sale.customer_id != previous_customer_id:
            sale.payments.update(customer=sale.customer)
        if sale.currency != previous_currency:
            sale.payments.update(currency=sale.currency)
        result = self.get_queryset().get(pk=sale.pk)
        return Response(self.get_serializer(result).data)

    @action(detail=True, methods=["post"])
    @transaction.atomic
    def cancel(self, request, pk=None):
        sale = get_object_or_404(self.get_locked_queryset(), pk=pk)
        self.check_object_permissions(request, sale)
        if sale.status == ApartmentSale.Status.CANCELLED:
            raise ValidationError({"status": ["This sale has already been cancelled."]})
        reason = str(request.data.get("reason", "")).strip()
        if not reason:
            raise ValidationError({"cancellation_reason": ["Cancellation reason is required."]})

        apartment = Apartment.objects.select_for_update().get(pk=sale.apartment_id)
        sale.status = ApartmentSale.Status.CANCELLED
        sale.cancellation_reason = reason
        sale.cancelled_at = timezone.now()
        sale.cancelled_by = request.user
        sale.save(update_fields=[
            "status", "cancellation_reason", "cancelled_at", "cancelled_by", "updated_at",
        ])
        apartment.status = Apartment.Status.AVAILABLE
        apartment.save(update_fields=["status", "updated_at"])
        result = self.get_queryset().get(pk=sale.pk)
        return Response(self.get_serializer(result).data)


class ApartmentPaymentViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = ApartmentPaymentSerializer
    permission_classes = [RBACPermission]
    rbac_resource = "apartment_payments"

    def get_queryset(self):
        queryset = ApartmentPayment.objects.select_related(
            "sale",
            "sale__apartment",
            "sale__apartment__project",
            "customer",
            "recorded_by",
        )
        queryset = _scope_to_available_projects(queryset, self.request.user, "sale__apartment__project_id")
        project_id = self.request.query_params.get("project")
        sale_id = self.request.query_params.get("sale")
        customer_id = self.request.query_params.get("customer")
        if project_id:
            queryset = queryset.filter(sale__apartment__project_id=project_id)
        if sale_id:
            queryset = queryset.filter(sale_id=sale_id)
        if customer_id:
            queryset = queryset.filter(customer_id=customer_id)
        return queryset

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        sale_id = serializer.validated_data["sale"].id
        sale_queryset = ApartmentSale.objects.select_for_update().select_related(
            "apartment__project", "customer"
        )
        sale_queryset = _scope_to_available_projects(
            sale_queryset, request.user, "apartment__project_id"
        )
        try:
            sale = sale_queryset.get(pk=sale_id)
        except ApartmentSale.DoesNotExist as exc:
            raise ValidationError({"sale": ["The selected sale is not available."]}) from exc

        customer = serializer.validated_data["customer"]
        currency = serializer.validated_data["currency"]
        amount = serializer.validated_data["amount"]
        errors = {}
        if sale.status == ApartmentSale.Status.CANCELLED:
            errors["sale"] = ["Payments cannot be recorded against a cancelled sale."]
        if customer.id != sale.customer_id:
            errors["customer"] = ["The payment customer must match the sale customer."]
        if currency != sale.currency:
            errors["currency"] = ["Payment currency must match the sale currency."]
        if amount > sale.remaining_balance:
            errors["amount"] = ["Payment amount cannot exceed the remaining balance."]
        if errors:
            raise ValidationError(errors)

        payment = serializer.save(sale=sale, customer=sale.customer, recorded_by=request.user)
        return Response(self.get_serializer(payment).data, status=status.HTTP_201_CREATED)


import os
import re
from collections import defaultdict
from decimal import Decimal
from xml.sax.saxutils import escape

from django.conf import settings
from django.http import HttpResponse
from django.db.models import Prefetch

from rest_framework.views import APIView

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    LongTable,
    TableStyle,
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

from project.models import Project
from expenses.models import Expense
from reports.branding import build_pdf_branding_elements, draw_pdf_branding_footer
from reports.pdf_utils import fit_col_widths


# Optional but strongly recommended for correct Dari/Pashto/Arabic shaping.
# pip install arabic-reshaper python-bidi
try:
    import arabic_reshaper
    from bidi.algorithm import get_display
except ImportError:
    arabic_reshaper = None
    get_display = None


# --------------------------------------------------
# FONT REGISTRATION
# --------------------------------------------------

PDF_FONT_NAME = "NotoArabic"
PDF_FONT_PATH = os.path.join(
    settings.BASE_DIR,
    "fonts",
    "NotoNaskhArabic-VariableFont_wght.ttf",
)

if PDF_FONT_NAME not in pdfmetrics.getRegisteredFontNames():
    pdfmetrics.registerFont(
        TTFont(
            PDF_FONT_NAME,
            PDF_FONT_PATH,
        )
    )


class ProjectPDFExportView(APIView):
    arabic_regex = re.compile(r"[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]")

    # --------------------------------------------------
    # HELPERS
    # --------------------------------------------------

    def get_project(self, pk):
        return get_object_or_404(
            Project.objects.prefetch_related(
                Prefetch(
                    "expenses",
                    queryset=Expense.objects.approved(),
                    to_attr="approved_expenses",
                ),
                "subcontractor_contracts__subcontractor",
                "subcontractor_contracts__variations",
                "subcontractor_contracts__payments",
                "subcontractor_contracts__invoices",
            ),
            pk=pk,
        )

    def _decimal(self, value):
        if value is None or value == "":
            return Decimal("0.00")
        return Decimal(str(value))

    def _format_date(self, value):
        if not value:
            return "-"
        return value.strftime("%Y-%m-%d")

    def _format_datetime(self, value):
        if not value:
            return "-"
        return timezone.localtime(value).strftime("%Y-%m-%d %H:%M")

    def _money(self, amount, currency=None):
        amount = self._decimal(amount)
        if currency:
            return f"{currency} {amount:,.2f}"
        return f"{amount:,.2f}"

    def _display_text(self, value):
        """
        Makes Dari/Pashto/Arabic readable in ReportLab by reshaping and applying bidi.
        If arabic_reshaper/python-bidi are not installed, it still uses the Noto font,
        but shaping may not be perfect.
        """
        if value is None or value == "":
            return "-"

        text = str(value)

        if (
            self.arabic_regex.search(text)
            and arabic_reshaper is not None
            and get_display is not None
        ):
            text = get_display(arabic_reshaper.reshape(text))

        return text

    def _p(self, value, style):
        text = self._display_text(value)
        text = escape(text).replace("\n", "<br/>")
        return Paragraph(text, style)

    def _get_styles(self):
        base = getSampleStyleSheet()

        styles = {
            "title": ParagraphStyle(
                "ProjectReportTitle",
                parent=base["Title"],
                fontName=PDF_FONT_NAME,
                fontSize=20,
                leading=26,
                alignment=TA_CENTER,
                textColor=colors.HexColor("#1F2937"),
                spaceAfter=6,
            ),
            "subtitle": ParagraphStyle(
                "ProjectReportSubtitle",
                parent=base["Heading2"],
                fontName=PDF_FONT_NAME,
                fontSize=14,
                leading=20,
                alignment=TA_CENTER,
                textColor=colors.HexColor("#374151"),
                spaceAfter=4,
            ),
            "normal_center": ParagraphStyle(
                "NormalCenter",
                parent=base["Normal"],
                fontName=PDF_FONT_NAME,
                fontSize=9,
                leading=12,
                alignment=TA_CENTER,
                textColor=colors.HexColor("#4B5563"),
                wordWrap="CJK",
                splitLongWords=True,
            ),
            "section": ParagraphStyle(
                "SectionHeading",
                parent=base["Heading3"],
                fontName=PDF_FONT_NAME,
                fontSize=12,
                leading=16,
                textColor=colors.HexColor("#111827"),
                spaceBefore=10,
                spaceAfter=6,
            ),
            "table_header": ParagraphStyle(
                "TableHeader",
                parent=base["Normal"],
                fontName=PDF_FONT_NAME,
                fontSize=8,
                leading=10,
                alignment=TA_CENTER,
                textColor=colors.white,
                wordWrap="CJK",
                splitLongWords=True,
            ),
            "label": ParagraphStyle(
                "TableLabel",
                parent=base["Normal"],
                fontName=PDF_FONT_NAME,
                fontSize=8,
                leading=10,
                alignment=TA_LEFT,
                textColor=colors.HexColor("#111827"),
                wordWrap="CJK",
                splitLongWords=True,
            ),
            "cell": ParagraphStyle(
                "TableCell",
                parent=base["Normal"],
                fontName=PDF_FONT_NAME,
                fontSize=8,
                leading=10,
                alignment=TA_LEFT,
                textColor=colors.HexColor("#111827"),
                wordWrap="CJK",
                splitLongWords=True,
            ),
            "cell_center": ParagraphStyle(
                "TableCellCenter",
                parent=base["Normal"],
                fontName=PDF_FONT_NAME,
                fontSize=8,
                leading=10,
                alignment=TA_CENTER,
                textColor=colors.HexColor("#111827"),
                wordWrap="CJK",
                splitLongWords=True,
            ),
            "cell_right": ParagraphStyle(
                "TableCellRight",
                parent=base["Normal"],
                fontName=PDF_FONT_NAME,
                fontSize=8,
                leading=10,
                alignment=TA_RIGHT,
                textColor=colors.HexColor("#111827"),
                wordWrap="CJK",
                splitLongWords=True,
            ),
            "footer": ParagraphStyle(
                "Footer",
                parent=base["Normal"],
                fontName=PDF_FONT_NAME,
                fontSize=8,
                leading=10,
                alignment=TA_CENTER,
                textColor=colors.HexColor("#6B7280"),
            ),
        }

        return styles

    def _standard_table(
        self,
        data,
        col_widths,
        repeat_rows=0,
        label_columns=None,
        zebra=True,
        long_table=False,
    ):
        label_columns = label_columns or []

        table_class = LongTable if long_table else Table

        table = table_class(
            data,
            colWidths=fit_col_widths(
                col_widths,
                getattr(self, "_doc_width", sum(col_widths)),
            ),
            repeatRows=repeat_rows,
            hAlign="LEFT",
            splitByRow=True,
        )

        style_commands = [
            ("BOX", (0, 0), (-1, -1), 0.6, colors.HexColor("#9CA3AF")),
            ("INNERGRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#D1D5DB")),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 5),
            ("RIGHTPADDING", (0, 0), (-1, -1), 5),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ]

        if repeat_rows:
            style_commands += [
                ("BACKGROUND", (0, 0), (-1, repeat_rows - 1), colors.HexColor("#1F2937")),
            ]

        for col in label_columns:
            style_commands.append(
                ("BACKGROUND", (col, 0), (col, -1), colors.HexColor("#F3F4F6"))
            )

        if zebra:
            start_row = repeat_rows if repeat_rows else 0
            for row_index in range(start_row, len(data)):
                if row_index % 2 == 1:
                    style_commands.append(
                        ("BACKGROUND", (0, row_index), (-1, row_index), colors.HexColor("#FAFAFA"))
                    )

        table.setStyle(TableStyle(style_commands))
        return table

    def _page_footer(self, canvas, doc):
        draw_pdf_branding_footer(
            canvas,
            doc,
            company=getattr(self, "_company", None),
            font_name=PDF_FONT_NAME,
        )

    def _contract_calculations(self, contract):
        """
        Calculates all contract financial values in the contract's own currency.
        This avoids mixing AFN/USD or any other currency together incorrectly.
        """
        contract_value = self._decimal(contract.contract_value)

        variation_total = Decimal("0.00")
        for variation in contract.variations.all():
            if getattr(variation, "approved", False):
                variation_total += self._decimal(getattr(variation, "amount_change", 0))

        adjusted_value = contract_value + variation_total

        paid_total = Decimal("0.00")
        for payment in contract.payments.all():
            paid_total += self._decimal(getattr(payment, "amount", 0))

        invoiced_total = Decimal("0.00")
        for invoice in contract.invoices.all():
            invoiced_total += self._decimal(getattr(invoice, "amount", 0))

        remaining = adjusted_value - paid_total

        return {
            "contract_value": contract_value,
            "variation_total": variation_total,
            "adjusted_value": adjusted_value,
            "paid_total": paid_total,
            "invoiced_total": invoiced_total,
            "remaining": remaining,
        }

    # --------------------------------------------------
    # GET PDF
    # --------------------------------------------------

    def get(self, request, pk):
        project = self.get_project(pk)
        styles = self._get_styles()

        response = HttpResponse(content_type="application/pdf")
        response["Content-Disposition"] = (
            f'attachment; filename="project_{project.id}_report.pdf"'
        )

        doc = SimpleDocTemplate(
            response,
            pagesize=landscape(A4),
            leftMargin=20,
            rightMargin=20,
            topMargin=24,
            bottomMargin=24,
        )
        self._doc_width = doc.width

        elements = []

        self._company, branding = build_pdf_branding_elements(
            title="Project Report",
            subtitle=f"{project.name} | Generated: {self._format_datetime(timezone.now())}",
            request=request,
            styles=getSampleStyleSheet(),
        )
        elements.extend(branding)

        # --------------------------------------------------
        # PROJECT INFORMATION
        # --------------------------------------------------

        elements.append(self._p("Project Information", styles["section"]))

        status_display = (
            project.get_status_display()
            if hasattr(project, "get_status_display")
            else project.status
        )
        property_type_display = (
            project.get_property_type_display()
            if hasattr(project, "get_property_type_display")
            else project.property_type
        )

        project_info_data = [
            [
                self._p("Project Name", styles["label"]),
                self._p(project.name, styles["cell"]),
                self._p("Location", styles["label"]),
                self._p(project.location, styles["cell"]),
            ],
            [
                self._p("Status", styles["label"]),
                self._p(status_display, styles["cell"]),
                self._p("Property Type", styles["label"]),
                self._p(property_type_display, styles["cell"]),
            ],
            [
                self._p("Total Floors", styles["label"]),
                self._p(project.total_floors, styles["cell"]),
                self._p("Estimated Budget", styles["label"]),
                self._p(self._money(project.estimated_budget), styles["cell_right"]),
            ],
            [
                self._p("Start Date", styles["label"]),
                self._p(self._format_date(project.start_date), styles["cell"]),
                self._p("Expected Completion", styles["label"]),
                self._p(
                    self._format_date(project.expected_completion_date),
                    styles["cell"],
                ),
            ],
            [
                self._p("Actual Completion", styles["label"]),
                self._p(self._format_date(project.actual_completion_date), styles["cell"]),
                self._p("Created At", styles["label"]),
                self._p(self._format_datetime(project.created_at), styles["cell"]),
            ],
        ]

        project_info_table = self._standard_table(
            project_info_data,
            col_widths=[
                doc.width * 0.15,
                doc.width * 0.35,
                doc.width * 0.15,
                doc.width * 0.35,
            ],
            label_columns=[0, 2],
            zebra=False,
        )

        elements.append(project_info_table)

        if project.description:
            elements.append(Spacer(1, 8))
            description_table = self._standard_table(
                [
                    [
                        self._p("Description", styles["label"]),
                        self._p(project.description, styles["cell"]),
                    ]
                ],
                col_widths=[doc.width * 0.15, doc.width * 0.85],
                label_columns=[0],
                zebra=False,
            )
            elements.append(description_table)

        if project.notes:
            elements.append(Spacer(1, 8))
            notes_table = self._standard_table(
                [
                    [
                        self._p("Notes", styles["label"]),
                        self._p(project.notes, styles["cell"]),
                    ]
                ],
                col_widths=[doc.width * 0.15, doc.width * 0.85],
                label_columns=[0],
                zebra=False,
            )
            elements.append(notes_table)

        elements.append(Spacer(1, 12))

        # --------------------------------------------------
        # EXPENSE SUMMARY
        # --------------------------------------------------

        expenses = list(getattr(project, "approved_expenses", []))

        expense_total_usd = sum(
            (self._decimal(expense.total_usd) for expense in expenses),
            Decimal("0.00"),
        )
        expense_total_afn = sum(
            (self._decimal(expense.total_afn) for expense in expenses),
            Decimal("0.00"),
        )

        elements.append(self._p("Expense Summary", styles["section"]))

        expense_summary_data = [
            [
                self._p("Metric", styles["table_header"]),
                self._p("Value", styles["table_header"]),
                self._p("Notes", styles["table_header"]),
            ],
            [
                self._p("Total Expense Records", styles["cell"]),
                self._p(len(expenses), styles["cell_right"]),
                self._p("-", styles["cell"]),
            ],
            [
                self._p("Total Expenses Equivalent", styles["cell"]),
                self._p(self._money(expense_total_usd, "USD"), styles["cell_right"]),
                self._p("Converted using each expense exchange rate", styles["cell"]),
            ],
            [
                self._p("Total Expenses Equivalent", styles["cell"]),
                self._p(self._money(expense_total_afn, "AFN"), styles["cell_right"]),
                self._p("Converted using each expense exchange rate", styles["cell"]),
            ],
        ]

        expense_summary_table = self._standard_table(
            expense_summary_data,
            col_widths=[doc.width * 0.28, doc.width * 0.22, doc.width * 0.50],
            repeat_rows=1,
        )

        elements.append(expense_summary_table)
        elements.append(Spacer(1, 12))

        # --------------------------------------------------
        # CONTRACT SUMMARY BY CURRENCY
        # --------------------------------------------------

        contracts = list(project.subcontractor_contracts.all())

        contract_summary = defaultdict(
            lambda: {
                "count": 0,
                "contract_value": Decimal("0.00"),
                "variation_total": Decimal("0.00"),
                "adjusted_value": Decimal("0.00"),
                "invoiced_total": Decimal("0.00"),
                "paid_total": Decimal("0.00"),
                "remaining": Decimal("0.00"),
            }
        )

        contract_detail_rows = [
            [
                self._p("#", styles["table_header"]),
                self._p("Contract No.", styles["table_header"]),
                self._p("Title", styles["table_header"]),
                self._p("Subcontractor", styles["table_header"]),
                self._p("Currency", styles["table_header"]),
                self._p("Adjusted Value", styles["table_header"]),
                self._p("Invoiced", styles["table_header"]),
                self._p("Paid", styles["table_header"]),
                self._p("Remaining", styles["table_header"]),
                self._p("Progress", styles["table_header"]),
                self._p("Status", styles["table_header"]),
            ]
        ]

        for index, contract in enumerate(contracts, start=1):
            currency = (contract.currency or "-").upper()
            calc = self._contract_calculations(contract)

            contract_summary[currency]["count"] += 1
            contract_summary[currency]["contract_value"] += calc["contract_value"]
            contract_summary[currency]["variation_total"] += calc["variation_total"]
            contract_summary[currency]["adjusted_value"] += calc["adjusted_value"]
            contract_summary[currency]["invoiced_total"] += calc["invoiced_total"]
            contract_summary[currency]["paid_total"] += calc["paid_total"]
            contract_summary[currency]["remaining"] += calc["remaining"]

            subcontractor_name = (
                contract.subcontractor.name
                if getattr(contract, "subcontractor", None)
                else "-"
            )

            status_display = (
                contract.get_status_display()
                if hasattr(contract, "get_status_display")
                else contract.status
            )

            contract_detail_rows.append(
                [
                    self._p(index, styles["cell_center"]),
                    self._p(contract.contract_number, styles["cell"]),
                    self._p(contract.title, styles["cell"]),
                    self._p(subcontractor_name, styles["cell"]),
                    self._p(currency, styles["cell_center"]),
                    self._p(
                        self._money(calc["adjusted_value"], currency),
                        styles["cell_right"],
                    ),
                    self._p(
                        self._money(calc["invoiced_total"], currency),
                        styles["cell_right"],
                    ),
                    self._p(
                        self._money(calc["paid_total"], currency),
                        styles["cell_right"],
                    ),
                    self._p(
                        self._money(calc["remaining"], currency),
                        styles["cell_right"],
                    ),
                    self._p(
                        f"{self._decimal(contract.completion_percentage):,.2f}%",
                        styles["cell_right"],
                    ),
                    self._p(status_display, styles["cell"]),
                ]
            )

        elements.append(self._p("Contract Summary by Currency", styles["section"]))

        contract_summary_data = [
            [
                self._p("Currency", styles["table_header"]),
                self._p("Contracts", styles["table_header"]),
                self._p("Original Value", styles["table_header"]),
                self._p("Variations", styles["table_header"]),
                self._p("Adjusted Value", styles["table_header"]),
                self._p("Invoiced", styles["table_header"]),
                self._p("Paid", styles["table_header"]),
                self._p("Remaining", styles["table_header"]),
            ]
        ]

        if contract_summary:
            for currency in sorted(contract_summary.keys()):
                values = contract_summary[currency]
                contract_summary_data.append(
                    [
                        self._p(currency, styles["cell_center"]),
                        self._p(values["count"], styles["cell_right"]),
                        self._p(
                            self._money(values["contract_value"], currency),
                            styles["cell_right"],
                        ),
                        self._p(
                            self._money(values["variation_total"], currency),
                            styles["cell_right"],
                        ),
                        self._p(
                            self._money(values["adjusted_value"], currency),
                            styles["cell_right"],
                        ),
                        self._p(
                            self._money(values["invoiced_total"], currency),
                            styles["cell_right"],
                        ),
                        self._p(
                            self._money(values["paid_total"], currency),
                            styles["cell_right"],
                        ),
                        self._p(
                            self._money(values["remaining"], currency),
                            styles["cell_right"],
                        ),
                    ]
                )
        else:
            contract_summary_data.append(
                [
                    self._p("-", styles["cell_center"]),
                    self._p("0", styles["cell_right"]),
                    self._p("0.00", styles["cell_right"]),
                    self._p("0.00", styles["cell_right"]),
                    self._p("0.00", styles["cell_right"]),
                    self._p("0.00", styles["cell_right"]),
                    self._p("0.00", styles["cell_right"]),
                    self._p("0.00", styles["cell_right"]),
                ]
            )

        contract_summary_table = self._standard_table(
            contract_summary_data,
            col_widths=[
                doc.width * 0.10,
                doc.width * 0.10,
                doc.width * 0.14,
                doc.width * 0.12,
                doc.width * 0.14,
                doc.width * 0.13,
                doc.width * 0.13,
                doc.width * 0.14,
            ],
            repeat_rows=1,
        )

        elements.append(contract_summary_table)
        elements.append(Spacer(1, 12))

        # --------------------------------------------------
        # CONTRACT DETAILS
        # --------------------------------------------------

        elements.append(self._p("Contract Details", styles["section"]))

        contract_details_table = self._standard_table(
            contract_detail_rows,
            col_widths=[
                doc.width * 0.04,
                doc.width * 0.09,
                doc.width * 0.15,
                doc.width * 0.14,
                doc.width * 0.07,
                doc.width * 0.12,
                doc.width * 0.10,
                doc.width * 0.10,
                doc.width * 0.11,
                doc.width * 0.07,
                doc.width * 0.11,
            ],
            repeat_rows=1,
            long_table=True,
        )

        elements.append(contract_details_table)
        elements.append(Spacer(1, 12))

        # --------------------------------------------------
        # FINANCIAL OVERVIEW
        # --------------------------------------------------

        # elements.append(self._p("Financial Overview", styles["section"]))

        overview_data = [
            [
                self._p("Currency", styles["table_header"]),
                self._p("Contracts Adjusted Value", styles["table_header"]),
                self._p("Expenses Equivalent", styles["table_header"]),
                self._p("Net Position", styles["table_header"]),
                self._p("Note", styles["table_header"]),
            ]
        ]

        overview_currencies = set(contract_summary.keys()) | {"USD", "AFN"}

        for currency in sorted(overview_currencies):
            contract_total = contract_summary[currency]["adjusted_value"]

            if currency == "USD":
                expense_total = expense_total_usd
                net_position = contract_total - expense_total
                note = "Expenses converted to USD using expense exchange rates"
            elif currency == "AFN":
                expense_total = expense_total_afn
                net_position = contract_total - expense_total
                note = "Expenses converted to AFN using expense exchange rates"
            else:
                expense_total = None
                net_position = None
                note = "No expense equivalent available for this currency"

            overview_data.append(
                [
                    self._p(currency, styles["cell_center"]),
                    self._p(
                        self._money(contract_total, currency),
                        styles["cell_right"],
                    ),
                    self._p(
                        self._money(expense_total, currency)
                        if expense_total is not None
                        else "-",
                        styles["cell_right"],
                    ),
                    self._p(
                        self._money(net_position, currency)
                        if net_position is not None
                        else "-",
                        styles["cell_right"],
                    ),
                    self._p(note, styles["cell"]),
                ]
            )

        overview_table = self._standard_table(
            overview_data,
            col_widths=[
                doc.width * 0.10,
                doc.width * 0.22,
                doc.width * 0.22,
                doc.width * 0.18,
                doc.width * 0.28,
            ],
            repeat_rows=1,
        )

        elements.append(overview_table)
        elements.append(Spacer(1, 8))

        budget_table = self._standard_table(
            [
                [
                    self._p("Project Estimated Budget", styles["label"]),
                    self._p(self._money(project.estimated_budget), styles["cell_right"]),
                    self._p(
                        "Budget currency is not stored on the Project model.",
                        styles["cell"],
                    ),
                ]
            ],
            col_widths=[doc.width * 0.25, doc.width * 0.25, doc.width * 0.50],
            label_columns=[0],
            zebra=False,
        )

        elements.append(budget_table)

        # --------------------------------------------------
        # BUILD PDF
        # --------------------------------------------------

        doc.build(
            elements,
            onFirstPage=self._page_footer,
            onLaterPages=self._page_footer,
        )

        return response
