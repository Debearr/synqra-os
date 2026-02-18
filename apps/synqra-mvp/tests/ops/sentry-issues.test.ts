import assert from "node:assert/strict";

import { loadRecentSentryIssues } from "@/lib/ops/sentry";

async function testMissingToken() {
  const original = {
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
    token: process.env.SENTRY_AUTH_TOKEN,
  };
  delete process.env.SENTRY_ORG;
  delete process.env.SENTRY_PROJECT;
  delete process.env.SENTRY_AUTH_TOKEN;

  const result = await loadRecentSentryIssues(5);
  assert.equal(result.configured, false);
  assert.equal(result.issues.length, 0);

  process.env.SENTRY_ORG = original.org;
  process.env.SENTRY_PROJECT = original.project;
  process.env.SENTRY_AUTH_TOKEN = original.token;
}

async function testNetworkFailure() {
  const originalFetch = global.fetch;
  process.env.SENTRY_ORG = "org";
  process.env.SENTRY_PROJECT = "project";
  process.env.SENTRY_AUTH_TOKEN = "token";

  global.fetch = async () => {
    throw new Error("network down");
  };

  const result = await loadRecentSentryIssues(5);
  assert.equal(result.configured, false);
  assert.equal(result.issues.length, 0);

  global.fetch = originalFetch;
}

async function run() {
  await testMissingToken();
  await testNetworkFailure();
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

