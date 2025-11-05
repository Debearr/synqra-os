#!/usr/bin/env node

const fs = require('fs/promises');
const path = require('path');
const { setTimeout: delay } = require('timers/promises');
const { createClient } = require('@supabase/supabase-js');

const REQUIRED_ENV = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const CIRCUIT_BREAKER_THRESHOLD = 3;
const CIRCUIT_BREAKER_COOLDOWN_MS = 15 * 60 * 1000; // 15 minutes
const STRATEGY_TIMEOUT_MS = 10_000;
const GLOBAL_TIMEOUT_MS = 120_000;
const BACKOFF_DELAYS_MS = [1_000, 2_000, 4_000];
const STATE_VARIABLE = 'SUPABASE_HEALTH_STATE';
const DATA_DIR = path.resolve(__dirname, '.healthcell');
const STATE_FILE = path.join(DATA_DIR, 'state.json');

const abortGlobalTimer = setTimeout(() => {
  console.error('💥 Global timeout exceeded');
  process.exit(1);
}, GLOBAL_TIMEOUT_MS);

process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled rejection:', error);
  clearTimeout(abortGlobalTimer);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error);
  clearTimeout(abortGlobalTimer);
  process.exit(1);
});

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true }).catch(() => {});
}

function validateEnv() {
  const missing = REQUIRED_ENV.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    console.error(`❌ Missing environment variables: ${missing.join(', ')}`);
    console.error('ℹ️ Please configure these secrets in GitHub → Settings → Secrets and variables → Actions.');
    process.exit(1);
  }
}

async function loadRemoteState() {
  const token = process.env.GITHUB_TOKEN;
  const repository = process.env.GITHUB_REPOSITORY;
  if (!token || !repository) {
    return null;
  }

  const url = `https://api.github.com/repos/${repository}/actions/variables/${STATE_VARIABLE}`;
  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
      },
    });

    if (response.status === 200) {
      const body = await response.json();
      return JSON.parse(body.value || '{}');
    }

    if (response.status === 404) {
      return null;
    }

    console.warn(`⚠️ Unable to load GitHub variable (status ${response.status})`);
    return null;
  } catch (error) {
    console.warn(`⚠️ Failed to load GitHub variable: ${error.message}`);
    return null;
  }
}

async function saveRemoteState(state) {
  const token = process.env.GITHUB_TOKEN;
  const repository = process.env.GITHUB_REPOSITORY;
  if (!token || !repository) {
    return false;
  }

  const payload = {
    name: STATE_VARIABLE,
    value: JSON.stringify(state),
  };

  try {
    const updateUrl = `https://api.github.com/repos/${repository}/actions/variables/${STATE_VARIABLE}`;
    const updateResponse = await fetch(updateUrl, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (updateResponse.status === 200) {
      return true;
    }

    if (updateResponse.status === 404) {
      const createUrl = `https://api.github.com/repos/${repository}/actions/variables`;
      const createResponse = await fetch(createUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (createResponse.status === 201) {
        return true;
      }

      console.warn(`⚠️ Failed to create GitHub variable (status ${createResponse.status})`);
      return false;
    }

    console.warn(`⚠️ Failed to update GitHub variable (status ${updateResponse.status})`);
    return false;
  } catch (error) {
    console.warn(`⚠️ Unable to persist GitHub variable: ${error.message}`);
    return false;
  }
}

async function loadLocalState() {
  try {
    const raw = await fs.readFile(STATE_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
}

async function saveLocalState(state) {
  await ensureDataDir();
  await fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2));
}

async function loadState() {
  const remote = await loadRemoteState();
  if (remote) {
    return remote;
  }
  const local = await loadLocalState();
  if (local) {
    return local;
  }
  return {
    failureCount: 0,
    lastFailure: null,
    lastSuccess: null,
    lastSuccessMethod: null,
  };
}

async function persistState(state) {
  await saveLocalState(state);
  await saveRemoteState(state);
}

function withTimeout(promiseFactory, timeoutMs) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`Timeout after ${timeoutMs}ms`));
    }, timeoutMs);

    promiseFactory()
      .then((value) => {
        clearTimeout(timeoutId);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}

function createSupabaseClient() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });
}

async function healthCheck1() {
  const url = new URL('/rest/v1/', process.env.SUPABASE_URL).toString();
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await withTimeout(() => fetch(url, {
        headers: {
          apikey: process.env.SUPABASE_ANON_KEY,
        },
      }), STRATEGY_TIMEOUT_MS);

      if (response.ok) {
        return { success: true, method: 'HTTP Ping', details: `Status ${response.status}` };
      }

      throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      if (attempt === 2) {
        throw error;
      }
      await delay(2_000);
    }
  }
  throw new Error('HTTP ping retries exhausted');
}

async function healthCheck2() {
  const client = createSupabaseClient();
  const { data, error } = await withTimeout(() => client
    .from(process.env.SUPABASE_HEALTH_TABLE || 'health_check')
    .select('count').limit(1), STRATEGY_TIMEOUT_MS);

  if (error) {
    throw new Error(`Direct query failed: ${error.message}`);
  }

  return { success: true, method: 'Direct Query', details: `Rows: ${Array.isArray(data) ? data.length : 'unknown'}` };
}

async function healthCheck3() {
  const url = new URL('/rest/v1/', process.env.SUPABASE_URL).toString();
  const response = await withTimeout(() => fetch(url, {
    method: 'HEAD',
    headers: {
      apikey: process.env.SUPABASE_ANON_KEY,
    },
  }), STRATEGY_TIMEOUT_MS);

  return { success: response.status === 200, method: 'REST HEAD', details: `Status ${response.status}` };
}

async function healthCheck4() {
  const url = new URL('/auth/v1/health', process.env.SUPABASE_URL).toString();
  const response = await withTimeout(() => fetch(url, {
    headers: {
      apikey: process.env.SUPABASE_ANON_KEY,
    },
  }), STRATEGY_TIMEOUT_MS);

  if (!response.ok) {
    throw new Error(`Auth health returned ${response.status}`);
  }

  return { success: true, method: 'Auth Health', details: `Status ${response.status}` };
}

async function healthCheck5() {
  const client = createSupabaseClient();
  const { error, data } = await withTimeout(() => client.rpc('version'), STRATEGY_TIMEOUT_MS);

  if (error) {
    throw new Error(`RPC version failed: ${error.message}`);
  }

  return { success: true, method: 'RPC Version', details: `Response: ${JSON.stringify(data)}` };
}

async function robustHealthCheck() {
  const strategies = [
    healthCheck1,
    healthCheck2,
    healthCheck3,
    healthCheck4,
    healthCheck5,
  ];

  const results = [];

  for (let i = 0; i < strategies.length; i += 1) {
    const strategy = strategies[i];

    if (i > 0) {
      const wait = BACKOFF_DELAYS_MS[Math.min(i - 1, BACKOFF_DELAYS_MS.length - 1)];
      console.log(`⏳ Waiting ${wait / 1000}s before next strategy...`);
      await delay(wait);
    }

    try {
      const result = await Promise.race([
        strategy(),
        delay(STRATEGY_TIMEOUT_MS).then(() => {
          throw new Error('Timeout');
        }),
      ]);

      results.push({ ...result, success: Boolean(result.success) });

      if (result.success) {
        console.log(`✅ Success via ${result.method}`);
        return { success: true, results };
      }

      console.warn(`⚠️ ${result.method} did not succeed`);
    } catch (error) {
      console.warn(`❌ Strategy ${strategy.name} failed: ${error.message}`);
      results.push({ success: false, method: strategy.name, error: error.message });
    }
  }

  return { success: false, results };
}

async function main() {
  validateEnv();
  await ensureDataDir();

  const state = await loadState();
  const now = Date.now();

  if (state.lastSuccess && now - state.lastSuccess < CACHE_TTL_MS) {
    const remaining = CACHE_TTL_MS - (now - state.lastSuccess);
    console.log(`🟢 Using cached success from ${new Date(state.lastSuccess).toISOString()} (method: ${state.lastSuccessMethod}).`);
    console.log(`⏳ Cache valid for another ${(remaining / 1000).toFixed(0)}s.`);
    clearTimeout(abortGlobalTimer);
    process.exit(0);
  }

  if (state.failureCount >= CIRCUIT_BREAKER_THRESHOLD && state.lastFailure && (now - state.lastFailure) < CIRCUIT_BREAKER_COOLDOWN_MS) {
    const waitMs = CIRCUIT_BREAKER_COOLDOWN_MS - (now - state.lastFailure);
    console.error('🚫 Circuit breaker open - skipping health checks to reduce load.');
    console.error(`🕒 Retry automatically in ${(waitMs / 1000 / 60).toFixed(1)} minutes or reset the variable ${STATE_VARIABLE}.`);
    clearTimeout(abortGlobalTimer);
    process.exit(1);
  }

  console.log('🚀 Starting Supabase health check with 5 fallback strategies...');

  const { success, results } = await robustHealthCheck();

  if (success) {
    const winning = results.find((r) => r.success);
    const updatedState = {
      failureCount: 0,
      lastFailure: null,
      lastSuccess: now,
      lastSuccessMethod: winning?.method || null,
      lastResults: results,
    };
    await persistState(updatedState);
    clearTimeout(abortGlobalTimer);
    process.exit(0);
  }

  const updatedState = {
    failureCount: (state.failureCount || 0) + 1,
    lastFailure: now,
    lastSuccess: state.lastSuccess || null,
    lastSuccessMethod: state.lastSuccessMethod || null,
    lastResults: results,
  };

  await persistState(updatedState);

  console.error('❌ All strategies failed. Aggregated results:');
  for (const result of results) {
    console.error(` - ${result.method || 'Unknown'}: ${result.error || result.details || 'failed'}`);
  }

  clearTimeout(abortGlobalTimer);
  process.exit(1);
}

main().catch((error) => {
  console.error('💥 Unexpected error:', error);
  clearTimeout(abortGlobalTimer);
  process.exit(1);
});

