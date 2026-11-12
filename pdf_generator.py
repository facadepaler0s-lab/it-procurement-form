"""
PDF Generator Module for IT Infrastructure Procurement Requisitions.

Primary engine: WeasyPrint (HTML/CSS -> A4 PDF).
Fallback engine: ReportLab (pure-Python A4 PDF when GTK/WeasyPrint is unavailable).
"""

import html
import logging
import os
from datetime import datetime
from typing import Optional

from jinja2 import Environment, FileSystemLoader

logger = logging.getLogger(__name__)

TEMPLATE_DIR = os.path.join(os.path.dirname(__file__), "templates")
env = Environment(loader=FileSystemLoader(TEMPLATE_DIR), autoescape=True)


def _esc(value: Optional[object]) -> str:
    """Safely escape user-supplied values for ReportLab XML Paragraph markup."""
    return html.escape(str(value or "").strip(), quote=True)


def _render_weasyprint(html_content: str, filepath: str) -> None:
    """Render HTML string to PDF via WeasyPrint."""
    import weasyprint

    weasyprint.HTML(string=html_content).write_pdf(filepath)


def _render_reportlab(req_data, now_str: str, filepath: str) -> None:
    """Pure-Python A4 PDF fallback using ReportLab Platypus."""
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
    from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

    doc = SimpleDocTemplate(
        filepath, pagesize=A4, leftMargin=36, rightMargin=36, topMargin=36, bottomMargin=36
    )

    base = getSampleStyleSheet()
    navy, slate, dark, light_bg, border = (
        colors.HexColor("#1e3a8a"),
        colors.HexColor("#475569"),
        colors.HexColor("#0f172a"),
        colors.HexColor("#f8fafc"),
        colors.HexColor("#cbd5e1"),
    )

    def make_style(name: str, parent: str = "Normal", **kwargs) -> ParagraphStyle:
        return ParagraphStyle(name, parent=base[parent], **kwargs)

    styles = {
        "title": make_style("DocTitle", "Heading1", fontName="Helvetica-Bold", fontSize=15, textColor=navy, spaceAfter=4),
        "subtitle": make_style("SubTitle", fontName="Helvetica", fontSize=8.5, textColor=colors.HexColor("#64748b"), spaceAfter=12),
        "badge": make_style("BadgeText", fontName="Helvetica-Bold", fontSize=12, alignment=2, textColor=colors.HexColor("#15803d")),
        "section": make_style("SectionH", "Heading2", fontName="Helvetica-Bold", fontSize=10, textColor=navy, spaceBefore=8, spaceAfter=4),
        "cell": make_style("CellText", fontName="Helvetica", fontSize=9, textColor=dark),
        "label": make_style("LabelText", fontName="Helvetica-Bold", fontSize=9, textColor=slate),
    }

    kv_style = TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LINEBELOW", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
    ])

    box_style = TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), light_bg),
        ("BOX", (0, 0), (-1, -1), 1, border),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
    ])

    def build_kv_table(pairs: list[tuple[str, str, str, str]]) -> Table:
        rows = [
            [
                Paragraph(l1, styles["label"]), Paragraph(v1, styles["cell"]),
                Paragraph(l2, styles["label"]), Paragraph(v2, styles["cell"]),
            ]
            for l1, v1, l2, v2 in pairs
        ]
        tbl = Table(rows, colWidths=[100, 160, 100, 160])
        tbl.setStyle(kv_style)
        return tbl

    def build_box(cells: list[str], col_widths: list[int]) -> Table:
        tbl = Table([[Paragraph(c, styles["cell"]) for c in cells]], colWidths=col_widths)
        tbl.setStyle(box_style)
        return tbl

    dept_display = (
        f"{_esc(req_data.department)} ({_esc(req_data.other_department)})"
        if getattr(req_data, "other_department", None)
        else _esc(req_data.department)
    )

    hdr_table = Table(
        [
            [
                Paragraph("<b>IT INFRASTRUCTURE PROCUREMENT REQUISITION</b>", styles["title"]),
                Paragraph(f"TICKET<br/><b>{_esc(req_data.ticket_number)}</b>", styles["badge"]),
            ],
            [Paragraph(f"Official Requisition Copy &middot; Generated on {now_str}", styles["subtitle"]), ""],
        ],
        colWidths=[380, 140],
    )
    hdr_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LINEBELOW", (0, 1), (-1, 1), 2, navy),
        ("BOTTOMPADDING", (0, 1), (-1, 1), 8),
    ]))

    elements = [
        hdr_table,
        Spacer(1, 10),
        Paragraph("1. REQUESTER &amp; ORGANIZATIONAL DETAILS", styles["section"]),
        build_kv_table([
            ("Requester Name:", _esc(req_data.requester_name), "Date of Request:", _esc(req_data.date_of_request)),
            ("Official Email:", _esc(req_data.official_email), "Reporting HOD:", _esc(req_data.hod_manager)),
            ("Department:", dept_display, "Delivery Location:", _esc(req_data.delivery_address)),
        ]),
        Spacer(1, 10),
        Paragraph("2. PROCUREMENT SPECIFICATIONS", styles["section"]),
        build_kv_table([
            ("Request Type:", _esc(req_data.request_type), "Item Category:", _esc(req_data.item_category)),
            ("Item Requested:", f"<b>{_esc(req_data.item_requested)}</b> (Qty: {_esc(req_data.quantity)})", "Date Required:", _esc(req_data.date_required)),
        ]),
        Spacer(1, 8),
        build_box([f"<b>Purpose / Work to be Performed:</b><br/>{_esc(req_data.purpose)}"], [520]),
    ]

    if getattr(req_data, "laptop_specs", None):
        elements.extend([
            Spacer(1, 8),
            build_box(
                [
                    f"<b>Department Hardware Specification:</b><br/>{_esc(req_data.laptop_specs)}<br/>"
                    "<font color='#64748b'>Standard Accessories: Carrying bag, Mouse, Headphones</font>"
                ],
                [520],
            ),
        ])

    elements.extend([
        Spacer(1, 14),
        build_box(
            [
                f"<b>Requester Declaration:</b><br/>Certified accurate and required for official duties.<br/>"
                f"Digitally Signed: <b>{_esc(req_data.requester_name)}</b><br/>"
                f"<font color='#64748b'>Date: {_esc(req_data.date_of_request)}</font>",
                f"<b>Workflow Verification:</b><br/>HOD Status: <b>Pending Review ({_esc(req_data.hod_manager)})</b><br/>"
                f"IT Status: <b>Verification Initiated</b><br/>"
                f"<font color='#64748b'>Ticket Status: {_esc(req_data.status)} &middot; ID: #{_esc(req_data.id)}</font>",
            ],
            [255, 255],
        ),
    ])

    doc.build(elements)


def generate_procurement_pdf(req_data, output_dir: str) -> Optional[str]:
    """
    Generate an A4 Procurement Requisition PDF using WeasyPrint with a ReportLab fallback.
    Returns the generated filename, or None if both engines fail.
    """
    os.makedirs(output_dir, exist_ok=True)
    clean_ticket = "".join(c for c in (req_data.ticket_number or "") if c.isalnum() or c in "-_") or "REQ"
    filename = f"Requisition_{clean_ticket}_{req_data.id}.pdf"
    filepath = os.path.join(output_dir, filename)

    now_str = datetime.now().strftime("%d %b %Y, %I:%M %p")
    html_content = env.get_template("pdf_template.html").render(req=req_data, generation_date=now_str)

    try:
        _render_weasyprint(html_content, filepath)
        return filename
    except Exception as exc:
        logger.warning("WeasyPrint unavailable (%s); falling back to ReportLab.", exc)

    try:
        _render_reportlab(req_data, now_str, filepath)
        return filename
    except Exception as fallback_exc:
        logger.exception("Both PDF engines failed for ticket %s: %s", req_data.ticket_number, fallback_exc)
        return None
