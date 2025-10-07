#!/usr/bin/env node
import fs from "fs";
import path from "path";

function parseArgs(argv) {
  const args = { format: "json", type: "launch_insight" };
  for (const part of argv.slice(2)) {
    if (part.startsWith("--format=")) args.format = part.split("=")[1];
    else if (part.startsWith("--type=")) args.type = part.split("=")[1];
    else if (part.startsWith("--output=")) args.output = part.split("=")[1];
    else if (!args.cmd) args.cmd = part; // e.g., latest
  }
  return args;
}

function getLatestReportFile(dir, extensionFilter = ".pdf") {
  if (!fs.existsSync(dir)) return null;
  const entries = fs.readdirSync(dir);
  const files = entries.filter((name) => {
    const filePath = path.join(dir, name);
    try {
      return (
        fs.statSync(filePath).isFile() &&
        name.toLowerCase().endsWith(extensionFilter)
      );
    } catch {
      return false;
    }
  });
  if (files.length === 0) return null;
  let latest = files[0];
  let latestTime = 0;
  for (const name of files) {
    const stats = fs.statSync(path.join(dir, name));
    if (stats.mtimeMs > latestTime) {
      latestTime = stats.mtimeMs;
      latest = name;
    }
  }
  return { name: latest, mtimeMs: latestTime };
}

async function main() {
  const { cmd, format, type, output } = parseArgs(process.argv);
  if (!cmd || cmd !== "latest") {
    console.error("Usage: node scripts/reportGet.js latest --format=json|pdf [--type=launch_insight] [--output=path]");
    process.exit(2);
  }

  const reportsDir = path.join(process.cwd(), "public/reports");
  const latest = getLatestReportFile(reportsDir, ".pdf");
  if (!latest) {
    console.error("No reports found in public/reports");
    process.exit(1);
  }

  const filename = latest.name;
  const filePath = path.join(reportsDir, filename);
  const url = `/reports/${encodeURIComponent(filename)}`;

  if (format === "json") {
    const payload = {
      type,
      filename,
      url,
      mtime: new Date(latest.mtimeMs).toISOString()
    };
    process.stdout.write(JSON.stringify(payload, null, 2));
    return;
  }

  if (format === "pdf") {
    const data = fs.readFileSync(filePath);
    if (output) {
      // Write directly to desired output path to avoid piping truncation issues
      fs.writeFileSync(path.resolve(output), data);
      return;
    }
    process.stdout.write(data);
    return;
  }

  console.error(`Unsupported format: ${format}`);
  process.exit(2);
}

main().catch((err) => {
  console.error(err?.stack || String(err));
  process.exit(1);
});
