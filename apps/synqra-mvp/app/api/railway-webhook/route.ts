/**
 * ============================================================
 * RAILWAY WEBHOOK RECEIVER ENDPOINT
 * ============================================================
 * Receives Railway webhook events and bridges to Health Cell
 * 
 * RPRD DNA: Bulletproof, simple, well-logged
 */

import { NextRequest, NextResponse } from "next/server";
import { createHash, createHmac, timingSafeEqual } from "crypto";
import {
  enforceKillSwitch,
  ensureCorrelationId,
  logSafeguard,
  normalizeError,
} from "@/lib/safeguards";

// TODO: Restore when shared railway modules are implemented
// import {
//   verifyWebhookSignature,
//   handleRailwayWebhook,
//   isDuplicateEvent,
//   formatEventForNotification,
//   type RailwayWebhookPayload,
// } from "@/shared/railway/webhook-handler";
// import { bridgeWebhookToHealth, sendEventNotification } from "@/shared/railway/health-bridge";

type RailwayWebhookPayload = {
  eventType: string;
  serviceName: string;
  environment: string;
  deploymentId?: string;
  [key: string]: any;
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_MAX_WEBHOOK_BYTES = 64 * 1024;
const DEFAULT_REPLAY_WINDOW_SECONDS = 300;
const replayFingerprintCache = new Map<string, number>();

function parseTimestampMs(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value > 1_000_000_000_000 ? value : value * 1000;
  }

  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (/^\d+$/.test(trimmed)) {
    const numeric = Number.parseInt(trimmed, 10);
    if (!Number.isFinite(numeric)) return null;
    return numeric > 1_000_000_000_000 ? numeric : numeric * 1000;
  }

  const parsed = Date.parse(trimmed);
  return Number.isNaN(parsed) ? null : parsed;
}

function registerReplayFingerprint(fingerprint: string, windowMs: number): boolean {
  const now = Date.now();
  for (const [key, expiresAt] of replayFingerprintCache.entries()) {
    if (expiresAt <= now) {
      replayFingerprintCache.delete(key);
    }
  }

  const existingExpiry = replayFingerprintCache.get(fingerprint);
  if (existingExpiry && existingExpiry > now) {
    return false;
  }

  replayFingerprintCache.set(fingerprint, now + windowMs);
  return true;
}

function parseSignature(headerValue: string): {
  signature: string;
  timestampMs: number | null;
  timestampRaw: string | null;
} {
  const trimmed = headerValue.trim();
  if (!trimmed) return { signature: "", timestampMs: null, timestampRaw: null };

  if (trimmed.includes(",")) {
    const pairs = trimmed.split(",").map((entry) => entry.trim());
    const record: Record<string, string> = {};
    for (const pair of pairs) {
      const [rawKey, ...rest] = pair.split("=");
      if (!rawKey || rest.length === 0) continue;
      record[rawKey.trim().toLowerCase()] = rest.join("=").trim();
    }

    const signature = record.v1 || record.signature || record.sha256 || "";
    const timestampRaw = record.t || record.timestamp || null;
    return {
      signature,
      timestampMs: parseTimestampMs(timestampRaw),
      timestampRaw,
    };
  }

  if (trimmed.includes("=")) {
    const [key, ...rest] = trimmed.split("=");
    const normalizedKey = key.trim().toLowerCase();
    const value = rest.join("=").trim();
    if (normalizedKey === "t" || normalizedKey === "timestamp") {
      return {
        signature: "",
        timestampMs: parseTimestampMs(value),
        timestampRaw: value,
      };
    }

    return {
      signature: value,
      timestampMs: null,
      timestampRaw: null,
    };
  }

  return {
    signature: trimmed,
    timestampMs: null,
    timestampRaw: null,
  };
}

function secureEquals(a: string, b: string): boolean {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);
  if (aBuffer.length !== bBuffer.length) return false;
  return timingSafeEqual(aBuffer, bBuffer);
}

function verifyRailwaySignature(params: {
  rawBody: string;
  signatureHeader: string;
  webhookSecret: string;
  isProduction: boolean;
}):
  | { ok: true; signature: string; timestampMs: number | null }
  | { ok: false; status: number; error: string } {
  const secret = params.webhookSecret.trim();
  const parsedSignature = parseSignature(params.signatureHeader);
  const receivedRaw = parsedSignature.signature;

  if (!secret) {
    if (params.isProduction) {
      return { ok: false, status: 503, error: "Webhook signature secret is not configured" };
    }
    return { ok: true, signature: "", timestampMs: parsedSignature.timestampMs };
  }

  if (!receivedRaw) {
    return { ok: false, status: 401, error: "Missing webhook signature" };
  }

  const candidates = [params.rawBody];
  if (parsedSignature.timestampRaw) {
    candidates.push(`${parsedSignature.timestampRaw}.${params.rawBody}`);
  }

  for (const candidate of candidates) {
    const expectedHex = createHmac("sha256", secret).update(candidate).digest("hex");
    const expectedBase64 = createHmac("sha256", secret).update(candidate).digest("base64");
    if (secureEquals(receivedRaw, expectedHex) || secureEquals(receivedRaw, expectedBase64)) {
      return {
        ok: true,
        signature: receivedRaw,
        timestampMs: parsedSignature.timestampMs,
      };
    }
  }

  return { ok: false, status: 401, error: "Invalid webhook signature" };
}

/**
 * POST /api/railway-webhook
 * 
 * Receives Railway webhook events
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const correlationId = ensureCorrelationId(request.headers.get("x-correlation-id"));
  const isProduction = process.env.NODE_ENV === "production";
  const maxWebhookBytes = Number.parseInt(
    process.env.RAILWAY_WEBHOOK_MAX_BYTES || `${DEFAULT_MAX_WEBHOOK_BYTES}`,
    10
  );
  const replayWindowSeconds = Number.parseInt(
    process.env.RAILWAY_WEBHOOK_REPLAY_WINDOW_SECONDS || `${DEFAULT_REPLAY_WINDOW_SECONDS}`,
    10
  );
  const replayWindowMs = Math.max(1, replayWindowSeconds) * 1000;

  try {
    const contentLengthHeader = request.headers.get("content-length");
    const contentLength = contentLengthHeader ? Number.parseInt(contentLengthHeader, 10) : null;
    if (contentLength && Number.isFinite(contentLength) && contentLength > maxWebhookBytes) {
      return NextResponse.json(
        { success: false, error: "Payload too large", correlationId },
        { status: 413 }
      );
    }

    // Get raw body for signature verification
    const body = await request.text();
    if (Buffer.byteLength(body, "utf8") > maxWebhookBytes) {
      return NextResponse.json(
        { success: false, error: "Payload too large", correlationId },
        { status: 413 }
      );
    }

    const signature = request.headers.get("x-railway-signature") || "";
    const webhookSecret = process.env.RAILWAY_WEBHOOK_SECRET || "";

    const signatureValidation = verifyRailwaySignature({
      rawBody: body,
      signatureHeader: signature,
      webhookSecret,
      isProduction,
    });

    if (!signatureValidation.ok) {
      logSafeguard({
        level: "warn",
        message: "railway.webhook.signature_failed",
        scope: "railway-webhook",
        correlationId,
        data: { status: signatureValidation.status },
      });
      return NextResponse.json(
        { success: false, error: signatureValidation.error, correlationId },
        { status: signatureValidation.status }
      );
    }

    // Parse payload
    let payload: RailwayWebhookPayload;
    try {
      payload = JSON.parse(body);
    } catch (error) {
      console.error("[RAILWAY WEBHOOK] Failed to parse payload:", error);
      return NextResponse.json(
        { error: "Invalid JSON payload", correlationId },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!payload.eventType || !payload.serviceName || !payload.environment) {
      console.error("[RAILWAY WEBHOOK] Missing required fields:", payload);
      return NextResponse.json(
        { error: "Missing required fields", correlationId },
        { status: 400 }
      );
    }

    const timestampHeader =
      request.headers.get("x-railway-timestamp") || request.headers.get("x-timestamp") || null;
    const payloadTimestamp =
      parseTimestampMs((payload as Record<string, unknown>).timestamp) ||
      parseTimestampMs((payload as Record<string, unknown>).created_at) ||
      parseTimestampMs((payload as Record<string, unknown>).createdAt) ||
      parseTimestampMs((payload as Record<string, unknown>).eventTimestamp);
    const timestampMs =
      signatureValidation.timestampMs || parseTimestampMs(timestampHeader) || payloadTimestamp;

    if (isProduction && !timestampMs) {
      return NextResponse.json(
        { success: false, error: "Missing webhook timestamp", correlationId },
        { status: 401 }
      );
    }

    if (timestampMs && Math.abs(Date.now() - timestampMs) > replayWindowMs) {
      return NextResponse.json(
        { success: false, error: "Webhook timestamp outside replay window", correlationId },
        { status: 401 }
      );
    }

    const payloadEventId =
      (typeof payload.deploymentId === "string" && payload.deploymentId) ||
      (typeof (payload as Record<string, unknown>).id === "string" &&
        ((payload as Record<string, unknown>).id as string)) ||
      (typeof (payload as Record<string, unknown>).eventId === "string" &&
        ((payload as Record<string, unknown>).eventId as string)) ||
      "";
    const payloadHash = createHash("sha256").update(body).digest("hex");
    const replayFingerprint =
      payloadEventId.length > 0
        ? `${signatureValidation.signature}:${payloadEventId}`
        : `${signatureValidation.signature}:${payloadHash}`;
    if (!registerReplayFingerprint(replayFingerprint, replayWindowMs)) {
      return NextResponse.json(
        { success: false, error: "Duplicate webhook event", correlationId },
        { status: 409 }
      );
    }

    enforceKillSwitch({ scope: "railway-webhook", correlationId });

    // Log the webhook event
    logSafeguard({
      level: "info",
      message: "railway.webhook.received",
      scope: "railway-webhook",
      correlationId,
      data: {
        eventType: payload.eventType,
        service: payload.serviceName,
        environment: payload.environment,
      },
    });

    // TODO: Implement full webhook processing
    // - isDuplicateEvent check
    // - handleRailwayWebhook
    // - bridgeWebhookToHealth
    // - sendEventNotification

    // Return success response
    return NextResponse.json({
      success: true,
      action: "logged",
      reason: "Webhook received and logged (full processing not yet implemented)",
      processingTime: Date.now() - startTime,
      correlationId,
    });
  } catch (error) {
    const normalized = normalizeError(error);
    logSafeguard({
      level: "error",
      message: "railway.webhook.error",
      scope: "railway-webhook",
      correlationId,
      data: { error: normalized.code },
    });

    return NextResponse.json(
      {
        success: false,
        error: normalized.code,
        message: normalized.safeMessage,
        correlationId,
      },
      { status: normalized.status }
    );
  }
}

/**
 * GET /api/railway-webhook
 * 
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    service: "railway-webhook",
    status: "healthy",
    timestamp: new Date().toISOString(),
    correlationId: ensureCorrelationId(null),
  });
}
