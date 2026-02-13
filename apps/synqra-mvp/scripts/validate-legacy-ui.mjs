import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const TARGETS = [
  "app/page.tsx",
  "app/enter/page.tsx",
  "app/auth",
  "app/user",
  "app/admin",
  "app/ops",
  "app/journey",
  "app/studio",
  "components/studio",
];

const EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".css"]);
const FORBIDDEN_PATTERNS = [
  { pattern: /\bSynqra Frame\b/gi, message: "Legacy frame copy found." },
  { pattern: /\bSTATUS\s+IDLE\b/gi, message: "Legacy status copy found." },
  { pattern: /\bSTATUS\s+READY\b/gi, message: "Legacy status copy found." },
  { pattern: /\bCOMMAND CENTER\b/gi, message: "Legacy command center copy found." },
  { pattern: /\bINITIALIZE\b/gi, message: "Legacy initialize copy found." },
  { pattern: /\bAURAFX\b/gi, message: "Legacy AuraFX copy found." },
  { pattern: /\bnoid-/gi, message: "Legacy NOID class token found." },
];

const violations = [];

async function listFiles(entryPath) {
  const full = path.join(ROOT, entryPath);
  const stat = await fs.stat(full);
  if (stat.isFile()) return [full];

  const entries = await fs.readdir(full, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const nextPath = path.join(full, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFiles(path.relative(ROOT, nextPath))));
      continue;
    }
    if (EXTENSIONS.has(path.extname(entry.name))) {
      files.push(nextPath);
    }
  }
  return files;
}

function lineNumber(content, index) {
  return content.slice(0, index).split("\n").length;
}

async function scanFile(filePath) {
  const content = await fs.readFile(filePath, "utf8");
  const relative = path.relative(ROOT, filePath).replaceAll("\\", "/");

  for (const rule of FORBIDDEN_PATTERNS) {
    const matches = [...content.matchAll(rule.pattern)];
    for (const match of matches) {
      violations.push(`${relative}:${lineNumber(content, match.index ?? 0)} ${rule.message}`);
    }
  }
}

async function main() {
  const files = [];
  for (const target of TARGETS) {
    const fullPath = path.join(ROOT, target);
    try {
      await fs.access(fullPath);
      files.push(...(await listFiles(target)));
    } catch {
      // Optional target; skip if absent.
    }
  }

  await Promise.all(files.map((filePath) => scanFile(filePath)));

  if (violations.length > 0) {
    console.error("Legacy UI validation failed:");
    for (const violation of violations) {
      console.error(`- ${violation}`);
    }
    process.exit(1);
  }

  console.log("Legacy UI validation passed.");
}

main().catch((error) => {
  console.error("Legacy UI validation crashed:");
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
