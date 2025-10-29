#!/usr/bin/env node
/*
  Cleanup utility: removes expired files and tidies folders with zero friction.

  Defaults (override via env):
    - EXPIRY_DAYS: number of days for age-based deletion in target dirs (default: 30)
    - DRY_RUN: "1" to only log actions without deleting (default: "0")
    - TARGET_DIRS: comma-separated relative paths to prune by age
      default: export,.vercel/output,coverage,dist,build,out,tmp,temp,logs
    - DELETE_GLOBS_DISABLED: set to "1" to disable filename-pattern cleanup
    - CURSOR_TERMINALS_DIR: absolute path to Cursor terminals dir to prune (optional)

  Safety:
    - Never traverses or deletes inside .git or node_modules
    - Only deletes inside explicitly targeted dirs for age-based pruning
    - Filename-pattern cleanup skips .git and node_modules
*/

import fs from 'fs';
import path from 'path';

const workspaceRoot = process.cwd();
const expiryDays = parseInt(process.env.EXPIRY_DAYS || '30', 10);
const expiryMs = expiryDays * 24 * 60 * 60 * 1000;
const dryRun = (process.env.DRY_RUN || '0') === '1';

const defaultTargetDirs = [
  'export',
  '.vercel/output',
  'coverage',
  'dist',
  'build',
  'out',
  'tmp',
  'temp',
  'logs',
];

const targetDirs = (process.env.TARGET_DIRS || defaultTargetDirs.join(','))
  .split(',')
  .map((d) => d.trim())
  .filter(Boolean);

const deletePatterns = [
  // common backup/temp artifacts
  /^\.\#.*$/,          // Emacs lockfiles
  /#.*#$/,               // Emacs autosave files
  /~$/,                  // tilde backups
  /\.bak(\.[^/]*)?$/i, // backup files
  /\.old(\.[^/]*)?$/i, // old backups
  /\.tmp(\.[^/]*)?$/i, // temp files
  /\.swp$/i,            // Vim swap
  /\.swx$/i,            // Vim swap
  /\.DS_Store$/,        // macOS metadata
  /Thumbs\.db$/i,       // Windows metadata
  /\.orig$/i,           // merge leftovers
  /\.rej$/i,            // patch rejects
];

const isPatternCleanupDisabled = (process.env.DELETE_GLOBS_DISABLED || '0') === '1';

function isIgnoredDir(dirName) {
  return dirName === '.git' || dirName === 'node_modules';
}

function safeStat(p) {
  try {
    return fs.statSync(p);
  } catch {
    return null;
  }
}

function safeLstat(p) {
  try {
    return fs.lstatSync(p);
  } catch {
    return null;
  }
}

function removeFile(filePath) {
  if (dryRun) {
    console.log(`[DRY] delete file: ${path.relative(workspaceRoot, filePath)}`);
    return true;
  }
  try {
    fs.rmSync(filePath, { force: true });
    return true;
  } catch (err) {
    console.warn(`[WARN] failed to delete file: ${filePath} (${(err && err.message) || err})`);
    return false;
  }
}

function removeDirIfEmpty(dirPath) {
  try {
    const entries = fs.readdirSync(dirPath);
    if (entries.length > 0) return false;
    if (dryRun) {
      console.log(`[DRY] remove empty dir: ${path.relative(workspaceRoot, dirPath)}`);
      return true;
    }
    fs.rmdirSync(dirPath);
    return true;
  } catch {
    return false;
  }
}

function walk(dirPath, visitor) {
  let entries;
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      if (isIgnoredDir(entry.name)) continue;
      visitor(full, 'dir');
      walk(full, visitor);
    } else if (entry.isSymbolicLink()) {
      visitor(full, 'symlink');
    } else if (entry.isFile()) {
      visitor(full, 'file');
    }
  }
}

function pruneByAge(targetDir, cutoffMs) {
  const absDir = path.isAbsolute(targetDir)
    ? targetDir
    : path.join(workspaceRoot, targetDir);

  const st = safeStat(absDir);
  if (!st || !st.isDirectory()) return { filesDeleted: 0, dirsRemoved: 0 };

  let filesDeleted = 0;
  let dirsRemoved = 0;

  walk(absDir, (p, kind) => {
    if (kind === 'file') {
      const s = safeStat(p);
      if (!s) return;
      if (Date.now() - s.mtimeMs >= cutoffMs) {
        if (removeFile(p)) filesDeleted += 1;
      }
    } else if (kind === 'symlink') {
      // Remove dead symlinks inside target dir
      try {
        fs.statSync(p);
      } catch {
        if (removeFile(p)) filesDeleted += 1;
      }
    }
  });

  // Attempt to remove any empty directories bottom-up
  // Second pass to clean empties
  const stack = [absDir];
  while (stack.length) {
    const current = stack.pop();
    let subEntries = [];
    try {
      subEntries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const e of subEntries) {
      const full = path.join(current, e.name);
      if (e.isDirectory()) stack.push(full);
    }
    if (current !== absDir && removeDirIfEmpty(current)) dirsRemoved += 1;
  }

  return { filesDeleted, dirsRemoved };
}

function matchesDeletePattern(fileName) {
  return deletePatterns.some((re) => re.test(fileName));
}

function cleanupByPattern(root) {
  if (isPatternCleanupDisabled) return { filesDeleted: 0 };
  let filesDeleted = 0;
  walk(root, (p, kind) => {
    if (kind !== 'file') return;
    const base = path.basename(p);
    if (matchesDeletePattern(base)) {
      if (removeFile(p)) filesDeleted += 1;
    }
  });
  return { filesDeleted };
}

function cleanupDeadSymlinks(root) {
  let filesDeleted = 0;
  walk(root, (p, kind) => {
    if (kind !== 'symlink') return;
    try {
      fs.statSync(p);
    } catch {
      if (removeFile(p)) filesDeleted += 1;
    }
  });
  return { filesDeleted };
}

function maybeCleanupCursorTerminals() {
  const terminalsDir = process.env.CURSOR_TERMINALS_DIR || '/home/ubuntu/.cursor/projects/workspace/terminals';
  const st = safeStat(terminalsDir);
  if (!st || !st.isDirectory()) return { filesDeleted: 0, dirsRemoved: 0 };
  return pruneByAge(terminalsDir, expiryMs);
}

function main() {
  console.log(`[cleanup] starting. expiryDays=${expiryDays} dryRun=${dryRun}`);

  // 1) Age-based pruning in target directories
  let totalFiles = 0;
  let totalDirs = 0;
  for (const d of targetDirs) {
    const { filesDeleted, dirsRemoved } = pruneByAge(d, expiryMs);
    if (filesDeleted || dirsRemoved) {
      console.log(`[cleanup] ${d}: deleted ${filesDeleted} files, removed ${dirsRemoved} empty dirs`);
    }
    totalFiles += filesDeleted;
    totalDirs += dirsRemoved;
  }

  // 2) Filename-pattern cleanup across workspace
  const patternRes = cleanupByPattern(workspaceRoot);
  if (patternRes.filesDeleted) {
    console.log(`[cleanup] filename-patterns: deleted ${patternRes.filesDeleted} files`);
  }
  totalFiles += patternRes.filesDeleted;

  // 3) Dead symlink cleanup
  const deadRes = cleanupDeadSymlinks(workspaceRoot);
  if (deadRes.filesDeleted) {
    console.log(`[cleanup] dead symlinks: deleted ${deadRes.filesDeleted}`);
  }
  totalFiles += deadRes.filesDeleted;

  // 4) Cursor terminals (optional)
  const termRes = maybeCleanupCursorTerminals();
  if (termRes.filesDeleted || termRes.dirsRemoved) {
    console.log(`[cleanup] terminals: deleted ${termRes.filesDeleted} files, removed ${termRes.dirsRemoved} dirs`);
  }
  totalFiles += termRes.filesDeleted;
  totalDirs += termRes.dirsRemoved || 0;

  console.log(`[cleanup] done. Total deleted files=${totalFiles}, removed dirs=${totalDirs}`);
}

main();
