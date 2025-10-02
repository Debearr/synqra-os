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

    # Load warning toggle (default: false = clean mode)
    show_glyph_warnings = False
    if os.path.exists("projects.json"):
        try:
            import json
            with open("projects.json") as f:
                pj = json.load(f)
                if pj.get("showGlyphWarnings", False):
                    show_glyph_warnings = True
        except Exception:
            pass

    for line in log_text.splitlines():
        m = glyph_pattern.search(line)
        if m:
            glyph_char = m.group(1)
            svg_file = f".cursor/glyphs/{glyph_char}.svg"
            if os.path.exists(svg_file):
                try:
                    drawing = svg2rlg(svg_file)
                    story.append(drawing)
                    # Strip tag for clean text display
                    line = glyph_pattern.sub("", line)
                except Exception as e:
                    # Graceful fallback if SVG parse fails
                    line = line.replace(f"[GLYPH:{glyph_char}]", f"<b>{glyph_char}</b>")
                    if show_glyph_warnings:
                        story.append(Paragraph(f"⚠️ Missing SVG for glyph '{glyph_char}', fallback used.", style_normal))
            else:
                # Fallback if no SVG exists
                line = line.replace(f"[GLYPH:{glyph_char}]", f"<b>{glyph_char}</b>")
                if show_glyph_warnings:
                    story.append(Paragraph(f"⚠️ Missing SVG for glyph '{glyph_char}', fallback used.", style_normal))

        if line.strip():
            p = Paragraph(line, style_normal)
            story.append(p)
        story.append(Spacer(1, 6))

    doc = SimpleDocTemplate("DeployLog.pdf", pagesize=letter)
    doc.build(story)


if __name__ == "__main__":
    generate_pdf()

