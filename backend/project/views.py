
from rest_framework.decorators import api_view
from rest_framework.generics import RetrieveUpdateDestroyAPIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import PermissionDenied

from accounts.permissions import RBACPermission
from accounts.services import has_permission
from .models import Project
from .serializers import ProjectListSerializer,ProjectSerializer
# Create your views here.

@api_view(['GET','POST'])
def project_list_create(request):
    if request.method=='GET':
        if not has_permission(request.user, "projects.view"):
            raise PermissionDenied()
        projects=Project.objects.all()
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

class ProjectDetailView(
    RetrieveUpdateDestroyAPIView
):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [RBACPermission]
    rbac_resource = "projects"


import os
import re
from collections import defaultdict
from decimal import Decimal
from xml.sax.saxutils import escape

from django.conf import settings
from django.http import HttpResponse
from django.db.models import Prefetch
from django.shortcuts import get_object_or_404
from django.utils import timezone

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
            ),
            "label": ParagraphStyle(
                "TableLabel",
                parent=base["Normal"],
                fontName=PDF_FONT_NAME,
                fontSize=8,
                leading=10,
                alignment=TA_LEFT,
                textColor=colors.HexColor("#111827"),
            ),
            "cell": ParagraphStyle(
                "TableCell",
                parent=base["Normal"],
                fontName=PDF_FONT_NAME,
                fontSize=8,
                leading=10,
                alignment=TA_LEFT,
                textColor=colors.HexColor("#111827"),
            ),
            "cell_center": ParagraphStyle(
                "TableCellCenter",
                parent=base["Normal"],
                fontName=PDF_FONT_NAME,
                fontSize=8,
                leading=10,
                alignment=TA_CENTER,
                textColor=colors.HexColor("#111827"),
            ),
            "cell_right": ParagraphStyle(
                "TableCellRight",
                parent=base["Normal"],
                fontName=PDF_FONT_NAME,
                fontSize=8,
                leading=10,
                alignment=TA_RIGHT,
                textColor=colors.HexColor("#111827"),
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
            colWidths=col_widths,
            repeatRows=repeat_rows,
            hAlign="LEFT",
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
