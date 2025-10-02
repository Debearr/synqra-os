from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.platypus import Table
from reportlab.pdfgen.canvas import Canvas

def draw_barcode_watermark(canvas, doc, project_name: str = "Generic"):
    canvas.saveState()
    canvas.setFillColorRGB(0.9, 0.8, 0.2, alpha=0.12)
    canvas.setFont("Courier-Bold", 32)

    name_lower = project_name.lower()
    if "synqra" in name_lower:
        pattern = "|||| |||| |||||"
    elif "noid" in name_lower:
        pattern = "()()()()()"
    elif "aurafx" in name_lower:
        pattern = "|| || || || ||"
    else:
        pattern = "||||| || ||| |||||"

    canvas.drawCentredString(
        doc.width/2.0 + doc.leftMargin,
        doc.height + doc.topMargin - 30,
        pattern
    )
    canvas.restoreState()


def render_pdf_from_log(log_file: str, pdf_file: str) -> None:
    doc = SimpleDocTemplate(pdf_file)
    styles = getSampleStyleSheet()
    story = []

    with open(log_file, "r", encoding="utf-8") as f:
        lines = f.readlines()

    project_hint = "Generic"
    for line in lines:
        # detect project in log line if available
        if "Synqra" in line:
            project_hint = "Synqra"
        elif "NØID" in line or "NoID" in line:
            project_hint = "NØID"
        elif "AuraFX" in line:
            project_hint = "AuraFX"
        if "[GLOBAL WARNING BANNER]" in line:
            warning_text = line.strip().replace("[GLOBAL WARNING BANNER]", "⚠️ Global Warning:")
            table = Table([[warning_text]], colWidths=[450])
            table.setStyle(TableStyle([
                ("BACKGROUND", (0,0), (-1,-1), colors.red),
                ("TEXTCOLOR", (0,0), (-1,-1), colors.gold),
                ("ALIGN", (0,0), (-1,-1), "CENTER"),
                ("FONTSIZE", (0,0), (-1,-1), 12),
                ("BOTTOMPADDING", (0,0), (-1,-1), 8),
                ("TOPPADDING", (0,0), (-1,-1), 8),
            ]))
            story.append(table)
            story.append(Spacer(1, 12))
        else:
            story.append(Paragraph(line.strip(), styles["Normal"]))
            story.append(Spacer(1, 6))

    doc.build(
        story,
        onFirstPage=lambda c, d: draw_barcode_watermark(c, d, project_hint),
        onLaterPages=lambda c, d: draw_barcode_watermark(c, d, project_hint)
    )


if __name__ == "__main__":
    render_pdf_from_log("DeployLog.md", "DeployLog_rendered.pdf")

