import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

function parseArgs(argv) {
  const args = { command: null, inputs: null, output: null };
  // Expected: ecosa run <command> --inputs '<json>' [--output <path>]
  const tokens = argv.slice(2);
  if (tokens[0] !== "run" || !tokens[1]) {
    throw new Error("Usage: ecosa run <command> --inputs '<json>' [--output <path>]");
  }
  args.command = tokens[1];
  for (let i = 2; i < tokens.length; i += 1) {
    const t = tokens[i];
    if (t === "--inputs") {
      args.inputs = tokens[i + 1];
      i += 1;
    } else if (t === "--output") {
      args.output = tokens[i + 1];
      i += 1;
    }
  }
  if (!args.inputs) throw new Error("Missing --inputs JSON string");
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

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}

function id() {
  return crypto.randomUUID();
}

async function queueJob({ command, inputs, output }) {
  let payload;
  try {
    payload = JSON.parse(inputs);
  } catch (err) {
    throw new Error(`--inputs must be valid JSON: ${err?.message || err}`);
  }

  const queuedAt = new Date().toISOString();
  const jobId = id();
  const queueDir = resolveWorkspacePath("/public/queues");
  await ensureDir(queueDir);

  const job = {
    id: jobId,
    command,
    payload,
    status: "queued",
    queued_at: queuedAt,
    output: output || null
  };

  const filePath = path.join(queueDir, `${command}__${jobId}.json`);
  await fs.writeFile(filePath, JSON.stringify(job, null, 2), "utf8");
  return { filePath, job };
}

async function main() {
  const { command, inputs, output } = parseArgs(process.argv);
  const { filePath, job } = await queueJob({ command, inputs, output });
  console.log(`✅ queued: ${command}`);
  console.log(filePath);
  console.log(JSON.stringify(job, null, 2));
}

main().catch((err) => {
  console.error("ecosa runner error:", err?.message || err);
  process.exit(1);
});
