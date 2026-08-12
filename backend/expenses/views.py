from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.shortcuts import get_object_or_404

from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import (
    Sum,
    F,
    Case,
    When,
    Value,
    DecimalField,
    ExpressionWrapper)

from .models import Expense, ExpenseEditRequest
from .serializers import (
    ExpenseApprovalActionSerializer,
    ExpenseApprovalSettingsSerializer,
    ExpenseEditRequestSerializer,
    ExpenseSerializer,
)
from .services import (
    apply_edit_request_filters,
    apply_approval_filters,
    approval_queue_summary,
    approval_summary,
    approve_expense,
    approve_expense_edit_request,
    create_expense,
    expense_currency_totals,
    get_expense_approval_settings,
    is_expense_approval_enabled,
    reject_expense,
    reject_expense_edit_request,
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
        "contract",
        "contract__subcontractor",
        "created_by",
        "approved_by",
        "rejected_by",
    ).annotate(
        total_usd_calc=ExpressionWrapper(
            F("amount_usd"),
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
        "approve_edit_request": ("expenses.approve",),
        "reject_edit_request": ("expenses.approve",),
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
        "contract": ["exact"],
        "expense_scope": ["exact"],
        "expense_type": ["exact"],
        "expense_date": ["gte", "lte", "exact"],
        "serial_number": ["exact"],
    }

    search_fields = [
        "serial_number",
        "description",
        "remarks",
        "paid_to",
        "project__name",
        "contract__contract_number",
        "contract__title",
        "contract__subcontractor__name",
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
        contract = self.request.query_params.get("contract")
        expense_scope = self.request.query_params.get("expense_scope")
        expense_type = self.request.query_params.get("expense_type")
        expense_exact = self.request.query_params.get("expense_date")
        expense_gte = self.request.query_params.get("expense_date__gte")
        expense_lte = self.request.query_params.get("expense_date__lte")
        serial_number = self.request.query_params.get("serial_number")

        if project:
            queryset = queryset.filter(project=project)
        if contract:
            queryset = queryset.filter(contract=contract)
        if expense_scope:
            queryset = queryset.filter(expense_scope=expense_scope)
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
    def _ensure_update_permission(self, instance):
        if has_permission(self.request.user, "expenses.update"):
            return

        if instance.created_by_id == self.request.user.id:
            return

        raise PermissionDenied(
            "You can only edit expense entries you created."
        )

    def perform_update(self, serializer):
        self._ensure_update_permission(self.get_object())
        update_expense(serializer, self.request.user, request=self.request)

    def _update_expense(self, request, *args, partial=False, **kwargs):
        instance = self.get_object()
        self._ensure_update_permission(instance)

        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        result = update_expense(serializer, request.user, request=request)

        if isinstance(result, ExpenseEditRequest):
            return Response(
                {
                    "detail": (
                        "Your changes were submitted for approval. "
                        "The approved expense will stay unchanged until an approver reviews the request."
                    ),
                    "expense": self.get_serializer(result.expense).data,
                    "edit_request": ExpenseEditRequestSerializer(result).data,
                },
                status=status.HTTP_202_ACCEPTED,
            )

        return Response(self.get_serializer(result).data)

    def update(self, request, *args, **kwargs):
        return self._update_expense(request, *args, partial=False, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        return self._update_expense(request, *args, partial=True, **kwargs)

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

    @action(
        detail=False,
        methods=["post"],
        url_path=r"edit-requests/(?P<edit_request_id>[^/.]+)/approve",
    )
    def approve_edit_request(self, request, edit_request_id=None):
        edit_request = get_object_or_404(
            ExpenseEditRequest.objects.select_related(
                "expense",
                "expense__project",
                "expense__contract",
                "requested_by",
                "reviewed_by",
            ),
            pk=edit_request_id,
        )
        edit_request = approve_expense_edit_request(
            edit_request,
            request.user,
            notes=request.data.get("approval_notes", ""),
            request=request,
        )
        return Response(ExpenseEditRequestSerializer(edit_request).data)

    @action(
        detail=False,
        methods=["post"],
        url_path=r"edit-requests/(?P<edit_request_id>[^/.]+)/reject",
    )
    def reject_edit_request(self, request, edit_request_id=None):
        serializer = ExpenseApprovalActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        edit_request = get_object_or_404(
            ExpenseEditRequest.objects.select_related(
                "expense",
                "expense__project",
                "expense__contract",
                "requested_by",
                "reviewed_by",
            ),
            pk=edit_request_id,
        )
        edit_request = reject_expense_edit_request(
            edit_request,
            request.user,
            notes=serializer.validated_data.get("approval_notes", ""),
            request=request,
        )
        return Response(ExpenseEditRequestSerializer(edit_request).data)

    @action(detail=False, methods=["get"])
    def approvals(self, request):
        queryset = self.filter_queryset(self.get_queryset())
        edit_queryset = apply_edit_request_filters(
            ExpenseEditRequest.objects.select_related(
                "expense",
                "expense__project",
                "expense__contract",
                "requested_by",
                "reviewed_by",
            ),
            request.query_params,
        )

        expense_rows = self.get_serializer(queryset, many=True).data
        for row in expense_rows:
            row["approval_item_type"] = "expense_creation"
            row["queue_id"] = f"expense:{row['id']}"
            row["expense_id"] = row["id"]

        edit_rows = ExpenseEditRequestSerializer(edit_queryset, many=True).data
        combined_rows = sorted(
            [*expense_rows, *edit_rows],
            key=lambda item: item.get("created_at") or "",
            reverse=True,
        )

        page = self.paginate_queryset(combined_rows)
        payload = {
            "results": page if page is not None else combined_rows,
            "summary": approval_queue_summary(queryset, edit_queryset),
        }
        if page is not None:
            return self.get_paginated_response(payload)
        return Response(payload)

    @action(detail=False, methods=["get"], url_path="approval-summary")
    def approval_summary(self, request):
        edit_queryset = apply_edit_request_filters(
            ExpenseEditRequest.objects.select_related("expense"),
            request.query_params,
        )
        return Response(approval_queue_summary(self.get_queryset(), edit_queryset))

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

        # -------- RAW TOTALS BY CURRENCY --------
        usd_total = financial_qs.aggregate(
            total=Sum("amount_usd")
        )["total"] or 0

        afn_total = financial_qs.aggregate(
            total=Sum("amount_afn")
        )["total"] or 0
        project_totals = financial_qs.filter(
            expense_scope=Expense.ExpenseScope.PROJECT,
        ).aggregate(
            usd=Sum("amount_usd"),
            afn=Sum("amount_afn"),
        )
        office_totals = financial_qs.filter(
            expense_scope=Expense.ExpenseScope.OFFICE,
        ).aggregate(
            usd=Sum("amount_usd"),
            afn=Sum("amount_afn"),
        )
        equivalent_totals = expense_currency_totals(financial_qs)
        project_equivalent_totals = expense_currency_totals(
            financial_qs.filter(expense_scope=Expense.ExpenseScope.PROJECT)
        )
        office_equivalent_totals = expense_currency_totals(
            financial_qs.filter(expense_scope=Expense.ExpenseScope.OFFICE)
        )
        totals_payload = {
            "usd": usd_total,
            "afn": afn_total,
            **equivalent_totals,
            "project": {
                "usd": project_totals["usd"] or 0,
                "afn": project_totals["afn"] or 0,
                **project_equivalent_totals,
            },
            "office": {
                "usd": office_totals["usd"] or 0,
                "afn": office_totals["afn"] or 0,
                **office_equivalent_totals,
            },
        }

        # -------- PAGINATION --------
        page = self.paginate_queryset(base_qs)

        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response({
                "results": serializer.data,
                "totals": totals_payload,
                "approval": approval_summary(base_qs),
            })

        serializer = self.get_serializer(base_qs, many=True)
        return Response({
            "results": serializer.data,
            "totals": totals_payload,
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
from subcontractor.models import Contract
from reports.branding import build_pdf_branding_elements, draw_pdf_branding_footer


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

        qs = Expense.objects.approved().select_related(
            "project",
            "contract",
            "contract__subcontractor",
        )

        search = self.request.GET.get("search")
        project = self.request.GET.get("project")
        contract = self.request.GET.get("contract")
        expense_scope = self.request.GET.get("expense_scope")
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

        if contract:
            qs = qs.filter(contract_id=contract)

        if expense_scope:
            qs = qs.filter(expense_scope=expense_scope)

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
            bottomMargin=30,
        )

        styles = getSampleStyleSheet()

        normal_style = ParagraphStyle(
            "NormalArabic",
            parent=styles["BodyText"],
            fontName="NotoArabic",
            fontSize=7,
            leading=10,
            wordWrap="CJK",
            splitLongWords=True,
        )

        header_style = ParagraphStyle(
            "HeaderArabic",
            parent=styles["BodyText"],
            fontName="NotoArabic",
            fontSize=7,
            leading=10,
            alignment=1,
            wordWrap="CJK",
            splitLongWords=True,
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
        contract_id = request.GET.get("contract")
        expense_scope = request.GET.get("expense_scope")
        expense_type = request.GET.get("expense_type")
        date_from = request.GET.get("expense_date__gte")
        date_to = request.GET.get("expense_date__lte")
        ordering = request.GET.get(
            "ordering",
            "-expense_date",
        )

        project_name = "All Projects"
        contract_name = "All Contracts"

        if project_id:
            project_name = (
                Project.objects.filter(id=project_id)
                .values_list("name", flat=True)
                .first()
                or "Unknown"
            )

        if contract_id:
            row = (
                Contract.objects.filter(id=contract_id)
                .values_list("contract_number", "title")
                .first()
            )
            contract_name = f"{row[0]} - {row[1]}" if row else "Unknown"

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

        company, branding = build_pdf_branding_elements(
            title="Expense Report",
            subtitle=f"Generated: {timezone.now().strftime('%Y-%m-%d %H:%M')}",
            request=request,
            styles=styles,
        )
        elements.extend(branding)

        # ------------------------------------------
        # FILTER TABLE
        # ------------------------------------------

        filter_data = [
            ["Project", project_name],
            ["Contract", contract_name],
            ["Expense Scope", expense_scope or "All"],
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
            [
                [
                    Paragraph(rtl(str(cell)), normal_style)
                    for cell in row
                ]
                for row in filter_data
            ],
            colWidths=[120, 350],
            splitByRow=True,
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
            Paragraph("Contract", header_style),
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
                    rtl(expense.project_label),
                    normal_style,
                ),
                Paragraph(
                    rtl(
                        f"{expense.contract.contract_number} - {expense.contract.title}"
                        if expense.contract_id and expense.contract
                        else ""
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
                80,   # project
                90,   # contract
                65,   # type
                90,   # paid to
                220,  # description
                55,   # usd
                60,   # afn
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

        doc.build(
            elements,
            onFirstPage=lambda canvas, document: draw_pdf_branding_footer(
                canvas,
                document,
                company=company,
                font_name="NotoArabic",
            ),
            onLaterPages=lambda canvas, document: draw_pdf_branding_footer(
                canvas,
                document,
                company=company,
                font_name="NotoArabic",
            ),
        )

        return response
