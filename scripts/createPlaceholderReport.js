import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

const outDir = path.join(process.cwd(), "public/reports");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, "Launch_Insight_v1.pdf");

const doc = new PDFDocument({ size: "LETTER", margin: 50 });
doc.pipe(fs.createWriteStream(outPath));

doc.fontSize(20).text("Launch Insight Report v1", { align: "center" });
doc.moveDown();
doc.fontSize(12).text("Placeholder auto-generated because remote report was unavailable (404).", { align: "center" });

doc.end();

console.log("✅ Placeholder report created:", outPath);
