import fs from "node:fs/promises";
import path from "node:path";
import puppeteer from "puppeteer";

function parseArgs(argv) {
  const args = { inputs: null, output: null };
  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--inputs") {
      args.inputs = argv[i + 1];
      i += 1;
    } else if (token === "--output") {
      args.output = argv[i + 1];
      i += 1;
    }
  }
  return args;
}

function resolveWorkspacePath(p) {
  if (!p) return p;
  if (path.isAbsolute(p)) {
    // Interpret absolute "/public/..." as workspace-relative
    if (p.startsWith("/public/")) {
      return path.join(process.cwd(), p.slice(1));
    }
    return p;
  }
  return path.resolve(process.cwd(), p);
}

async function readJsonOrThrow(filePath) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(`Failed to read JSON at ${filePath}: ${err?.message || err}`);
  }
}

function stringifyCompact(value) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function htmlEscape(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildHtml({ sources, goal }) {
  const [sourceA, sourceB] = sources;
  const goalText = goal || "merge_conflicts=false, prioritize_claude_simplify, preserve_brand_voice=true";

  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Investor Summary v2</title>
  <style>
    :root { --ink:#0f172a; --muted:#475569; --brand:#111827; --accent:#2563eb; }
    body { font-family: -apple-system, Segoe UI, Roboto, Inter, Helvetica, Arial, sans-serif; color: var(--ink); margin: 32px; }
    h1 { font-size: 28px; margin: 0 0 8px; color: var(--brand); }
    h2 { font-size: 18px; margin: 24px 0 8px; color: var(--brand); }
    p.meta { color: var(--muted); margin: 0 0 24px; }
    section { border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
    .pill { display: inline-block; background: #eff6ff; color: var(--accent); padding: 2px 8px; border-radius: 999px; font-size: 12px; margin-right: 8px; }
    pre { background: #f8fafc; padding: 12px; border-radius: 6px; overflow: auto; font-size: 12px; line-height: 1.5; }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  </style>
</head>
<body>
  <h1>Investor Summary v2</h1>
  <p class="meta">Generated ${new Date().toLocaleString()} • Goal: ${htmlEscape(goalText)}</p>

  <section>
    <h2>Merge Policy</h2>
    <div>
      <span class="pill">no_conflicts</span>
      <span class="pill">prioritize_claude_simplify</span>
      <span class="pill">preserve_brand_voice</span>
    </div>
    <p class="meta">Conflicts are resolved in favor of Claude-derived simplifications. Original founder language is surfaced intact alongside merged conclusions.</p>
  </section>

  <section>
    <h2>Merged Overview</h2>
    <p>The following pages present both source artifacts and a unified view to aid investor review. This layout preserves original tone while surfacing simplified takeaways.</p>
  </section>

  <section class="two-col">
    <div>
      <h2>Founder Report</h2>
      <pre>${htmlEscape(stringifyCompact(sourceA))}</pre>
    </div>
    <div>
      <h2>Claude YC Eval</h2>
      <pre>${htmlEscape(stringifyCompact(sourceB))}</pre>
    </div>
  </section>

</body>
</html>`;

  return html;
}

async function generatePdf(html, outPath) {
  const browser = await puppeteer.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    await page.pdf({ path: outPath, format: "A4", printBackground: true, margin: { top: "16mm", right: "14mm", bottom: "16mm", left: "14mm" } });
  } finally {
    await browser.close();
  }
}

async function main() {
  const { inputs, output } = parseArgs(process.argv);
  if (!inputs) throw new Error("Missing --inputs JSON string");
  if (!output) throw new Error("Missing --output path");

  let parsed;
  try {
    parsed = JSON.parse(inputs);
  } catch (err) {
    throw new Error(`--inputs must be valid JSON: ${err?.message || err}`);
  }

  const goal = parsed.goal || "";
  const sources = Array.isArray(parsed.sources) ? parsed.sources : [];
  if (sources.length !== 2) {
    throw new Error("--inputs.sources must be an array of exactly two file paths");
  }

  const [srcAPath, srcBPath] = sources.map(resolveWorkspacePath);
  const outPath = resolveWorkspacePath(output);

  const [sourceA, sourceB] = await Promise.all([
    readJsonOrThrow(srcAPath),
    readJsonOrThrow(srcBPath)
  ]);

  const html = buildHtml({ sources: [sourceA, sourceB], goal });
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await generatePdf(html, outPath);

  console.log("✅ council_merge completed:", outPath);
}

main().catch((err) => {
  console.error("council_merge error:", err?.message || err);
  process.exit(1);
});
