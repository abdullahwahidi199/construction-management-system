from django.shortcuts import render

# Create your views here.
from decimal import Decimal

from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Sum, Count, Prefetch

from .models import (
    Subcontractor,
    Contract,
    ContractDocument,
    ContractPayment,
    ContractVariation,
    ContractStatusChoices,
    ContractInvoiceDocument,
    ContractInvoice
)
from .serializers import (
    SubcontractorListSerializer,
    SubcontractorDetailSerializer,
    ContractListSerializer,
    ContractDetailSerializer,
    ContractWriteSerializer,
    ContractDocumentSerializer,
    ContractDocumentCreateSerializer,
    ContractPaymentSerializer,
    ContractPaymentCreateSerializer,
    ContractVariationSerializer,
    ContractVariationCreateSerializer,
    FinancialSummarySerializer,
    SubcontractorFinancialSummarySerializer,
    ContractInvoiceSerializer,
    ContractInvoiceDetailsSerializer,
    ContractInvoiceDocumentSerializer,
    ContractInvoiceDocumentCreateSerializer,
)
from .filters import (
    SubcontractorFilter,
    ContractFilter,
    ContractPaymentFilter,
    ContractVariationFilter,
)
from .permissions import IsAdminOrReadOnly
from .pagination import StandardPagination
from .services import ContractService
from accounts.permissions import RBACPermission
from reports.branding import build_pdf_branding_elements, draw_pdf_branding_footer


# ──────────────────────────────────────────────
# Subcontractor ViewSet
# ──────────────────────────────────────────────

class SubcontractorViewSet(viewsets.ModelViewSet):
    """
    CRUD + soft-delete + nested contract list + financial summary.
    """
    queryset = Subcontractor.objects.all()
    permission_classes  = [RBACPermission]
    rbac_resource       = "subcontractors"
    pagination_class    = StandardPagination
    filter_backends     = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class     = SubcontractorFilter
    search_fields       = ['name', 'contact_person', 'specialization']
    ordering_fields     = ['name', 'specialization', 'created_at']
    ordering            = ['name']

    def get_serializer_class(self):
        if self.action == 'list':
            return SubcontractorListSerializer
        return SubcontractorDetailSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        if self.action == 'list':
            # annotate contract count to avoid N+1
            qs = qs.annotate(_contract_count=Count('contracts'))
        elif self.action == 'retrieve':
            qs = qs.prefetch_related(
                Prefetch('contracts', queryset=Contract.objects.select_related('project')),
            )
        return qs

    def perform_destroy(self, instance):
        """Soft delete instead of real deletion."""
        instance.soft_delete()

    # ── custom actions ─────────────────────────

    @action(detail=True, methods=['get'])
    def contracts(self, request, pk=None):
        """List all contracts for this subcontractor."""
        subcontractor = self.get_object()
        qs = Contract.objects.filter(
            subcontractor=subcontractor,
        ).select_related('project', 'subcontractor')

        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = ContractListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = ContractListSerializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def financial_summary(self, request, pk=None):
        subcontractor = self.get_object()
        summary = ContractService.get_subcontractor_financial_summary(subcontractor)

        return Response(summary)


# ──────────────────────────────────────────────
# Contract ViewSet
# ──────────────────────────────────────────────

class ContractViewSet(viewsets.ModelViewSet):
    """
    CRUD + nested payments / variations / documents + financial summary.
    """
    queryset = Contract.objects.all()
    permission_classes  = [RBACPermission]
    rbac_resource       = "contracts"
    rbac_action_permissions = {
        "financial_summary": ("contracts.view", "contracts.view_assigned"),
        "payments": {
            "GET": ("contract_payments.view",),
            "POST": ("contract_payments.create",),
        },
        "variations": {
            "GET": ("contract_variations.view",),
            "POST": ("contract_variations.create",),
        },
        "documents": {
            "GET": ("contract_documents.view",),
            "POST": ("contract_documents.create",),
        },
    }
    pagination_class    = StandardPagination
    filter_backends     = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class     = ContractFilter
    search_fields = [
    'contract_number',
    'title',
    'scope_of_work',
    'project__name',
    'subcontractor__name',
]
    ordering_fields     = [
        'contract_value', 'start_date', 'end_date',
        'completion_percentage', 'created_at',
    ]
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return ContractListSerializer
        if self.action in ('create', 'update', 'partial_update'):
            return ContractWriteSerializer
        return ContractDetailSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        if self.action == 'list':
            qs = qs.select_related('project', 'subcontractor')
        elif self.action == 'retrieve':
            qs = qs.select_related(
                'project', 'subcontractor',
            ).prefetch_related(
                'payments', 'documents', 'variations',
            )
        else:
            qs = qs.select_related('project', 'subcontractor')
        return qs

    # ── custom actions ─────────────────────────

    @action(detail=True, methods=['get'])
    def financial_summary(self, request, pk=None):
        contract = self.get_object()
        summary = ContractService.get_financial_summary(contract)
        serializer = FinancialSummarySerializer(summary)
        return Response(serializer.data)

    @action(detail=True, methods=['get', 'post'])
    def payments(self, request, pk=None):
        contract = self.get_object()

        if request.method == 'GET':
            qs = contract.payments.all()
            page = self.paginate_queryset(qs)
            if page is not None:
                serializer = ContractPaymentSerializer(page, many=True)
                return self.get_paginated_response(serializer.data)
            return Response(ContractPaymentSerializer(qs, many=True).data)

        # POST — create payment via service (transaction-safe)
        serializer = ContractPaymentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            payment = ContractService.create_payment(
                contract=contract,
                validated_data=serializer.validated_data,
            )
        except ValueError as exc:
            return Response(
                {'detail': str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        output = ContractPaymentSerializer(payment)
        return Response(output.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get', 'post'])
    def variations(self, request, pk=None):
        contract = self.get_object()

        if request.method == 'GET':
            qs = contract.variations.all()
            page = self.paginate_queryset(qs)
            if page is not None:
                serializer = ContractVariationSerializer(page, many=True)
                return self.get_paginated_response(serializer.data)
            return Response(ContractVariationSerializer(qs, many=True).data)

        # POST
        serializer = ContractVariationCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        variation = ContractVariation.objects.create(
            contract=contract, **serializer.validated_data,
        )
        output = ContractVariationSerializer(variation)
        return Response(output.data, status=status.HTTP_201_CREATED)

    @action(
        detail=True, methods=['get', 'post'],
        parser_classes=[MultiPartParser, FormParser, JSONParser],
    )
    def documents(self, request, pk=None):
        contract = self.get_object()

        if request.method == 'GET':
            qs = contract.documents.all()
            page = self.paginate_queryset(qs)
            if page is not None:
                serializer = ContractDocumentSerializer(page, many=True)
                return self.get_paginated_response(serializer.data)
            return Response(ContractDocumentSerializer(qs, many=True).data)

        # POST
        serializer = ContractDocumentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        document = ContractDocument.objects.create(
            contract=contract, **serializer.validated_data,
        )
        output = ContractDocumentSerializer(document)
        return Response(output.data, status=status.HTTP_201_CREATED)


# ──────────────────────────────────────────────
# Standalone Resource ViewSets
# ──────────────────────────────────────────────

class ContractDocumentViewSet(viewsets.ModelViewSet):
    queryset = ContractDocument.objects.select_related('contract')
    permission_classes  = [RBACPermission]
    rbac_resource       = "contract_documents"
    pagination_class    = StandardPagination
    filter_backends     = [DjangoFilterBackend, filters.OrderingFilter]
    ordering_fields     = ['uploaded_at', 'title']
    ordering            = ['-uploaded_at']
    parser_classes      = [MultiPartParser, FormParser, JSONParser]

    def get_serializer_class(self):
        if self.action in ('create', 'update', 'partial_update'):
            return ContractDocumentSerializer
        return ContractDocumentSerializer


class ContractPaymentViewSet(viewsets.ModelViewSet):
    queryset = ContractPayment.objects.select_related('contract')
    permission_classes  = [RBACPermission]
    rbac_resource       = "contract_payments"
    pagination_class    = StandardPagination
    filter_backends     = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_class     = ContractPaymentFilter
    ordering_fields     = ['payment_date', 'amount', 'created_at']
    ordering            = ['-payment_date']

    def get_serializer_class(self):
        if self.action in ('create', 'update', 'partial_update'):
            return ContractPaymentSerializer
        return ContractPaymentSerializer

    def destroy(self, request, *args, **kwargs):
        """Payments are permanent audit records — disallow deletion."""
        return Response(
            {'detail': 'Payments cannot be deleted. They are permanent records.'},
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )


class ContractVariationViewSet(viewsets.ModelViewSet):
    queryset = ContractVariation.objects.select_related('contract')
    permission_classes  = [RBACPermission]
    rbac_resource       = "contract_variations"
    pagination_class    = StandardPagination
    filter_backends     = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_class     = ContractVariationFilter
    ordering_fields     = ['date', 'amount_change', 'created_at']
    ordering            = ['-date']

    def get_serializer_class(self):
        if self.action in ('create', 'update', 'partial_update'):
            return ContractVariationSerializer
        return ContractVariationSerializer

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a variation with financial-impact validation."""
        variation = self.get_object()
        try:
            ContractService.approve_variation(variation)
        except ValueError as exc:
            return Response(
                {'detail': str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = ContractVariationSerializer(variation)
        return Response(serializer.data)
    

class ContractInvoiceViewSet(viewsets.ModelViewSet):
    serializer_class = ContractInvoiceSerializer
    permission_classes = [RBACPermission]
    rbac_resource = "contract_invoices"

    queryset = (
        ContractInvoice.objects
        .select_related(
            "contract",
            "contract__project",
            "contract__subcontractor",
        )
        .prefetch_related("documents")
    )

    filterset_fields = [
        "contract",
        "status",
    ]

    search_fields = [
        "invoice_number",
        "contract__contract_number",
        "contract__title",
        "contract__subcontractor__name",
    ]

    ordering_fields = [
        "invoice_date",
        "amount",
        "created_at",
    ]

    def get_serializer_class(self):
        if self.action == "retrieve":
            return ContractInvoiceDetailsSerializer

        return ContractInvoiceSerializer

    def get_queryset(self):
        queryset = super().get_queryset()

        contract_id = self.request.query_params.get("contract")

        if contract_id:
            queryset = queryset.filter(
                contract_id=contract_id
            )

        return queryset
class ContractInvoiceDocumentViewSet(viewsets.ModelViewSet):
    queryset = (
        ContractInvoiceDocument.objects
        .select_related(
            "invoice",
            "invoice__contract",
        )
    )

    permission_classes = [RBACPermission]
    rbac_resource = "invoice_documents"

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return ContractInvoiceDocumentCreateSerializer

        return ContractInvoiceDocumentSerializer


from django.http import HttpResponse
from django.utils import timezone
from rest_framework.views import APIView

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
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

from subcontractor.models import Contract
from project.models import Project
from subcontractor.models import Subcontractor


# ---------------------------------------------------
# FONT REGISTRATION (DARI / PASHTO FIX)
# ---------------------------------------------------
pdfmetrics.registerFont(
    TTFont(
        "NotoArabic",
        "fonts/NotoNaskhArabic-VariableFont_wght.ttf",
    )
)


# ---------------------------------------------------
# RTL HELPER
# ---------------------------------------------------
def rtl(text):
    if not text:
        return ""
    return get_display(arabic_reshaper.reshape(str(text)))


class ContractPDFExportView(APIView):

    def get_queryset(self):
        qs = Contract.objects.select_related(
            "project",
            "subcontractor",
        )

        search = self.request.GET.get("search")
        status = self.request.GET.get("status")
        project = self.request.GET.get("project")
        subcontractor = self.request.GET.get("subcontractor")

        if search:
            qs = qs.filter(
                contract_number__icontains=search
            ) | qs.filter(
                title__icontains=search
            ) | qs.filter(
                scope_of_work__icontains=search
            )

        if status:
            qs = qs.filter(status=status)

        if project:
            qs = qs.filter(project_id=project)

        if subcontractor:
            qs = qs.filter(subcontractor_id=subcontractor)

        return qs.order_by("-created_at")

    def get_currency_symbol(self, currency):
        return {
            "AFN": "؋",
            "USD": "$",
            "EUR": "€",
        }.get(currency, currency)

    def get(self, request):

        response = HttpResponse(content_type="application/pdf")
        response["Content-Disposition"] = 'attachment; filename="contracts_report.pdf"'

        doc = SimpleDocTemplate(
            response,
            pagesize=landscape(A4),
            leftMargin=15,
            rightMargin=15,
            topMargin=15,
            bottomMargin=30,
        )

        styles = getSampleStyleSheet()

        title_style = ParagraphStyle(
            "title",
            parent=styles["Title"],
            fontName="NotoArabic",
            fontSize=14,
        )

        normal = ParagraphStyle(
            "normal",
            parent=styles["BodyText"],
            fontName="NotoArabic",
            fontSize=7,
            leading=10,
        )

        qs = self.get_queryset()

        elements = []

        company, branding = build_pdf_branding_elements(
            title="Contracts Report",
            subtitle=f"Generated: {timezone.now().strftime('%Y-%m-%d %H:%M')}",
            request=request,
            styles=styles,
        )
        elements.extend(branding)

        # ---------------------------------------------------
        # RESOLVE FILTER VALUES
        # ---------------------------------------------------
        search = request.GET.get("search", "None")
        status = request.GET.get("status", "All")
        project_id = request.GET.get("project")
        subcontractor_id = request.GET.get("subcontractor")

        project_name = "All"
        subcontractor_name = "All"

        if project_id:
            project_name = (
                Project.objects.filter(id=project_id)
                .values_list("name", flat=True)
                .first()
                or "Unknown"
            )

        if subcontractor_id:
            subcontractor_name = (
                Subcontractor.objects.filter(id=subcontractor_id)
                .values_list("name", flat=True)
                .first()
                or "Unknown"
            )

        # ---------------------------------------------------
        # FILTER TABLE (FULL FIX)
        # ---------------------------------------------------
        filter_table = Table(
            [
                ["Search", search],
                ["Status", status],
                ["Project", project_name],
                ["Subcontractor", subcontractor_name],
                ["Ordering", request.GET.get("ordering", "-created_at")],
                ["Total Results", str(qs.count())],
            ],
            colWidths=[140, 300],
        )

        filter_table.setStyle(
            TableStyle([
                ("GRID", (0, 0), (-1, -1), 0.5, colors.black),
                ("BACKGROUND", (0, 0), (0, -1), colors.lightgrey),
                ("FONTNAME", (0, 0), (-1, -1), "NotoArabic"),
                ("FONTSIZE", (0, 0), (-1, -1), 8),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ])
        )

        elements.append(filter_table)
        elements.append(Spacer(1, 12))

        # ---------------------------------------------------
        # TABLE HEADER
        # ---------------------------------------------------
        data = [[
            "Contract #",
            "Title",
            "Project",
            "Subcontractor",
            "Status",
            "Currency",
            "Value",
            "Paid",
            "Remaining",
            "%",
        ]]

        totals = {}

        # ---------------------------------------------------
        # ROWS
        # ---------------------------------------------------
        for c in qs:

            currency = c.currency
            symbol = self.get_currency_symbol(currency)

            value = float(c.contract_value or 0)
            paid = float(c.total_paid or 0)
            remaining = float(c.remaining_amount or 0)

            totals.setdefault(currency, {"v": 0, "p": 0, "r": 0})

            totals[currency]["v"] += value
            totals[currency]["p"] += paid
            totals[currency]["r"] += remaining

            data.append([
                c.contract_number,
                rtl(c.title),
                rtl(getattr(c.project, "name", "")),
                rtl(getattr(c.subcontractor, "name", "")),
                rtl(c.status),
                currency,
                f"{symbol}{value:,.2f}",
                f"{symbol}{paid:,.2f}",
                f"{symbol}{remaining:,.2f}",
                f"{c.completion_percentage}%",
            ])

        # ---------------------------------------------------
        # TOTALS SECTION
        # ---------------------------------------------------
        data.append([""] * 10)

        for cur, t in totals.items():
            symbol = self.get_currency_symbol(cur)

            data.append([
                "",
                "",
                "",
                "",
                rtl(f"TOTAL ({cur})"),
                "",
                f"{symbol}{t['v']:,.2f}",
                f"{symbol}{t['p']:,.2f}",
                f"{symbol}{t['r']:,.2f}",
                "",
            ])

        # ---------------------------------------------------
        # TABLE STYLE
        # ---------------------------------------------------
        table = Table(
            data,
            repeatRows=1,
            colWidths=[70, 120, 90, 110, 60, 60, 80, 80, 80, 40],
        )

        table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#111827")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("GRID", (0, 0), (-1, -1), 0.4, colors.black),
            ("FONTSIZE", (0, 0), (-1, -1), 7),
            ("FONTNAME", (0, 0), (-1, -1), "NotoArabic"),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("BACKGROUND", (0, -1), (-1, -1), colors.lightgrey),
        ]))

        elements.append(table)

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
    

from django.http import HttpResponse
from django.utils import timezone
from rest_framework.views import APIView

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
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


# ---------------- FONT ----------------
pdfmetrics.registerFont(
    TTFont(
        "NotoArabic",
        "fonts/NotoNaskhArabic-VariableFont_wght.ttf",
    )
)


# ---------------- RTL ----------------
def rtl(text):
    if not text:
        return ""
    return get_display(arabic_reshaper.reshape(str(text)))


class ContractDetailPDFView(APIView):

    def get_object(self, pk):
        return Contract.objects.select_related(
            "project",
            "subcontractor"
        ).get(pk=pk)

    def get_currency(self, c):
        return {
            "AFN": "؋",
            "USD": "$",
            "EUR": "€",
        }.get(c, c)

    def get(self, request, pk):

        contract = self.get_object(pk)

        response = HttpResponse(content_type="application/pdf")
        response["Content-Disposition"] = (
            f'attachment; filename="contract_{contract.contract_number}.pdf"'
        )

        doc = SimpleDocTemplate(
            response,
            pagesize=A4,
            leftMargin=20,
            rightMargin=20,
            topMargin=20,
            bottomMargin=32,
        )

        styles = getSampleStyleSheet()

        title_style = ParagraphStyle(
            "title",
            parent=styles["Title"],
            fontName="NotoArabic",
            fontSize=14,
        )

        normal = ParagraphStyle(
            "normal",
            parent=styles["BodyText"],
            fontName="NotoArabic",
            fontSize=9,
            leading=12,
        )

        elements = []

        currency_symbol = self.get_currency(contract.currency)

        company, branding = build_pdf_branding_elements(
            title="Contract Detail Report",
            subtitle=f"Generated: {timezone.now().strftime('%Y-%m-%d %H:%M')}",
            request=request,
            styles=styles,
        )
        elements.extend(branding)

        # ---------------------------------------------------
        # BASIC INFO
        # ---------------------------------------------------
        info_table = Table([
            [rtl("Contract No"), contract.contract_number],
            [rtl("Title"), rtl(contract.title)],
            [rtl("Status"), rtl(contract.status)],
            [rtl("Project"), rtl(contract.project.name)],
            [rtl("Subcontractor"), rtl(contract.subcontractor.name)],
            [rtl("Start Date"), str(contract.start_date)],
            [rtl("End Date"), str(contract.end_date)],
            [rtl("Adjusted End"), str(contract.adjusted_end_date)],
        ], colWidths=[140, 340])

        info_table.setStyle(TableStyle([
            ("GRID", (0, 0), (-1, -1), 0.5, colors.black),
            ("BACKGROUND", (0, 0), (0, -1), colors.lightgrey),
            ("FONTNAME", (0, 0), (-1, -1), "NotoArabic"),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
        ]))

        elements.append(info_table)
        elements.append(Spacer(1, 12))

        # ---------------------------------------------------
        # FINANCIAL SUMMARY
        # ---------------------------------------------------
        financial_table = Table([
            [rtl("Contract Value"), f"{currency_symbol}{contract.contract_value:,.2f}"],
            [rtl("Variation"), f"{currency_symbol}{contract.total_variation_amount:,.2f}"],
            [rtl("Adjusted Value"), f"{currency_symbol}{contract.adjusted_contract_value:,.2f}"],
            [rtl("Total Invoiced"), f"{currency_symbol}{contract.total_invoiced:,.2f}"],
            [rtl("Total Paid"), f"{currency_symbol}{contract.total_paid:,.2f}"],
            [rtl("Remaining"), f"{currency_symbol}{contract.remaining_amount:,.2f}"],
            [rtl("Retention"), f"{currency_symbol}{contract.retention_amount:,.2f}"],
            [rtl("Retention Balance"), f"{currency_symbol}{contract.retention_balance:,.2f}"],
        ], colWidths=[200, 280])

        financial_table.setStyle(TableStyle([
            ("GRID", (0, 0), (-1, -1), 0.5, colors.black),
            ("BACKGROUND", (0, 0), (0, -1), colors.lightgrey),
            ("FONTNAME", (0, 0), (-1, -1), "NotoArabic"),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
        ]))

        elements.append(financial_table)
        elements.append(Spacer(1, 12))

        # ---------------------------------------------------
        # SCOPE OF WORK
        # ---------------------------------------------------
        elements.append(Paragraph(rtl("Scope of Work"), title_style))
        elements.append(Paragraph(rtl(contract.scope_of_work), normal))
        elements.append(Spacer(1, 10))

        # ---------------------------------------------------
        # NOTES
        # ---------------------------------------------------
        if contract.notes:
            elements.append(Paragraph(rtl("Notes"), title_style))
            elements.append(Paragraph(rtl(contract.notes), normal))
            elements.append(Spacer(1, 10))

        # ---------------------------------------------------
        # PAYMENTS (simple)
        # ---------------------------------------------------
        payments_data = [[
            rtl("Date"),
            rtl("Type"),
            rtl("Amount"),
            rtl("Reference"),
        ]]

        for p in contract.payments.all().order_by("-payment_date"):
            payments_data.append([
                str(p.payment_date),
                rtl(p.payment_type),
                f"{currency_symbol}{p.amount:,.2f}",
                p.reference_number,
            ])

        payments_table = Table(
            payments_data,
            repeatRows=1,
            colWidths=[100, 120, 120, 200],
        )

        payments_table.setStyle(TableStyle([
            ("GRID", (0, 0), (-1, -1), 0.5, colors.black),
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#111827")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, -1), "NotoArabic"),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
        ]))

        elements.append(Paragraph(rtl("Payments"), title_style))
        elements.append(payments_table)

        # ---------------------------------------------------
        # BUILD PDF
        # ---------------------------------------------------
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
