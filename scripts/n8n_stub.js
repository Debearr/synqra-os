import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

function parseArgs(argv) {
  // n8n start workflow "Name"
  const tokens = argv.slice(2);
  if (tokens[0] !== "start" || tokens[1] !== "workflow") {
    throw new Error("Usage: n8n start workflow \"Workflow Name\"");
  }
  const name = tokens.slice(2).join(" ").replace(/^\"|\"$/g, "");
  if (!name) throw new Error("Missing workflow name");
  return { name };
}

function resolveWorkspacePath(p) {
  if (!p) return p;
  if (path.isAbsolute(p)) {
    if (p.startsWith("/public/")) return path.join(process.cwd(), p.slice(1));
    return p;
  }
  return path.resolve(process.cwd(), p);
}

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}

async function queueWorkflow(name) {
  const id = crypto.randomUUID();
  const queuesDir = resolveWorkspacePath('/public/queues');
  await ensureDir(queuesDir);
  const filePath = path.join(queuesDir, `n8n__${name.replace(/\s+/g,'_')}__${id}.json`);
  const payload = {
    id,
    workflow_name: name,
    status: 'queued',
    queued_at: new Date().toISOString()
  };
  await fs.writeFile(filePath, JSON.stringify(payload, null, 2), 'utf8');
  return { filePath, payload };
}

async function main() {
  const { name } = parseArgs(process.argv);
  const { filePath, payload } = await queueWorkflow(name);
  console.log(`✅ queued workflow: ${name}`);
  console.log(filePath);
  console.log(JSON.stringify(payload, null, 2));
}

main().catch((err) => {
  console.error("n8n stub error:", err?.message || err);
  process.exit(1);
});
