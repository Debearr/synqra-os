from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.platypus import Table


def render_pdf_from_log(log_file: str, pdf_file: str) -> None:
    doc = SimpleDocTemplate(pdf_file)
    styles = getSampleStyleSheet()
    story = []

    with open(log_file, "r", encoding="utf-8") as f:
        lines = f.readlines()

    for line in lines:
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

    doc.build(story)


if __name__ == "__main__":
    render_pdf_from_log("DeployLog.md", "DeployLog_rendered.pdf")

