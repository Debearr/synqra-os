#!/usr/bin/env node
/**
 * Synqra deployment pre-flight utility.
 *
 * - Verifies `.env` and `.env.template` parity for GitHub Actions usage
 * - Hydrates missing public assets (favicon, manifest, metadata)
 * - Reports actionable guidance without mutating existing valid files
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const noidDashboardDir = path.join(rootDir, 'noid-dashboard');
const publicDir = path.join(noidDashboardDir, 'public');

const requiredEnvKeys = [
  'LINKEDIN_ACCESS_TOKEN',
  'LINKEDIN_PERSON_URN',
  'POST_AS',
  'TIMEZONE',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_KEY',
  'N8N_WEBHOOK_URL',
];

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);
  const entries = new Map();

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const equalsIndex = trimmed.indexOf('=');
    if (equalsIndex === -1) continue;
    const key = trimmed.slice(0, equalsIndex).trim();
    const value = trimmed.slice(equalsIndex + 1).trim();
    entries.set(key, value);
  }

  return entries;
}

function ensureEnvParity() {
  const envPath = path.join(rootDir, '.env');
  const templatePath = path.join(rootDir, '.env.template');

  const envEntries = readEnvFile(envPath);
  const templateEntries = readEnvFile(templatePath);

  if (!templateEntries) {
    throw new Error('Missing `.env.template`. Create one from `.env` before deploying.');
  }

  const missingInTemplate = [];
  const missingInEnv = [];

  for (const key of requiredEnvKeys) {
    if (!templateEntries.has(key)) {
      missingInTemplate.push(key);
    }
    if (envEntries && !envEntries.has(key)) {
      missingInEnv.push(key);
    }
  }

  if (missingInTemplate.length || missingInEnv.length) {
    const errorLines = [];
    if (missingInTemplate.length) {
      errorLines.push(`Add the following keys to .env.template so GitHub Actions can inject them: ${missingInTemplate.join(', ')}`);
    }
    if (missingInEnv.length) {
      errorLines.push(`Your local .env is missing keys: ${missingInEnv.join(', ')}`);
    }
    throw new Error(errorLines.join('\n'));
  }
}

function copyFile(source, destination) {
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
}

function writeJsonFile(destination, data) {
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function ensurePublicAssets() {
  if (!fs.existsSync(publicDir)) {
    throw new Error('Missing `noid-dashboard/public` directory. The dashboard needs this folder.');
  }

  const checks = [
    {
      filename: 'favicon.ico',
      resolve: () => {
        const target = path.join(publicDir, 'favicon.ico');
        if (fs.existsSync(target)) return { created: false, path: target };

        const appFavicon = path.join(noidDashboardDir, 'app', 'favicon.ico');
        if (fs.existsSync(appFavicon)) {
          copyFile(appFavicon, target);
          return { created: true, path: target, note: 'Copied from app/favicon.ico' };
        }

        throw new Error('Missing favicon.ico in both app/ and public/. Add one to avoid build failures.');
      },
    },
    {
      filename: 'site.webmanifest',
      resolve: () => {
        const target = path.join(publicDir, 'site.webmanifest');
        if (fs.existsSync(target)) return { created: false, path: target };

        writeJsonFile(target, {
          name: 'Synqra Dashboard',
          short_name: 'Synqra',
          start_url: '/',
          display: 'standalone',
          background_color: '#ffffff',
          theme_color: '#111827',
          icons: [
            {
              src: '/favicon.ico',
              sizes: 'any',
              type: 'image/x-icon',
            },
          ],
        });

        return { created: true, path: target, note: 'Generated default web manifest' };
      },
    },
    {
      filename: 'metadata.json',
      resolve: () => {
        const target = path.join(publicDir, 'metadata.json');
        if (fs.existsSync(target)) return { created: false, path: target };

        writeJsonFile(target, {
          title: 'Synqra Dashboard',
          description: 'Operational dashboard surfaces analytics, calendar, and automation insights for Synqra.',
          author: 'Synqra Platform',
          generator: 'fix-deployment-blockers.js',
        });

        return { created: true, path: target, note: 'Generated default metadata stub' };
      },
    },
  ];

  const actions = [];

  for (const check of checks) {
    const outcome = check.resolve();
    actions.push({ filename: check.filename, ...outcome });
  }

  return actions;
}

function logSummary(actions) {
  const created = actions.filter((action) => action.created);
  const skipped = actions.filter((action) => !action.created);

  if (created.length) {
    console.log('? Created missing public assets:');
    for (const action of created) {
      console.log(`  - ${action.filename}: ${action.note || 'created'}`);
    }
  }

  if (skipped.length) {
    console.log('??  Existing public assets verified:');
    for (const action of skipped) {
      console.log(`  - ${action.filename}`);
    }
  }
}

function main() {
  try {
    ensureEnvParity();
    const actions = ensurePublicAssets();
    logSummary(actions);
    console.log('? Deployment blockers resolved.');
  } catch (error) {
    console.error('? Deployment blocker detected:');
    console.error(error.message || error);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  ensureEnvParity,
  ensurePublicAssets,
};
