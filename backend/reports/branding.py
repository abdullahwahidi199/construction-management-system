import os
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.platypus import Image, Paragraph, Spacer, Table, TableStyle

from accounts.models import CompanyInformation

DEFAULT_COMPANY_FOOTER = (
    "This is a system-generated document. Keep it with the official records."
)


def get_company_information(request=None):
    return CompanyInformation.get_for_request(request)


def _text(value, fallback=""):
    if value is None or value == "":
        return fallback
    return str(value)


def _p(value, style):
    return Paragraph(escape(_text(value)), style)


def company_address_line(company):
    return ", ".join(
        item
        for item in [
            company.address,
            company.city,
            company.province_state,
            company.country,
            company.postal_code,
        ]
        if item
    )


def company_contact_line(company):
    return " | ".join(
        item
        for item in [company.phone_number, company.email, company.website]
        if item
    )


def company_logo_flowable(company, width=22 * mm, height=16 * mm):
    logo = getattr(company, "company_logo", None)
    if not logo:
        return ""
    try:
        path = logo.path
    except (NotImplementedError, ValueError):
        return ""
    if not os.path.exists(path):
        return ""
    image = Image(path, width=width, height=height)
    image.hAlign = "LEFT"
    return image


def build_pdf_branding_elements(
    *,
    title,
    subtitle="",
    request=None,
    styles,
    title_style_name="Title",
    normal_style_name="Normal",
):
    company = get_company_information(request)
    normal = styles[normal_style_name]
    title_style = styles[title_style_name]
    detail_style = normal.clone("CompanyBrandDetail")
    detail_style.fontSize = 8
    detail_style.leading = 10
    detail_style.textColor = colors.HexColor("#4B5563")
    detail_style.spaceAfter = 1

    report_title_style = title_style.clone("CompanyReportTitle")
    report_title_style.fontSize = 14
    report_title_style.leading = 17
    report_title_style.textColor = colors.HexColor("#111827")
    report_title_style.alignment = 2

    report_subtitle_style = detail_style.clone("CompanyReportSubtitle")
    report_subtitle_style.alignment = 2

    company_name_style = title_style.clone("CompanyName")
    company_name_style.fontSize = 13
    company_name_style.leading = 16
    company_name_style.textColor = colors.HexColor("#111827")

    company_lines = [_p(company.company_name, company_name_style)]
    if company.legal_company_name:
        company_lines.append(_p(company.legal_company_name, detail_style))
    address = company_address_line(company)
    contact = company_contact_line(company)
    if address:
        company_lines.append(_p(address, detail_style))
    if contact:
        company_lines.append(_p(contact, detail_style))

    report_lines = [_p(title, report_title_style)]
    if subtitle:
        report_lines.append(_p(subtitle, report_subtitle_style))

    header = Table(
        [[company_logo_flowable(company), company_lines, report_lines]],
        colWidths=[24 * mm, 100 * mm, 62 * mm],
        hAlign="LEFT",
    )
    header.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LINEBELOW", (0, 0), (-1, -1), 1, colors.HexColor("#111827")),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )

    return company, [header, Spacer(1, 8)]


def draw_pdf_branding_footer(canvas, doc, *, company=None, request=None, font_name="Helvetica"):
    company = company or get_company_information(request)
    footer = company.print_footer_text or DEFAULT_COMPANY_FOOTER
    contact = company_contact_line(company)
    width, _ = doc.pagesize

    canvas.saveState()
    canvas.setFillColor(colors.HexColor("#6B7280"))
    canvas.setFont(font_name, 7)
    canvas.drawCentredString(width / 2, 14, footer[:180])
    if contact:
        canvas.drawCentredString(width / 2, 6, contact[:180])
    canvas.drawRightString(width - doc.rightMargin, 6, f"Page {doc.page}")
    canvas.restoreState()
