import fs from "fs";
import path from "path";

export default function handler(req, res) {
  const { filename } = req.query;
  const publicDir = path.join(process.cwd(), "public/reports");
  const filePath = path.join(publicDir, filename);

  if (!fs.existsSync(filePath)) {
    res.status(404).send("File not found");
    return;
  }

  const ext = path.extname(filename).toLowerCase();
  const contentType = ext === ".pdf" ? "application/pdf" : "application/octet-stream";

  res.setHeader("Content-Type", contentType);
  res.setHeader("Content-Disposition", `attachment; filename=\"${filename}\"`);

  const stream = fs.createReadStream(filePath);
  stream.on("error", () => res.status(500).end("Error reading file"));
  stream.pipe(res);
}
