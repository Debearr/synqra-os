import fs from "fs";
import path from "path";

export default function handler(req, res) {
  const reportsDir = path.join(process.cwd(), "public/reports");

  if (!fs.existsSync(reportsDir)) {
    res.status(200).json({ url: null });
    return;
  }

  const entries = fs.readdirSync(reportsDir);
  const files = entries.filter((name) => {
    const filePath = path.join(reportsDir, name);
    try {
      return fs.statSync(filePath).isFile() && name.toLowerCase().endsWith(".pdf");
    } catch {
      return false;
    }
  });

  if (files.length === 0) {
    res.status(200).json({ url: null });
    return;
  }

  let latestFile = files[0];
  let latestTime = 0;
  for (const name of files) {
    const filePath = path.join(reportsDir, name);
    const stats = fs.statSync(filePath);
    if (stats.mtimeMs > latestTime) {
      latestTime = stats.mtimeMs;
      latestFile = name;
    }
  }

  // Serve via Next static files from public/reports
  const url = `/reports/${encodeURIComponent(latestFile)}`;
  res.status(200).json({ url, filename: latestFile });
}
