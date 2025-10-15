#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';

function pathExists(targetPath) {
  try {
    fs.accessSync(targetPath);
    return true;
  } catch {
    return false;
  }
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function getNpmCommand() {
  return process.platform === 'win32' ? 'npm.cmd' : 'npm';
}

function titleizeProject(name) {
  const n = (name || '').toLowerCase();
  if (n === 'synqra') return 'Synqra';
  if (n === 'aurafx' || n === 'aura' || n === 'aura-fx') return 'AuraFX';
  return name || 'Project';
}

function resolveCandidateRoots() {
  const roots = [];
  if (process.env.NOID_ROOT) roots.push(process.env.NOID_ROOT);
  if (process.env.OneDrive || process.env.ONEDRIVE) roots.push(process.env.OneDrive || process.env.ONEDRIVE);
  if (process.env.USERPROFILE) roots.push(path.join(process.env.USERPROFILE, 'OneDrive'));
  roots.push(path.join(os.homedir(), 'OneDrive'));
  return Array.from(new Set(roots.filter(Boolean)));
}

function findKnownProjectDir() {
  const roots = resolveCandidateRoots();
  for (const root of roots) {
    const synqraDir = path.join(root, 'Synqra');
    const auraDir = path.join(root, 'AuraFX');
    if (pathExists(path.join(synqraDir, 'package.json'))) {
      return { dir: synqraDir, label: 'Synqra' };
    }
    if (pathExists(path.join(auraDir, 'package.json'))) {
      return { dir: auraDir, label: 'AuraFX' };
    }
  }
  return null;
}

async function run(command, args, options) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', ...options });
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(Object.assign(new Error(`${command} ${args.join(' ')} failed with code ${code}`), { code }));
    });
    child.on('error', reject);
  });
}

async function initAtDirectory(projectDir) {
  const pkgPath = path.join(projectDir, 'package.json');
  const pkg = readJson(pkgPath) || {};
  const label = titleizeProject(pkg.name || path.basename(projectDir));

  console.log('📦 ' + label + ' detected — initializing...');
  await run(getNpmCommand(), ['install'], { cwd: projectDir });

  console.log('⚙️ Running init-config...');
  try {
    await run(getNpmCommand(), ['run', 'init-config'], { cwd: projectDir, env: { ...process.env, PROJECT_NAME: label } });
  } catch (err) {
    console.warn('⚠️ init-config script not found — skipping.');
  }
  console.log('✨ Auto-init complete.');
}

async function main() {
  console.log('🔍 Detecting active NØID project...');
  const found = findKnownProjectDir();
  if (found) {
    await initAtDirectory(found.dir);
    return;
  }

  const allowFallback = process.env.NOID_FALLBACK_TO_CWD === '1' || process.argv.includes('--fallback-cwd');
  if (!allowFallback) {
    const triedRoots = resolveCandidateRoots();
    console.error('❌ No known project folder found under any of: ' + triedRoots.join(', '));
    process.exit(1);
  }

  const cwdPkgPath = path.join(process.cwd(), 'package.json');
  if (!pathExists(cwdPkgPath)) {
    console.error('❌ package.json not found in current directory; cannot fallback.');
    process.exit(1);
  }

  console.log('📁 Falling back to current directory...');
  await initAtDirectory(process.cwd());
}

main().catch((err) => {
  console.error(err?.stack || String(err));
  process.exit(1);
});
