from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.pagesizes import A4

styles = getSampleStyleSheet()


def render_log_entry(entry, story):
    if "🆕 New project registered" in entry:
        story.append(
            Paragraph(
                f'<para backcolor="#FFD700"><b>{entry}</b></para>',
                styles['Normal']
            )
        )
    else:
        story.append(Paragraph(entry, styles['Normal']))


def build_pdf_from_log(log_path: str = "DEPLOY_LOG.md", output_path: str = "DeployLog.pdf"):
    doc = SimpleDocTemplate(output_path, pagesize=A4)
    story = [Paragraph("<b>🚀 Deploy Log</b>", styles['Title']), Spacer(1, 18)]
    if not os.path.exists(log_path):
        story.append(Paragraph("No log entries found.", styles['Normal']))
        doc.build(story)
        return
    with open(log_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.rstrip('\n')
            if not line:
                story.append(Spacer(1, 6))
                continue
            render_log_entry(line, story)
    doc.build(story)


if __name__ == "__main__":
    import os
    build_pdf_from_log()

