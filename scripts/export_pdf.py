from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import Image as RLImage

import json
import os
import tempfile

try:
    import cairosvg  # type: ignore
except Exception:  # pragma: no cover
    cairosvg = None


GLYPH_FILE = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "../.cursor/glyphs/barcodes.json")
)


def render_with_glyphs(cell_text: str, project: str):
    """Replace glyph letters with inline SVGs converted to PNG for PDF table cells.

    If a glyph mapping exists for any character in the provided text, returns a
    small RL Image flowable for the first mapped glyph encountered. Otherwise
    returns the original text.
    """
    try:
        if not os.path.exists(GLYPH_FILE):
            return cell_text

        with open(GLYPH_FILE, "r", encoding="utf-8") as f:
            glyphs = json.load(f)

        defs = (glyphs.get(project) or {}).get("glyphs", {})
        if not defs:
            return cell_text

        # Find first char in text that has a glyph mapping
        for ch in cell_text:
            if ch in defs:
                if cairosvg is None:
                    # Fallback when cairosvg not available
                    return f"[{ch} BARCODE] {cell_text}"
                svg_str = defs[ch]
                tmp_png = tempfile.NamedTemporaryFile(delete=False, suffix=".png")
                tmp_png.close()
                cairosvg.svg2png(bytestring=svg_str.encode("utf-8"), write_to=tmp_png.name)
                return RLImage(tmp_png.name, width=20, height=20)

        return cell_text
    except Exception:
        return cell_text


def generate_pdf(projects, output_path: str = "Project_Status_Report.pdf") -> None:
    doc = SimpleDocTemplate(output_path, pagesize=A4)
    styles = getSampleStyleSheet()
    story = []

    story.append(Paragraph("<b>📊 Project Status Report</b>", styles["Title"]))
    story.append(Spacer(1, 20))

    data = [["Project", "Progress", "Last Deploy"]]
    rows = []
    for p in projects:
        name = p.get("name", "-")
        progress = f"{p.get('progress', 0)}%"
        last = p.get("last_deploy", "-")
        glyph_cell = render_with_glyphs(name, name)
        rows.append([glyph_cell, progress, last])

    data.extend(rows)
    table = Table(data, hAlign="LEFT", colWidths=[150, 100, 200])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.black),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 12),
                ("BACKGROUND", (0, 1), (-1, -1), colors.darkgray),
                ("TEXTCOLOR", (0, 1), (-1, -1), colors.whitesmoke),
            ]
        )
    )
    story.append(table)
    doc.build(story)


if __name__ == "__main__":
    # Optional CLI usage: read projects.json if available
    projects_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../projects.json"))
    if os.path.exists(projects_path):
        with open(projects_path, "r", encoding="utf-8") as f:
            projects = json.load(f)
    else:
        projects = []
    generate_pdf(projects)

