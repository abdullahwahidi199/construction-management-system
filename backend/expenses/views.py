from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination

from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import (
    Sum,
    F,
    Case,
    When,
    Value,
    DecimalField,
    ExpressionWrapper)

from .models import Expense
from .serializers import (
    ExpenseApprovalActionSerializer,
    ExpenseApprovalSettingsSerializer,
    ExpenseSerializer,
)
from .services import (
    apply_approval_filters,
    approval_summary,
    approve_expense,
    create_expense,
    get_expense_approval_settings,
    is_expense_approval_enabled,
    reject_expense,
    set_expense_approval_settings,
    update_expense,
)

from accounts.permissions import RBACPermission
from accounts.services import has_permission
from common.calendar_utils import get_module_calendar, parse_calendar_date


# =========================
# Pagination
# =========================
class ExpensePagination(PageNumberPagination):
    page_size = 25
    page_size_query_param = 'page_size'
    max_page_size = 100
    page_query_param = 'page'


# =========================
# ViewSet
# =========================
class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.select_related(
        "project",
        "created_by",
        "approved_by",
        "rejected_by",
    ).annotate(
        total_usd_calc=ExpressionWrapper(
            F("amount_usd") + (F("amount_afn") / F("exchange_rate")),
            output_field=DecimalField(max_digits=20, decimal_places=2),
        )
    )

    serializer_class = ExpenseSerializer
    permission_classes = [RBACPermission]
    rbac_resource = "expenses"
    rbac_action_permissions = {
        "retrieve": ("expenses.view", "expenses.approve"),
        "approve": ("expenses.approve",),
        "reject": ("expenses.approve",),
        "approvals": ("expenses.approve",),
        "approval_summary": ("expenses.view", "expenses.approve"),
        "approval_settings": ("settings.view", "settings.manage"),
        "save_approval_settings": ("settings.manage",),
    }

    filter_backends = [
        filters.SearchFilter,
        filters.OrderingFilter
    ]

    filterset_fields = {
        "project": ["exact"],
        "expense_type": ["exact"],
        "expense_date": ["gte", "lte", "exact"],
        "serial_number": ["exact"],
    }

    search_fields = [
        "serial_number",
        "description",
        "remarks",
        "paid_to",
    ]

    ordering_fields = [
        "expense_date",
        "serial_number",
        "total_usd_calc",
    ]

    ordering = ["-expense_date"]  # correct DRF ordering field

    pagination_class = ExpensePagination

    # =========================
    # BASE QUERYSET (RBAC)
    # =========================
    def get_queryset(self):
        queryset = super().get_queryset()
        calendar_type = get_module_calendar("expenses", request=self.request)
        project = self.request.query_params.get("project")
        expense_type = self.request.query_params.get("expense_type")
        expense_exact = self.request.query_params.get("expense_date")
        expense_gte = self.request.query_params.get("expense_date__gte")
        expense_lte = self.request.query_params.get("expense_date__lte")
        serial_number = self.request.query_params.get("serial_number")

        if project:
            queryset = queryset.filter(project=project)
        if expense_type:
            queryset = queryset.filter(expense_type=expense_type)
        if serial_number:
            queryset = queryset.filter(serial_number=serial_number)
        if expense_exact:
            queryset = queryset.filter(expense_date=parse_calendar_date(expense_exact, calendar_type))
        if expense_gte:
            queryset = queryset.filter(expense_date__gte=parse_calendar_date(expense_gte, calendar_type))
        if expense_lte:
            queryset = queryset.filter(expense_date__lte=parse_calendar_date(expense_lte, calendar_type))

        return apply_approval_filters(queryset, self.request.query_params)

    # =========================
    # CREATE
    # =========================
    def perform_create(self, serializer):
        create_expense(serializer, self.request.user, request=self.request)

    # =========================
    # UPDATE
    # =========================
    def perform_update(self, serializer):
        if not has_permission(self.request.user, "expenses.update"):
            instance = self.get_object()

            if instance.created_by_id != self.request.user.id:
                raise PermissionDenied(
                    "You can only update your own expense entries."
                )

        update_expense(serializer, self.request.user, request=self.request)

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        expense = approve_expense(
            self.get_object(),
            request.user,
            notes=request.data.get("approval_notes", ""),
            request=request,
        )
        return Response(self.get_serializer(expense).data)

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        serializer = ExpenseApprovalActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        expense = reject_expense(
            self.get_object(),
            request.user,
            notes=serializer.validated_data.get("approval_notes", ""),
            request=request,
        )
        return Response(self.get_serializer(expense).data)

    @action(detail=False, methods=["get"])
    def approvals(self, request):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        serializer = self.get_serializer(page or queryset, many=True)
        payload = {
            "results": serializer.data,
            "summary": approval_summary(self.get_queryset()),
        }
        if page is not None:
            return self.get_paginated_response(payload)
        return Response(payload)

    @action(detail=False, methods=["get"], url_path="approval-summary")
    def approval_summary(self, request):
        return Response(approval_summary(self.get_queryset()))

    @action(detail=False, methods=["get"], url_path="approval-settings")
    def approval_settings(self, request):
        return Response(ExpenseApprovalSettingsSerializer(get_expense_approval_settings()).data)

    @approval_settings.mapping.put
    def save_approval_settings(self, request):
        serializer = ExpenseApprovalSettingsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        settings_data = set_expense_approval_settings(
            serializer.validated_data["enabled"],
            user=request.user,
        )
        return Response(ExpenseApprovalSettingsSerializer(settings_data).data)

    # =========================
    # LIST with TOTALS
    # =========================
    def list(self, request, *args, **kwargs):
        base_qs = self.filter_queryset(self.get_queryset())
        financial_qs = base_qs.filter(approval_status=Expense.ApprovalStatus.APPROVED)

        # -------- USD TOTAL (converted unified model) --------
        usd_total = financial_qs.aggregate(
        total=Sum(
            ExpressionWrapper(
                F("amount_usd")
                + Case(
                    When(
                        amount_afn__gt=0,
                        exchange_rate__gt=0,
                        then=F("amount_afn") / F("exchange_rate"),
                    ),
                    default=Value(0),
                    output_field=DecimalField(max_digits=20, decimal_places=6),
                ),
                output_field=DecimalField(max_digits=20, decimal_places=6),
            )
        )
    )["total"] or 0

        # -------- AFN TOTAL (converted unified model) --------
        afn_total = financial_qs.aggregate(
            total=Sum(
                ExpressionWrapper(
                    F("amount_afn") + (F("amount_usd") * F("exchange_rate")),
                    output_field=DecimalField(max_digits=20, decimal_places=2),
                )
            )
        )["total"] or 0

        # -------- PAGINATION --------
        page = self.paginate_queryset(base_qs)

        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response({
                "results": serializer.data,
                "totals": {
                    "usd": usd_total,
                    "afn": afn_total,
                },
                "approval": approval_summary(base_qs),
            })

        serializer = self.get_serializer(base_qs, many=True)
        return Response({
            "results": serializer.data,
            "totals": {
                "usd": usd_total,
                "afn": afn_total,
            },
            "approval": approval_summary(base_qs),
        })


from django.http import HttpResponse
from django.utils import timezone
from rest_framework.views import APIView

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import (
    getSampleStyleSheet,
    ParagraphStyle,
)
from reportlab.platypus import (
    SimpleDocTemplate,
    Table,
    TableStyle,
    Paragraph,
    Spacer,
)

from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

import arabic_reshaper
from bidi.algorithm import get_display

from expenses.models import Expense
from project.models import Project


# ----------------------------------------------------
# REGISTER ARABIC / DARI / PASHTO FONT
# ----------------------------------------------------

pdfmetrics.registerFont(
    TTFont(
        "NotoArabic",
        "fonts/NotoNaskhArabic-VariableFont_wght.ttf",
    )
)


def rtl(text):
    """
    Properly render Dari/Pashto/Arabic text.
    """
    if not text:
        return ""

    text = str(text)

    reshaped = arabic_reshaper.reshape(text)
    return get_display(reshaped)


class ExpensePDFExportView(APIView):
    permission_classes = [RBACPermission]
    rbac_resource = "expenses"

    def get_queryset(self):
        status_filter = self.request.GET.get("status") or self.request.GET.get("approval_status")
        if status_filter and status_filter != Expense.ApprovalStatus.APPROVED:
            raise PermissionDenied("Only approved expenses can be exported.")

        qs = Expense.objects.approved().select_related("project")

        search = self.request.GET.get("search")
        project = self.request.GET.get("project")
        expense_type = self.request.GET.get("expense_type")
        date_from = self.request.GET.get("expense_date__gte")
        date_to = self.request.GET.get("expense_date__lte")
        creator = self.request.GET.get("creator") or self.request.GET.get("created_by")
        approver = self.request.GET.get("approver") or self.request.GET.get("approved_by")
        ordering = self.request.GET.get(
            "ordering",
            "-expense_date",
        )

        if search:
            qs = qs.filter(
                description__icontains=search
            )

        if project:
            qs = qs.filter(project_id=project)

        if expense_type:
            qs = qs.filter(
                expense_type=expense_type
            )

        if creator:
            qs = qs.filter(created_by_id=creator)

        if approver:
            qs = qs.filter(approved_by_id=approver)

        if date_from:
            date_from = parse_calendar_date(date_from, get_module_calendar("expenses", request=self.request))
            qs = qs.filter(
                expense_date__gte=date_from
            )

        if date_to:
            date_to = parse_calendar_date(date_to, get_module_calendar("expenses", request=self.request))
            qs = qs.filter(
                expense_date__lte=date_to
            )

        return qs.order_by(ordering)

    def get(self, request):

        response = HttpResponse(
            content_type="application/pdf"
        )

        response[
            "Content-Disposition"
        ] = (
            'attachment; filename="expenses_report.pdf"'
        )

        doc = SimpleDocTemplate(
            response,
            pagesize=landscape(A4),
            leftMargin=15,
            rightMargin=15,
            topMargin=15,
            bottomMargin=15,
        )

        styles = getSampleStyleSheet()

        normal_style = ParagraphStyle(
            "NormalArabic",
            parent=styles["BodyText"],
            fontName="NotoArabic",
            fontSize=7,
            leading=10,
        )

        header_style = ParagraphStyle(
            "HeaderArabic",
            parent=styles["BodyText"],
            fontName="NotoArabic",
            fontSize=7,
            leading=10,
            alignment=1,
        )

        title_style = ParagraphStyle(
            "TitleArabic",
            parent=styles["Title"],
            fontName="NotoArabic",
        )

        elements = []

        expenses = self.get_queryset()

        # ------------------------------------------
        # FILTERS
        # ------------------------------------------

        search = request.GET.get("search")
        project_id = request.GET.get("project")
        expense_type = request.GET.get("expense_type")
        date_from = request.GET.get("expense_date__gte")
        date_to = request.GET.get("expense_date__lte")
        ordering = request.GET.get(
            "ordering",
            "-expense_date",
        )

        project_name = "All Projects"

        if project_id:
            project_name = (
                Project.objects.filter(id=project_id)
                .values_list("name", flat=True)
                .first()
                or "Unknown"
            )

        ordering_labels = {
            "-expense_date": "Date (Newest First)",
            "expense_date": "Date (Oldest First)",
            "-serial_number": "Serial # (High → Low)",
            "serial_number": "Serial # (Low → High)",
            "-total_usd_calc": "Amount (High → Low)",
            "total_usd_calc": "Amount (Low → High)",
        }

        # ------------------------------------------
        # TOTALS
        # ------------------------------------------

        total_usd = sum(
            float(e.total_usd or 0)
            for e in expenses
        )

        total_afn = sum(
            float(e.total_afn or 0)
            for e in expenses
        )

        # ------------------------------------------
        # HEADER
        # ------------------------------------------

        elements.append(
            Paragraph(
                "Expense Report",
                title_style,
            )
        )

        elements.append(
            Paragraph(
                f"Generated: {timezone.now().strftime('%Y-%m-%d %H:%M')}",
                normal_style,
            )
        )

        elements.append(Spacer(1, 10))

        # ------------------------------------------
        # FILTER TABLE
        # ------------------------------------------

        filter_data = [
            ["Project", project_name],
            ["Expense Type", expense_type or "All"],
            ["Search", search or "None"],
            ["Date From", date_from or "Any"],
            ["Date To", date_to or "Any"],
            [
                "Ordering",
                ordering_labels.get(
                    ordering,
                    ordering,
                ),
            ],
            ["Total Records", str(expenses.count())],
            ["Total USD", f"${total_usd:,.2f}"],
            ["Total AFN", f"؋{total_afn:,.2f}"],
        ]

        filter_table = Table(
            filter_data,
            colWidths=[120, 350],
        )

        filter_table.setStyle(
            TableStyle(
                [
                    (
                        "BACKGROUND",
                        (0, 0),
                        (0, -1),
                        colors.lightgrey,
                    ),
                    (
                        "FONTNAME",
                        (0, 0),
                        (-1, -1),
                        "NotoArabic",
                    ),
                    (
                        "GRID",
                        (0, 0),
                        (-1, -1),
                        0.5,
                        colors.black,
                    ),
                ]
            )
        )

        elements.append(filter_table)
        elements.append(Spacer(1, 12))

        # ------------------------------------------
        # EXPENSE TABLE
        # ------------------------------------------

        data = [[
            Paragraph("Serial #", header_style),
            Paragraph("Date", header_style),
            Paragraph("Project", header_style),
            Paragraph("Type", header_style),
            Paragraph("Paid To", header_style),
            Paragraph("Description", header_style),
            Paragraph("USD", header_style),
            Paragraph("AFN", header_style),
        ]]

        for expense in expenses:

            data.append([
                Paragraph(
                    str(expense.serial_number),
                    normal_style,
                ),
                Paragraph(
                    expense.expense_date.strftime(
                        "%Y-%m-%d"
                    ),
                    normal_style,
                ),
                Paragraph(
                    rtl(
                        getattr(
                            expense.project,
                            "name",
                            "",
                        )
                    ),
                    normal_style,
                ),
                Paragraph(
                    rtl(
                        expense.expense_type or ""
                    ),
                    normal_style,
                ),
                Paragraph(
                    rtl(
                        expense.paid_to or ""
                    ),
                    normal_style,
                ),
                Paragraph(
                    rtl(
                        expense.description or ""
                    ),
                    normal_style,
                ),
                Paragraph(
                    f"{float(expense.total_usd or 0):,.2f}",
                    normal_style,
                ),
                Paragraph(
                    f"{float(expense.total_afn or 0):,.2f}",
                    normal_style,
                ),
            ])

        data.append([
            "",
            "",
            "",
            "",
            "",
            Paragraph(
                "TOTAL",
                normal_style,
            ),
            Paragraph(
                f"{total_usd:,.2f}",
                normal_style,
            ),
            Paragraph(
                f"{total_afn:,.2f}",
                normal_style,
            ),
        ])

        expense_table = Table(
            data,
            repeatRows=1,
            colWidths=[
                45,   # serial
                60,   # date
                90,   # project
                70,   # type
                100,  # paid to
                280,  # description
                60,   # usd
                70,   # afn
            ],
        )

        expense_table.setStyle(
            TableStyle(
                [
                    (
                        "BACKGROUND",
                        (0, 0),
                        (-1, 0),
                        colors.HexColor("#2563EB"),
                    ),
                    (
                        "TEXTCOLOR",
                        (0, 0),
                        (-1, 0),
                        colors.white,
                    ),
                    (
                        "FONTNAME",
                        (0, 0),
                        (-1, -1),
                        "NotoArabic",
                    ),
                    (
                        "FONTSIZE",
                        (0, 0),
                        (-1, -1),
                        7,
                    ),
                    (
                        "GRID",
                        (0, 0),
                        (-1, -1),
                        0.5,
                        colors.black,
                    ),
                    (
                        "VALIGN",
                        (0, 0),
                        (-1, -1),
                        "TOP",
                    ),
                    (
                        "LEFTPADDING",
                        (0, 0),
                        (-1, -1),
                        3,
                    ),
                    (
                        "RIGHTPADDING",
                        (0, 0),
                        (-1, -1),
                        3,
                    ),
                    (
                        "TOPPADDING",
                        (0, 0),
                        (-1, -1),
                        3,
                    ),
                    (
                        "BOTTOMPADDING",
                        (0, 0),
                        (-1, -1),
                        3,
                    ),
                    (
                        "BACKGROUND",
                        (0, -1),
                        (-1, -1),
                        colors.lightgrey,
                    ),
                ]
            )
        )

        elements.append(expense_table)

        doc.build(elements)

        return response
