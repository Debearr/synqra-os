import os
import re
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet


def generate_pdf():
    styles = getSampleStyleSheet()
    style_normal = styles["Normal"]

    with open("DeployLog.md", "r", encoding="utf-8") as f:
        log_text = f.read()

    story = []
    glyph_pattern = re.compile(r"\[GLYPH:(.*?)\]")

    from svglib.svglib import svg2rlg
    from reportlab.graphics import renderPDF

    for line in log_text.splitlines():
        m = glyph_pattern.search(line)
        if m:
            glyph_char = m.group(1)
            svg_file = f".cursor/glyphs/{glyph_char}.svg"
            if os.path.exists(svg_file):
                drawing = svg2rlg(svg_file)
                story.append(drawing)
                line = glyph_pattern.sub("", line)

        if line.strip():
            p = Paragraph(line, style_normal)
            story.append(p)
        story.append(Spacer(1, 6))

    doc = SimpleDocTemplate("DeployLog.pdf", pagesize=letter)
    doc.build(story)


if __name__ == "__main__":
    generate_pdf()

