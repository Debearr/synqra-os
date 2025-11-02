#!/usr/bin/env node

/**
 * Synqra OS deployment hardening script.
 *
 * This script normalises production-critical assets so that CI/CD jobs do not
 * fail on missing metadata, icons, or scripts. It is intentionally idempotent
 * and safe to re-run at any time.
 */

const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname);
const dashboardDir = path.join(rootDir, "noid-dashboard");
const appDir = path.join(dashboardDir, "app");
const publicDir = path.join(dashboardDir, "public");
const workflowsDir = path.join(rootDir, ".github", "workflows");

const ICONS = {
  "icon-192.png":
    "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",
  "icon-512.png":
    "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",
};

const DEFAULT_MANIFEST = {
  name: "Synqra OS",
  short_name: "Synqra",
  description:
    "Operational analytics and orchestration suite for Synqra OS.",
  start_url: "/",
  display: "standalone",
  background_color: "#0b1120",
  theme_color: "#2563eb",
  icons: [
    { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
    { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
  ],
};

const DESIRED_SCRIPTS = {
  lint: "eslint . --max-warnings=0",
  "type-check": "tsc --noEmit",
  check: "npm run lint && npm run type-check",
  ci: "npm run check && npm run build",
  "prepare:deployment": "node ../fix-deployment-blockers.js",
};

const SUMMARY = [];

function ensureDirExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    SUMMARY.push(["created", path.relative(rootDir, dirPath)]);
  }
}

function writeFileIfChanged(targetPath, content) {
  const current = fs.existsSync(targetPath)
    ? fs.readFileSync(targetPath, "utf8")
    : null;
  if (current !== content) {
    fs.writeFileSync(targetPath, content, "utf8");
    SUMMARY.push([current ? "updated" : "created", path.relative(rootDir, targetPath)]);
  }
}

function ensureManifest() {
  const manifestPath = path.join(appDir, "manifest.json");
  ensureDirExists(appDir);
  if (!fs.existsSync(manifestPath)) {
    writeFileIfChanged(manifestPath, JSON.stringify(DEFAULT_MANIFEST, null, 2) + "\n");
    return;
  }

  try {
    const raw = fs.readFileSync(manifestPath, "utf8");
    const json = JSON.parse(raw);
    let mutated = false;
    for (const [key, value] of Object.entries(DEFAULT_MANIFEST)) {
      if (key === "icons") {
        continue;
      }
      if (json[key] !== value) {
        json[key] = value;
        mutated = true;
      }
    }

    const iconMap = new Map(
      (json.icons || []).map((icon) => [String(icon.src), icon])
    );
    for (const icon of DEFAULT_MANIFEST.icons) {
      const existing = iconMap.get(icon.src);
      if (!existing) {
        iconMap.set(icon.src, { ...icon });
        mutated = true;
        continue;
      }
      const normalized = { ...existing, ...icon };
      if (JSON.stringify(existing) !== JSON.stringify(normalized)) {
        iconMap.set(icon.src, normalized);
        mutated = true;
      }
    }

    if (mutated) {
      json.icons = Array.from(iconMap.values());
      writeFileIfChanged(
        manifestPath,
        JSON.stringify(json, null, 2) + "\n"
      );
    }
  } catch (error) {
    SUMMARY.push(["error", `manifest.json parse failed: ${error.message}`]);
  }
}

function ensureIcons() {
  ensureDirExists(publicDir);
  for (const [fileName, base64] of Object.entries(ICONS)) {
    const target = path.join(publicDir, fileName);
    if (!fs.existsSync(target)) {
      fs.writeFileSync(target, Buffer.from(base64, "base64"));
      SUMMARY.push(["created", path.relative(rootDir, target)]);
    }
  }
}

function ensureScripts() {
  const packagePath = path.join(dashboardDir, "package.json");
  if (!fs.existsSync(packagePath)) {
    SUMMARY.push(["error", `missing package.json at ${packagePath}`]);
    return;
  }
  const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));
  pkg.scripts = pkg.scripts || {};
  let mutated = false;
  for (const [scriptName, command] of Object.entries(DESIRED_SCRIPTS)) {
    if (pkg.scripts[scriptName] !== command) {
      pkg.scripts[scriptName] = command;
      mutated = true;
    }
  }
  if (mutated) {
    fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + "\n");
    SUMMARY.push(["updated", path.relative(rootDir, packagePath)]);
  }
}

function ensureWorkflow() {
  ensureDirExists(workflowsDir);
  const workflowPath = path.join(workflowsDir, "deployment.yml");
  const desired = `name: Synqra Production Deployment\n\non:\n  push:\n    branches:\n      - main\n  workflow_dispatch:\n\npermissions:\n  contents: read\n\njobs:\n  build:\n    name: Build and Verify\n    runs-on: ubuntu-latest\n    defaults:\n      run:\n        working-directory: noid-dashboard\n\n    steps:\n      - name: Checkout repository\n        uses: actions/checkout@v4\n\n      - name: Setup Node.js\n        uses: actions/setup-node@v4\n        with:\n          node-version: \"20\"\n          cache: \"npm\"\n          cache-dependency-path: noid-dashboard/package-lock.json\n\n      - name: Install dependencies\n        run: npm ci\n\n      - name: Lint\n        run: npm run lint\n\n      - name: Type check\n        run: npm run type-check\n\n      - name: Build\n        run: npm run build\n\n      - name: Upload production artifact\n        uses: actions/upload-artifact@v4\n        with:\n          name: synqra-os-build\n          path: |\n            .next\n            package.json\n            package-lock.json\n`;
  writeFileIfChanged(workflowPath, desired);
}

function main() {
  ensureManifest();
  ensureIcons();
  ensureScripts();
  ensureWorkflow();

  if (SUMMARY.length === 0) {
    console.log("fix-deployment-blockers: no changes required");
    return;
  }

  console.log("fix-deployment-blockers: applied updates");
  for (const [action, target] of SUMMARY) {
    console.log(`  ? ${action.padEnd(8)} ${target}`);
  }
}

main();
