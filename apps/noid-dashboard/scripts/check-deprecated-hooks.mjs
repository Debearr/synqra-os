#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const deprecatedHooks = ['useFormState'];
const ignoreDirs = new Set(['node_modules', '.next', 'dist', 'build']);

let filesScanned = 0;
let findings = 0;

function shouldSkipFile(name) {
  return name.endsWith('.bak') || name.includes('.bak.');
}

function scanDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (!ignoreDirs.has(entry.name)) {
        scanDirectory(fullPath);
      }
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    if (shouldSkipFile(entry.name)) {
      continue;
    }

    if (!/\.(tsx?|jsx?)$/.test(entry.name)) {
      continue;
    }

    filesScanned += 1;
    const content = fs.readFileSync(fullPath, 'utf8');

    for (const hook of deprecatedHooks) {
      if (content.includes(hook)) {
        const relative = path.relative(projectRoot, fullPath);
        console.error(`❌ Found deprecated ${hook} in: ${relative}`);
        findings += 1;
      }
    }
  }
}

try {
  scanDirectory(projectRoot);

  if (findings > 0) {
    console.error('\n⚠️  Deprecated hooks found! Run: node scripts/fix-useformstate.mjs');
    process.exitCode = 1;
  } else {
    console.log(`✅ No deprecated hooks found. (${filesScanned} file(s) scanned)`);
  }
} catch (error) {
  console.error('❌ Hook check failed:', error);
  process.exitCode = 1;
}
