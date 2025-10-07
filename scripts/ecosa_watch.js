import fs from "node:fs/promises";
import path from "node:path";
import puppeteer from "puppeteer";

function parseArgs(argv) {
  // ecosa watch <command> --checks "a,b,c" --output <path>
  const tokens = argv.slice(2);
  if (tokens[0] !== "watch" || !tokens[1]) {
    throw new Error("Usage: ecosa watch <command> --checks 'a,b,c' --output <path>");
  }
  const args = { command: tokens[1], checks: [], output: null };
  for (let i = 2; i < tokens.length; i += 1) {
    const t = tokens[i];
    if (t === "--checks") { args.checks = (tokens[i + 1] || "").split(",").map(s => s.trim()).filter(Boolean); i += 1; }
    else if (t === "--output") { args.output = tokens[i + 1]; i += 1; }
  }
  if (!args.output) throw new Error("Missing --output path");
  return args;
}

function resolveWorkspacePath(p) {
  if (!p) return p;
  if (path.isAbsolute(p)) {
    if (p.startsWith("/public/")) return path.join(process.cwd(), p.slice(1));
    return p;
  }
  return path.resolve(process.cwd(), p);
}

async function findLatestQueueJob(commandName) {
  const queuesDir = resolveWorkspacePath("/public/queues");
  try {
    const entries = await fs.readdir(queuesDir);
    const matching = entries.filter(name => name.startsWith(`${commandName}__`) && name.endsWith('.json'));
    if (matching.length === 0) return null;
    // stat all and pick latest by mtime
    const withStats = await Promise.all(matching.map(async (name) => {
      const full = path.join(queuesDir, name);
      const st = await fs.stat(full);
      return { name, full, mtimeMs: st.mtimeMs };
    }));
    withStats.sort((a, b) => b.mtimeMs - a.mtimeMs);
    const latest = withStats[0];
    const raw = await fs.readFile(latest.full, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
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

function buildHtml({ command, checks, jobMeta }) {
  const now = new Date().toLocaleString();
  const checksList = checks.length ? checks : ["(no checks provided)"];
  const jobBlock = jobMeta ? `
    <section>
      <h2>Job</h2>
      <p><b>Command:</b> ${htmlEscape(jobMeta.command || command)}</p>
      <p><b>Status:</b> ${htmlEscape(jobMeta.status || 'unknown')}</p>
      <p><b>ID:</b> ${htmlEscape(jobMeta.id || '')}</p>
      <p><b>Queued At:</b> ${htmlEscape(jobMeta.queued_at || '')}</p>
    </section>` : `
    <section>
      <h2>Job</h2>
      <p class="muted">No queued job found for ${htmlEscape(command)}. Showing checks snapshot only.</p>
    </section>`;

  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Ship Verification</title>
  <style>
    :root { --ink:#0f172a; --muted:#64748b; --ok:#16a34a; --warn:#d97706; }
    body { font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color: var(--ink); margin: 28px; }
    h1 { font-size: 26px; margin: 0 0 8px; }
    h2 { font-size: 18px; margin: 20px 0 8px; }
    p.meta { color: var(--muted); margin: 0 0 16px; }
    section { border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px; margin-bottom: 14px; }
    ul { padding-left: 18px; }
    li { margin: 6px 0; }
    .tag { display:inline-block; font-size:12px; padding:2px 8px; border-radius:999px; background:#ecfeff; color:#155e75; margin-left:8px; }
  </style>
</head>
<body>
  <h1>Ship Verification</h1>
  <p class="meta">Command: ${htmlEscape(command)} • Generated ${now}</p>

  ${jobBlock}

  <section>
    <h2>Checks</h2>
    <ul>
      ${checksList.map(c => `<li>${htmlEscape(c)} <span class="tag">pending</span></li>`).join('')}
    </ul>
    <p class="meta">This is a static verification snapshot. Live telemetry not connected.</p>
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
    await fs.mkdir(path.dirname(outPath), { recursive: true });
    await page.pdf({ path: outPath, format: "A4", printBackground: true, margin: { top: "14mm", right: "12mm", bottom: "14mm", left: "12mm" } });
  } finally {
    await browser.close();
  }
}

async function main() {
  const { command, checks, output } = parseArgs(process.argv);
  const outPath = resolveWorkspacePath(output);
  const jobMeta = await findLatestQueueJob(command);
  const html = buildHtml({ command, checks, jobMeta });
  await generatePdf(html, outPath);
  console.log("✅ ecosa watch report:", outPath);
}

main().catch((err) => {
  console.error("ecosa watch error:", err?.message || err);
  process.exit(1);
});
