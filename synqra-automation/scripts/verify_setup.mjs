/**
 * 🔍 Synqra Pre-Flight Verifier
 * Checks: .env keys ▸ Supabase tables ▸ API reachability
 */

import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const log = (msg) => console.log('🧩', msg);

// ---------- 1️⃣  ENV CHECK ----------
const required = [
  'SUPABASE_URL',
  'SUPABASE_KEY',
  'OPENAI_API_KEY',
  'TWITTER_BEARER',
  'TIKTOK_ACCESS_TOKEN'
];

const missing = required.filter((key) => !process.env[key]);

if (missing.length) {
  log(`❌ Missing environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

log('✅  All .env keys found.');

// ---------- 2️⃣  SUPABASE TABLE CHECK ----------
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const tables = ['content_queue', 'calendar_posts', 'post_metrics'];

for (const table of tables) {
  const { error } = await sb.from(table).select('id').limit(1);
  if (error) {
    log(`❌ Table '${table}' not found → run  supabase/sql/content_tables.sql`);
    process.exit(1);
  }
  log(`✅  Table '${table}' verified.`);
}

// ---------- 3️⃣  API CONNECTIVITY ----------
async function ping(url, headerName, token) {
  if (!token) {
    log(`❌  Token missing for ${url}`);
    return;
  }

  try {
    const response = await fetch(url, {
      headers: { [headerName]: `Bearer ${token}` }
    });

    if (response.status < 400) {
      log(`✅  ${url} reachable.`);
    } else {
      log(`⚠️  ${url} returned ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    log(`❌  Unable to reach ${url} (${error.message})`);
  }
}

await ping('https://api.twitter.com/2/users/me', 'Authorization', process.env.TWITTER_BEARER);
await ping('https://open.tiktokapis.com/v2/user/info/', 'Authorization', process.env.TIKTOK_ACCESS_TOKEN);

// ---------- 4️⃣  LOG RESULT ----------
const logsDir = path.resolve('/Logs');

try {
  fs.mkdirSync(logsDir, { recursive: true });
} catch (error) {
  log(`⚠️  Unable to create logs directory at ${logsDir}: ${error.message}`);
}

const logPath = path.join(logsDir, 'verification.log');
fs.writeFileSync(logPath, `Verified at ${new Date().toISOString()}\n`, { flag: 'a' });

log(`✅  Verification complete — ready for automation. Logged to ${logPath}`);
