#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const extensions = new Set(['.tsx', '.ts', '.jsx', '.js']);
const ignoreDirs = new Set(['node_modules', '.next', 'dist', 'build']);

let filesScanned = 0;
let filesUpdated = 0;

const updatedFiles = [];

function walkDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (!ignoreDirs.has(entry.name)) {
        files.push(...walkDirectory(fullPath));
      }
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (extensions.has(ext)) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

function isIdentifierChar(char) {
  return Boolean(char) && /[A-Za-z0-9_$]/.test(char);
}

function replaceIdentifier(source, from, to) {
  const stack = [{ type: 'code' }];
  const fromLength = from.length;
  let result = '';
  let i = 0;
  let replacements = 0;

  while (i < source.length) {
    const context = stack[stack.length - 1];
    const ch = source[i];
    const next = source[i + 1];

    if (context.type === 'lineComment') {
      result += ch;
      if (ch === '\n') {
        stack.pop();
      }
      i += 1;
      continue;
    }

    if (context.type === 'blockComment') {
      result += ch;
      if (ch === '*' && next === '/') {
        result += next;
        stack.pop();
        i += 2;
      } else {
        i += 1;
      }
      continue;
    }

    if (context.type === 'single') {
      result += ch;
      if (ch === '\\') {
        if (typeof next !== 'undefined') {
          result += next;
        }
        i += 2;
        continue;
      }
      if (ch === "'") {
        stack.pop();
      }
      i += 1;
      continue;
    }

    if (context.type === 'double') {
      result += ch;
      if (ch === '\\') {
        if (typeof next !== 'undefined') {
          result += next;
        }
        i += 2;
        continue;
      }
      if (ch === '"') {
        stack.pop();
      }
      i += 1;
      continue;
    }

    if (context.type === 'template') {
      result += ch;
      if (ch === '\\') {
        if (typeof next !== 'undefined') {
          result += next;
        }
        i += 2;
        continue;
      }
      if (ch === '`') {
        stack.pop();
        i += 1;
        continue;
      }
      if (ch === '$' && next === '{') {
        result += '{';
        stack.push({ type: 'templateExpression', braceDepth: 1 });
        i += 2;
        continue;
      }
      i += 1;
      continue;
    }

    // code or templateExpression context
    if (ch === '/' && next === '/') {
      result += ch + next;
      stack.push({ type: 'lineComment' });
      i += 2;
      continue;
    }
    if (ch === '/' && next === '*') {
      result += ch + next;
      stack.push({ type: 'blockComment' });
      i += 2;
      continue;
    }
    if (ch === "'") {
      result += ch;
      stack.push({ type: 'single' });
      i += 1;
      continue;
    }
    if (ch === '"') {
      result += ch;
      stack.push({ type: 'double' });
      i += 1;
      continue;
    }
    if (ch === '`') {
      result += ch;
      stack.push({ type: 'template' });
      i += 1;
      continue;
    }

    if (context.type === 'templateExpression') {
      if (ch === '{') {
        context.braceDepth += 1;
        result += ch;
        i += 1;
        continue;
      }
      if (ch === '}') {
        context.braceDepth -= 1;
        result += ch;
        i += 1;
        if (context.braceDepth === 0) {
          stack.pop();
        }
        continue;
      }
    }

    if (source.startsWith(from, i)) {
      const prevChar = i > 0 ? source[i - 1] : '';
      const nextChar = source[i + fromLength] ?? '';
      if (!isIdentifierChar(prevChar) && !isIdentifierChar(nextChar)) {
        result += to;
        replacements += 1;
        i += fromLength;
        continue;
      }
    }

    result += ch;
    i += 1;
  }

  return { result, replacements };
}

function formatSpecifierList(original, values, keepTrailingComma) {
  if (values.length === 0) {
    return null;
  }

  if (original.includes('\n')) {
    const indentMatch = original.match(/\n(\s*)\S/);
    const indent = indentMatch ? indentMatch[1] : '  ';
    const lines = values.map((value, index) => {
      const suffix = index < values.length - 1 || keepTrailingComma ? ',' : '';
      return `${indent}${value}${suffix}`;
    });
    return `\n${lines.join('\n')}\n`;
  }

  return ` ${values.join(', ')} `;
}

function transformReactDomImport(content) {
  const reactDomRegex = /import\s*{([^}]*)}\s*from\s*['"]react-dom['"];?/g;
  let changed = false;

  const updated = content.replace(reactDomRegex, (match, specifiers) => {
    const keepTrailingComma = /,\s*$/.test(specifiers);
    const items = specifiers
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    const filtered = items.filter((item) => !/^(useFormState|useActionState)(\s+as\s+\w+)?$/.test(item));

    if (filtered.length === 0) {
      changed = true;
      const trailingNewline = match.endsWith('\n') ? '\n' : '';
      return trailingNewline;
    }

    if (filtered.length === items.length) {
      return match;
    }

    const formatted = formatSpecifierList(specifiers, filtered, keepTrailingComma);
    changed = true;

    const semicolon = match.trimEnd().endsWith(';') ? ';' : '';
    return `import {${formatted ?? ''}} from 'react-dom'${semicolon}`;
  });

  return { content: updated, changed };
}

function updateReactImport(content) {
  const reactImportRegex = /import\s+([^;]*?)\s+from\s+['"]react['"];?/g;
  let changed = false;
  let matchedNamespaceImport = false;

  const updated = content.replace(reactImportRegex, (match, specifiers) => {
    let working = match;
    if (match.includes('useActionState')) {
      return match;
    }

    if (/\*\s+as\s+\w+/.test(specifiers)) {
      matchedNamespaceImport = true;
      return match;
    }

    const hasNamed = match.includes('{');
    if (hasNamed) {
      const openIndex = match.indexOf('{');
      const closeIndex = match.indexOf('}', openIndex);
      const inside = match.slice(openIndex + 1, closeIndex);
      const keepTrailingComma = /,\s*(?:\}|$)/.test(inside);
      const names = inside
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

      if (!names.includes('useActionState')) {
        names.push('useActionState');
        const formatted = formatSpecifierList(inside, names, keepTrailingComma);
        working = `${match.slice(0, openIndex + 1)}${formatted ?? ''}${match.slice(closeIndex)}`;
        changed = true;
      }
      return working;
    }

    // default import only
    const replacement = match.replace(/from\s+['"]react['"]/, `, { useActionState } from 'react'`);
    changed = true;
    return replacement;
  });

  if (matchedNamespaceImport) {
    // If only a namespace import exists, append a separate named import.
    const hasNamedImport = /import[\s\S]*useActionState[\s\S]*from\s+['"]react['"]/m.test(updated);
    if (!hasNamedImport) {
      const insertionIndex = determineImportInsertionIndex(updated);
      const insertion = `import { useActionState } from 'react';\n`;
      const contentWithImport = `${updated.slice(0, insertionIndex)}${insertion}${updated.slice(insertionIndex)}`;
      return { content: contentWithImport, changed: true };
    }
  }

  return { content: updated, changed };
}

function determineImportInsertionIndex(source) {
  const useClientMatch = source.match(/^'use client';\s*\n/);
  if (useClientMatch) {
    return useClientMatch[0].length;
  }
  return 0;
}

function ensureUseActionStateImport(content) {
  if (!content.includes('useActionState')) {
    return { content, changed: false };
  }

  const hasImport = /import[\s\S]*useActionState[\s\S]*from\s+['"]react['"]/m.test(content);
  if (hasImport) {
    return { content, changed: false };
  }

  const insertionIndex = determineImportInsertionIndex(content);
  const insertion = `import { useActionState } from 'react';\n`;
  return {
    content: `${content.slice(0, insertionIndex)}${insertion}${content.slice(insertionIndex)}`,
    changed: true,
  };
}

function createBackup(filePath) {
  const base = `${filePath}.bak`;
  let candidate = base;
  let counter = 0;

  while (fs.existsSync(candidate)) {
    counter += 1;
    candidate = `${base}.${counter}`;
  }

  fs.copyFileSync(filePath, candidate);
  return candidate;
}

function processFile(filePath) {
  filesScanned += 1;
  const content = fs.readFileSync(filePath, 'utf8');

  if (!content.includes('useFormState')) {
    return;
  }

  let updated = content;
  let mutated = false;

  const reactDomResult = transformReactDomImport(updated);
  if (reactDomResult.changed) {
    updated = reactDomResult.content;
    mutated = true;
    if (process.env.DEBUG_USEFORMSTATE === '1') {
      console.log(`   ↺ Updated react-dom import in ${path.relative(projectRoot, filePath)}`);
    }
  }

  const reactImportResult = updateReactImport(updated);
  if (reactImportResult.changed) {
    updated = reactImportResult.content;
    mutated = true;
  }

  const ensureImportResult = ensureUseActionStateImport(updated);
  if (ensureImportResult.changed) {
    updated = ensureImportResult.content;
    mutated = true;
  }

  const replacementResult = replaceIdentifier(updated, 'useFormState', 'useActionState');
  if (replacementResult.replacements > 0) {
    updated = replacementResult.result;
    mutated = true;
  }

  if (!mutated || updated === content) {
    return;
  }

  updated = updated.replace(/\n{3,}/g, '\n\n');

  const backupPath = createBackup(filePath);
  fs.writeFileSync(filePath, updated, 'utf8');

  filesUpdated += 1;
  const relativePath = path.relative(projectRoot, filePath);
  const relativeBackup = path.relative(projectRoot, backupPath);
  updatedFiles.push(relativePath);
  console.log(`✅ Updated: ${relativePath} (backup: ${relativeBackup})`);
  console.log(`   Replaced ${replacementResult.replacements} occurrence(s)`);
}

function main() {
  console.log('🔍 Scanning for useFormState usage...\n');

  const files = walkDirectory(projectRoot);
  for (const file of files) {
    processFile(file);
  }

  console.log(`\n📊 Files scanned: ${filesScanned}`);
  console.log(`✅ Files updated: ${filesUpdated}`);

  if (filesUpdated === 0) {
    console.log('ℹ️  No files needed updating.');
  } else {
    console.log('\n🗂️  Updated files:');
    for (const file of updatedFiles) {
      console.log(`   - ${file}`);
    }
  }

  console.log('\n🎉 Migration complete!');
}

try {
  main();
} catch (error) {
  console.error('❌ Migration failed:', error);
  process.exitCode = 1;
}
