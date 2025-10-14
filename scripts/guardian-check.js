#!/usr/bin/env node
/* eslint-disable no-console */
import https from 'https';
import { URL } from 'url';

const urls = (process.env.URLS || 'https://synqra.co,https://www.synqra.co')
  .split(',')
  .map(u => u.trim())
  .filter(Boolean);

const maxRedirects = 10;
const timeoutMs = parseInt(process.env.TIMEOUT_MS || '120000', 10); // 2 minutes total per URL
const retries = parseInt(process.env.RETRIES || '60', 10); // total attempts
const intervalMs = parseInt(process.env.INTERVAL_MS || '5000', 10);

function fetchOnce(targetUrl, redirectCount = 0) {
  return new Promise((resolve) => {
    const u = new URL(targetUrl);
    const req = https.request({
      hostname: u.hostname,
      path: u.pathname + u.search,
      protocol: u.protocol,
      method: 'GET',
      timeout: 15000,
      headers: { 'User-Agent': 'guardian-check/1.0' },
    }, (res) => {
      const { statusCode, headers } = res;
      if (statusCode >= 300 && statusCode < 400 && headers.location && redirectCount < maxRedirects) {
        const nextUrl = new URL(headers.location, targetUrl).toString();
        resolve(fetchOnce(nextUrl, redirectCount + 1));
      } else {
        resolve({ statusCode, finalUrl: targetUrl });
      }
    });
    req.on('error', () => resolve({ statusCode: 0, finalUrl: targetUrl }));
    req.on('timeout', () => {
      req.destroy(new Error('timeout'));
      resolve({ statusCode: 0, finalUrl: targetUrl });
    });
    req.end();
  });
}

async function untilOk(u) {
  const deadline = Date.now() + timeoutMs;
  let attempt = 0;
  while (Date.now() < deadline && attempt < retries) {
    attempt += 1;
    const { statusCode, finalUrl } = await fetchOnce(u);
    console.log(`[${u}] attempt ${attempt}: ${statusCode}`);
    if (statusCode === 200) return true;
    await new Promise(r => setTimeout(r, intervalMs));
  }
  return false;
}

(async () => {
  const results = await Promise.all(urls.map(untilOk));
  const allOk = results.every(Boolean);
  console.log(`Overall: ${allOk ? 'SUCCESS' : 'FAILURE'}`);
  process.exit(allOk ? 0 : 1);
})();
