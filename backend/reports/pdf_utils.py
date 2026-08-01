from io import BytesIO
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
            summary_rows.append([label, _format_value(value)])
        if summary_rows:
            t = Table(summary_rows, colWidths=[200, 200])
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

        header = [col[1] for col in columns]
        data = [header]
        for row in rows:
            data.append([_format_value(row.get(col[0])) for col in columns])

        table = Table(data, repeatRows=1)
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
