#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

function ensureEnvLocal(projectName) {
  const envPath = path.resolve(process.cwd(), '.env.local');
  const lines = [];

  if (fs.existsSync(envPath)) {
    const existing = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
    for (const line of existing) {
      const trimmed = line.trim();
      if (trimmed.length > 0 && !trimmed.startsWith('#')) lines.push(line);
    }
  }

  const desired = {
    NEXT_PUBLIC_APP_NAME: projectName || 'Synqra',
    NEXT_TELEMETRY_DISABLED: '1',
  };

  const map = new Map();
  for (const line of lines) {
    const idx = line.indexOf('=');
    if (idx > 0) {
      const key = line.slice(0, idx).trim();
      map.set(key, line.slice(idx + 1));
    }
  }

  for (const [key, value] of Object.entries(desired)) {
    if (!map.has(key)) {
      map.set(key, value);
    }
  }

  const output = Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');

  fs.writeFileSync(envPath, `${output}\n`);
  console.log(`Wrote ${envPath}`);
}

function main() {
  const projectName = process.env.PROJECT_NAME || 'Synqra';
  ensureEnvLocal(projectName);
}

main();
