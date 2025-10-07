import axios from "axios";
import fs from "fs";
import path from "path";

async function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function main() {
  const url = "https://noid.app/reports/Launch_Insight_v1.pdf";
  const downloadsDir = path.join(process.cwd(), "public/reports");
  await ensureDir(downloadsDir);
  const outPath = path.join(downloadsDir, "Launch_Insight_v1.pdf");

  const res = await axios.get(url, { responseType: "arraybuffer" });
  fs.writeFileSync(outPath, res.data);
  console.log("✅ Report downloaded nightly:", outPath);
}

main().catch((err) => {
  console.error("❌ Night backup error:", err?.message || err);
  process.exit(1);
});
