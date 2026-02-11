import { createHash } from "crypto";

export function hashPayload(payload: unknown): string {
  const json = JSON.stringify(payload ?? {});
  return createHash("sha256").update(json).digest("hex");
}

export function buildPostingIdempotencyKey(input: {
  jobId: string;
  platform: string;
  variantId?: string;
  payload: unknown;
}): string {
  const payloadHash = hashPayload(input.payload);
  const base = `${input.jobId}:${input.platform}:${input.variantId || ""}:${payloadHash}`;
  return createHash("sha256").update(base).digest("hex");
}
