import { createHmac, timingSafeEqual } from "crypto";
import { stableStringify } from "@/lib/jobs/stable-stringify";

const MAX_SIGNATURE_AGE_SECONDS = 300;

function signValue(payload: unknown, timestampSeconds: number, secret: string): Buffer {
  const normalized = stableStringify(payload);
  const base = `${timestampSeconds}.${normalized}`;
  return createHmac("sha256", secret).update(base).digest();
}

export function signJobPayload(payload: unknown, secret: string): string {
  const timestampSeconds = Math.floor(Date.now() / 1000);
  const digest = signValue(payload, timestampSeconds, secret).toString("hex");
  return `${timestampSeconds}.${digest}`;
}

export function verifyJobSignature(payload: unknown, signature: string, secret: string): boolean {
  if (!signature || !secret) return false;
  const [rawTimestamp, rawDigest] = signature.split(".");
  if (!rawTimestamp || !rawDigest) return false;

  const timestampSeconds = Number(rawTimestamp);
  if (!Number.isFinite(timestampSeconds)) return false;

  const nowSeconds = Math.floor(Date.now() / 1000);
  const age = Math.abs(nowSeconds - timestampSeconds);
  if (age > MAX_SIGNATURE_AGE_SECONDS) {
    return false;
  }

  const expected = signValue(payload, timestampSeconds, secret);
  const provided = Buffer.from(rawDigest, "hex");
  if (provided.length !== expected.length) return false;
  return timingSafeEqual(expected, provided);
}
