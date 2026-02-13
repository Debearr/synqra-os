import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const SCAN_DIRS = ["app", "components", "styles"];
const EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".css"]);
const EXCLUDED_PATH_PATTERNS = [/[/\\]node_modules[/\\]/, /[/\\]\.next[/\\]/, /[/\\]app[/\\]api[/\\]/];

const ALLOWED_COLOR_HEX = new Set(["#b8a060", "#050505", "#0a0a0a", "#e5e5e5", "#737373"]);
const ALLOWED_SPACING = new Set(["2", "4", "6", "8", "12", "16"]);
const DISALLOWED_FONT_WEIGHT_PATTERN = /\bfont-(thin|extralight|light|bold|extrabold|black|\[[0-9]+\])\b/g;
const DISALLOWED_RADIUS_PATTERN = /\brounded-(md|lg|xl|2xl|3xl|full|\[[^\]]+\])\b/g;
const SPACING_PATTERN = /\b(?:m|mx|my|mt|mr|mb|ml|p|px|py|pt|pr|pb|pl|gap|space-x|space-y)-([0-9]+)\b/g;
const INLINE_STYLE_PATTERN = /style=\{[\s\S]*?\}|style:\s*\{[\s\S]*?\}/g;
const COLOR_LITERAL_PATTERN = /#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b|rgba?\([^)]*\)|hsla?\([^)]*\)|oklch\([^)]*\)/g;
const GRADIENT_PATTERN = /\bbg-gradient-to-\w+\b|\bfrom-[^\s"'`]+|\bvia-[^\s"'`]+|\bto-[^\s"'`]+/g;

const violations = [];

async function listFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (EXCLUDED_PATH_PATTERNS.some((pattern) => pattern.test(fullPath))) continue;
    if (entry.isDirectory()) {
      files.push(...(await listFiles(fullPath)));
      continue;
    }
    if (EXTENSIONS.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }
  return files;
}

function lineNumberForIndex(content, index) {
  return content.slice(0, index).split("\n").length;
}

function addViolation(filePath, index, message) {
  const relative = path.relative(ROOT, filePath).replaceAll("\\", "/");
  violations.push(`${relative}:${lineNumberForIndex(cache.get(filePath), index)} ${message}`);
}

const cache = new Map();

function scanContent(filePath, content) {
  cache.set(filePath, content);

  if (filePath.endsWith(".tsx") || filePath.endsWith(".jsx")) {
    for (const match of content.matchAll(INLINE_STYLE_PATTERN)) {
      addViolation(filePath, match.index ?? 0, "Inline styles are not allowed.");
    }
  }

  if (!filePath.endsWith(".css")) {
    for (const match of content.matchAll(SPACING_PATTERN)) {
      const value = match[1];
      if (!ALLOWED_SPACING.has(value)) {
        addViolation(filePath, match.index ?? 0, `Spacing token '${value}' is outside allowed scale.`);
      }
    }

    for (const match of content.matchAll(DISALLOWED_FONT_WEIGHT_PATTERN)) {
      addViolation(filePath, match.index ?? 0, `Font weight token '${match[0]}' is not allowed.`);
    }

    for (const match of content.matchAll(DISALLOWED_RADIUS_PATTERN)) {
      addViolation(filePath, match.index ?? 0, `Border radius token '${match[0]}' exceeds 4px max.`);
    }

    const isApertureFile = /aperture/i.test(filePath);
    if (!isApertureFile) {
      for (const match of content.matchAll(GRADIENT_PATTERN)) {
        addViolation(filePath, match.index ?? 0, "Gradients are only allowed in optional aperture component.");
      }
    }
  }

  for (const match of content.matchAll(COLOR_LITERAL_PATTERN)) {
    const literal = match[0].toLowerCase();
    if (literal.startsWith("#") && ALLOWED_COLOR_HEX.has(literal)) continue;
    addViolation(filePath, match.index ?? 0, `Disallowed color literal '${match[0]}'.`);
  }
}

async function main() {
  const files = (
    await Promise.all(
      SCAN_DIRS.map(async (dir) => {
        const fullDir = path.join(ROOT, dir);
        try {
          await fs.access(fullDir);
          return await listFiles(fullDir);
        } catch {
          return [];
        }
      })
    )
  ).flat();

  await Promise.all(
    files.map(async (filePath) => {
      const content = await fs.readFile(filePath, "utf8");
      scanContent(filePath, content);
    })
  );

  if (violations.length > 0) {
    console.error("Design system validation failed:");
    for (const violation of violations) {
      console.error(`- ${violation}`);
    }
    process.exit(1);
  }

  console.log("Design system validation passed.");
}

main().catch((error) => {
  console.error("Design system validation failed with runtime error:");
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
