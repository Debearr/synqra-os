import { NextRequest } from "next/server";
import { verifyJobSignature } from "@/lib/jobs/job-signature";

const SIGNATURE_HEADERS = ["x-job-signature", "x-internal-signature"] as const;

export function getInternalSigningSecret(): string {
  const secret = process.env.INTERNAL_JOB_SIGNING_SECRET?.trim();
  if (!secret) {
    throw new Error("INTERNAL_JOB_SIGNING_SECRET is not configured");
  }
  return secret;
}

export function verifyInternalSignedRequest(request: NextRequest, body: unknown): { ok: true } | { ok: false; error: string } {
  const signature = SIGNATURE_HEADERS.map((header) => request.headers.get(header)?.trim()).find(Boolean);
  if (!signature) {
    return {
      ok: false,
      error: `Missing signature header (${SIGNATURE_HEADERS.join(" or ")})`,
    };
  }

  const secret = process.env.INTERNAL_JOB_SIGNING_SECRET?.trim();
  if (!secret) {
    return { ok: false, error: "INTERNAL_JOB_SIGNING_SECRET is not configured" };
  }

  const valid = verifyJobSignature(body, signature, secret);
  if (!valid) {
    return { ok: false, error: "Invalid or expired internal signature" };
  }

  return { ok: true };
}

export type InternalRequestVerification = {
  valid: boolean;
  error?: string;
  signature?: string;
  userId: string | null;
};

export function verifyInternalRequest(request: NextRequest, body: unknown): InternalRequestVerification {
  const signature = SIGNATURE_HEADERS.map((header) => request.headers.get(header)?.trim()).find(Boolean) ?? undefined;
  const verification = verifyInternalSignedRequest(request, body);
  if (!verification.ok) {
    return {
      valid: false,
      error: verification.error,
      signature,
      userId: null,
    };
  }

  const bodyRecord = body && typeof body === "object" ? (body as Record<string, unknown>) : null;
  const bodyUserId =
    (typeof bodyRecord?.userId === "string" && bodyRecord.userId.trim()) ||
    (typeof bodyRecord?.user_id === "string" && bodyRecord.user_id.trim()) ||
    null;
  const headerUserId = request.headers.get("x-user-id")?.trim() || null;

  return {
    valid: true,
    signature,
    userId: bodyUserId || headerUserId || null,
  };
}
