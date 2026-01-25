import assert from "assert";
import { createHmac } from "crypto";
import { generateIdempotencyKey } from "../../lib/jobs/idempotency";
import { calculateBackoff, shouldRetry } from "../../lib/jobs/retry-policy";
import { signJobPayload, verifyJobSignature } from "../../lib/jobs/job-signature";
import { stableStringify } from "../../lib/jobs/stable-stringify";
import { decryptToken, encryptToken } from "../../lib/integrations/google/token-store";

function signWithTimestamp(payload: unknown, timestampSeconds: number, secret: string): string {
  const normalized = stableStringify(payload);
  const base = `${timestampSeconds}.${normalized}`;
  const digest = createHmac("sha256", secret).update(base).digest("hex");
  return `${timestampSeconds}.${digest}`;
}

function run() {
  const keyA = generateIdempotencyKey("audit", { b: 2, a: 1 }, "2026-02-10T00:00:00.000Z");
  const keyB = generateIdempotencyKey("audit", { a: 1, b: 2 }, "2026-02-10T00:00:00.000Z");
  assert.strictEqual(keyA, keyB, "idempotency key should be stable for re-ordered payloads");

  const backoff = calculateBackoff(3, 2, 30);
  assert.ok(backoff >= 8 && backoff <= 30, "backoff should be bounded and exponential");
  assert.strictEqual(shouldRetry("timeout while calling provider", 1, 3), true);
  assert.strictEqual(shouldRetry("validation failed for payload", 1, 3), false);

  const payload = { hello: "world" };
  const secret = "job-signature-secret";
  const signature = signJobPayload(payload, secret);
  assert.strictEqual(verifyJobSignature(payload, signature, secret), true);
  assert.strictEqual(verifyJobSignature({ hello: "changed" }, signature, secret), false);

  const oldTimestamp = Math.floor(Date.now() / 1000) - 601;
  const staleSignature = signWithTimestamp(payload, oldTimestamp, secret);
  assert.strictEqual(verifyJobSignature(payload, staleSignature, secret), false, "stale signature should fail");

  const encryptionKey = "12345678901234567890123456789012";
  const encrypted = encryptToken("refresh-token-abc", encryptionKey);
  const decrypted = decryptToken(encrypted, encryptionKey);
  assert.strictEqual(decrypted, "refresh-token-abc");

  process.stdout.write("automation-libs tests: PASS\n");
}

run();
