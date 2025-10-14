#!/usr/bin/env node

// Guardian Check Script
// Purpose: Probe a URL with retries and simple content/status assertions.
// Usage: node scripts/guardian-check.js --url <URL> [--expect-status 200] [--expect-text "ok"] [--retries 5] [--retry-delay-ms 2000] [--timeout-ms 10000] [--method GET] [--headers '{"Accept":"text/html"}'] [--json] [--verbose]

const HELP_TEXT = `Guardian Check

Usage:
  node scripts/guardian-check.js --url <URL> [options]

Options:
  --url <URL>                 Target URL (or GUARDIAN_URL env)
  --method <METHOD>           HTTP method to use (default: GET)
  --headers <JSON>            JSON object of headers
  --expect-status <CODE>      Expected HTTP status (default: 200)
  --expect-text <STRING>      Expected substring in response body
  --expect-not-text <STRING>  Substring that must NOT appear in response
  --timeout-ms <MS>           Request timeout per attempt (default: 10000)
  --retries <N>               Number of retries after first attempt (default: 3)
  --retry-delay-ms <MS>       Delay between attempts (default: 2000)
  --json                      Output JSON result only
  --verbose                   Print verbose logs
  --help                      Show this help
`;

function parseArgs(argv) {
  const args = {};
  const rest = [];
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token.startsWith('--')) {
      const [rawKey, maybeVal] = token.slice(2).split('=');
      const key = rawKey.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      if (maybeVal !== undefined) {
        args[key] = maybeVal;
      } else {
        const next = argv[i + 1];
        if (next && !next.startsWith('--')) {
          args[key] = next;
          i += 1;
        } else {
          args[key] = true;
        }
      }
    } else {
      rest.push(token);
    }
  }
  if (!args.url && rest.length > 0) {
    args.url = rest[0];
  }
  return args;
}

function toInt(value, defaultValue) {
  if (value === undefined || value === null || value === '') return defaultValue;
  const n = Number.parseInt(String(value), 10);
  return Number.isNaN(n) ? defaultValue : n;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function ensureFetch() {
  if (typeof fetch !== 'undefined') return fetch;
  // Fallback for older Node versions
  const mod = await import('node-fetch');
  return mod.default;
}

async function run() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    console.log(HELP_TEXT);
    process.exit(0);
  }

  const url = args.url || process.env.GUARDIAN_URL;
  const method = (args.method || 'GET').toUpperCase();
  const expectStatus = toInt(args.expectStatus, 200);
  const expectText = args.expectText !== undefined ? String(args.expectText) : undefined;
  const expectNotText = args.expectNotText !== undefined ? String(args.expectNotText) : undefined;
  const timeoutMs = toInt(args.timeoutMs, 10_000);
  const retries = toInt(args.retries, 3);
  const retryDelayMs = toInt(args.retryDelayMs, 2000);
  const outputJson = Boolean(args.json);
  const verbose = Boolean(args.verbose);

  if (!url) {
    const message = 'Missing --url (or GUARDIAN_URL env). Use --help for usage.';
    if (outputJson) {
      console.log(JSON.stringify({ ok: false, error: message }));
    } else {
      console.error(message);
      console.error();
      console.error(HELP_TEXT);
    }
    process.exit(2);
  }

  let headers = { 'User-Agent': 'guardian-check/1.0 (+node)' };
  if (args.headers) {
    try {
      const parsed = JSON.parse(args.headers);
      if (parsed && typeof parsed === 'object') headers = { ...headers, ...parsed };
    } catch (e) {
      // If headers JSON invalid, keep default and proceed
      if (verbose) console.error('Invalid --headers JSON, ignoring:', e.message);
    }
  }

  const body = args.body !== undefined ? String(args.body) : undefined;

  const doFetch = await ensureFetch();

  const attemptOnce = async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await doFetch(url, {
        method,
        headers,
        body,
        redirect: 'follow',
        signal: controller.signal,
      });

      const responseText = await response.text();

      const statusOk = expectStatus === undefined ? true : response.status === expectStatus;
      const textOk = expectText === undefined ? true : responseText.includes(expectText);
      const notTextOk = expectNotText === undefined ? true : !responseText.includes(expectNotText);

      const ok = statusOk && textOk && notTextOk;

      return {
        ok,
        status: response.status,
        statusOk,
        textOk,
        notTextOk,
        bodyPreview: responseText.length > 512 ? responseText.slice(0, 512) + '…' : responseText,
      };
    } catch (error) {
      return { ok: false, error: error && (error.reason || error.message || String(error)) };
    } finally {
      clearTimeout(timeout);
    }
  };

  let lastResult = null;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    if (verbose) console.error(`[guardian] Attempt ${attempt + 1}/${retries + 1} → ${url}`);

    // eslint-disable-next-line no-await-in-loop
    const result = await attemptOnce();
    lastResult = result;

    if (result.ok) {
      if (outputJson) {
        console.log(
          JSON.stringify({
            ok: true,
            url,
            method,
            status: result.status,
            contains: expectText || null,
            excludes: expectNotText || null,
          })
        );
      } else {
        console.log(`Guardian OK: ${url} [status=${result.status}]`);
        if (expectText) console.log(`  contains: ${expectText}`);
        if (expectNotText) console.log(`  excludes: ${expectNotText}`);
      }
      process.exit(0);
    }

    if (attempt < retries) {
      if (verbose) console.error(`[guardian] Failed (will retry in ${retryDelayMs}ms)`);
      // eslint-disable-next-line no-await-in-loop
      await sleep(retryDelayMs);
    }
  }

  // If we reach here, last attempt failed
  const errPayload = {
    ok: false,
    url,
    method,
    expectedStatus: expectStatus,
    status: lastResult && lastResult.status,
    statusOk: lastResult && lastResult.statusOk,
    textOk: lastResult && lastResult.textOk,
    notTextOk: lastResult && lastResult.notTextOk,
    error: lastResult && lastResult.error,
  };

  if (outputJson) {
    console.log(JSON.stringify(errPayload));
  } else {
    console.error('Guardian FAILED:', errPayload);
    if (lastResult && lastResult.bodyPreview) {
      console.error('\nResponse preview:\n');
      console.error(lastResult.bodyPreview);
    }
  }
  process.exit(1);
}

run().catch((err) => {
  console.error('Guardian crashed:', err && (err.stack || err.message || String(err)));
  process.exit(1);
});
