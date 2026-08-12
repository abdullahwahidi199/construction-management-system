from io import BytesIO
from xml.sax.saxutils import escape
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
)

from .branding import build_pdf_branding_elements, draw_pdf_branding_footer


def _format_value(value):
    if value is None:
        return ""
    return str(value)


def safe_paragraph(value, style, transform=None):
    """
    Render table text as a Paragraph so long English/Dari/Pashto text wraps
    inside its cell instead of pushing the PDF table beyond the page.
    """
    text = _format_value(value)
    if transform:
        text = transform(text)
    text = escape(text).replace("\n", "<br/>")
    return Paragraph(text, style)


def fit_col_widths(widths, available_width):
    total = sum(widths)
    if total <= available_width:
        return widths
    factor = available_width / total
    return [width * factor for width in widths]


def weighted_col_widths(columns, available_width):
    weights = []
    for key, header in columns:
        label = f"{key} {header}".lower()
        if any(part in label for part in ["description", "scope", "notes", "remarks"]):
            weights.append(2.4)
        elif any(part in label for part in ["title", "name", "project", "subcontractor", "employee"]):
            weights.append(1.55)
        elif any(part in label for part in ["amount", "total", "gross", "net", "paid", "balance", "value"]):
            weights.append(1.05)
        elif any(part in label for part in ["date", "period", "status", "type", "currency"]):
            weights.append(0.85)
        else:
            weights.append(1.0)

    total_weight = sum(weights) or 1
    return [available_width * weight / total_weight for weight in weights]


def generate_pdf(report_data: dict, columns: list = None, request=None) -> BytesIO:
    """
    Generic PDF generator.
    report_data: dict from BaseReport.generate()
    columns: list of (key, header) tuples for the rows table.
             If None, derived from first row.
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=landscape(A4),
        topMargin=12 * mm,
        bottomMargin=22 * mm,
        leftMargin=12 * mm,
        rightMargin=12 * mm,
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "ReportTitle", parent=styles["Heading1"],
        fontSize=18, textColor=colors.HexColor("#1a3c6e"),
    )
    meta_style = ParagraphStyle(
        "Meta", parent=styles["Normal"], fontSize=9,
        textColor=colors.grey,
    )
    table_cell_style = ParagraphStyle(
        "ReportTableCell",
        parent=styles["Normal"],
        fontSize=6.5,
        leading=8,
        wordWrap="CJK",
        splitLongWords=True,
    )
    table_header_style = ParagraphStyle(
        "ReportTableHeader",
        parent=table_cell_style,
        fontSize=6.5,
        leading=8,
        textColor=colors.white,
        alignment=1,
    )
    summary_cell_style = ParagraphStyle(
        "ReportSummaryCell",
        parent=styles["Normal"],
        fontSize=8,
        leading=10,
        wordWrap="CJK",
        splitLongWords=True,
    )

    elements = []

    company, branding = build_pdf_branding_elements(
        title=report_data.get("report_name", "Report"),
        subtitle=f"Generated at: {report_data.get('generated_at', '')}",
        request=request,
        styles=styles,
    )
    elements.extend(branding)

    # Summary section
    summary = report_data.get("summary")
    if summary:
        elements.append(Paragraph("Summary", styles["Heading2"]))
        summary_rows = []
        for key, value in summary.items():
            if isinstance(value, (list, dict)):
                continue
            label = key.replace("_", " ").title()
            summary_rows.append([
                safe_paragraph(label, summary_cell_style),
                safe_paragraph(value, summary_cell_style),
            ])
        if summary_rows:
            t = Table(
                summary_rows,
                colWidths=fit_col_widths([200, 360], doc.width),
                splitByRow=True,
            )
            t.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#eef3fa")),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.lightgrey),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("PADDING", (0, 0), (-1, -1), 6),
            ]))
            elements.append(t)
            elements.append(Spacer(1, 12))

    # Main rows table
    rows = report_data.get("rows", [])
    if rows:
        if columns is None:
            columns = [(k, k.replace("_", " ").title()) for k in rows[0].keys()]

        header = [safe_paragraph(col[1], table_header_style) for col in columns]
        data = [header]
        for row in rows:
            data.append([
                safe_paragraph(row.get(col[0]), table_cell_style)
                for col in columns
            ])

        table = Table(
            data,
            repeatRows=1,
            colWidths=weighted_col_widths(columns, doc.width),
            splitByRow=True,
        )
        table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1a3c6e")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTSIZE", (0, 0), (-1, -1), 7),
            ("GRID", (0, 0), (-1, -1), 0.4, colors.lightgrey),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1),
             [colors.white, colors.HexColor("#f6f8fb")]),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("PADDING", (0, 0), (-1, -1), 3),
        ]))
        elements.append(table)

    doc.build(
        elements,
        onFirstPage=lambda canvas, document: draw_pdf_branding_footer(
            canvas,
            document,
            company=company,
        ),
        onLaterPages=lambda canvas, document: draw_pdf_branding_footer(
            canvas,
            document,
            company=company,
        ),
    )
    buffer.seek(0)
    return buffer
