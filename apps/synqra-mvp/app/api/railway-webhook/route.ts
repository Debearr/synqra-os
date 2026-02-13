/**
 * ============================================================
 * RAILWAY WEBHOOK RECEIVER ENDPOINT
 * ============================================================
 * Receives Railway webhook events and bridges to Health Cell
 * 
 * RPRD DNA: Bulletproof, simple, well-logged
 */

import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
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

function parseSignature(headerValue: string): string {
  const trimmed = headerValue.trim();
  if (!trimmed) return "";
  if (trimmed.includes("=")) {
    const [, value] = trimmed.split("=", 2);
    return value.trim();
  }
  return trimmed;
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
}): { ok: true } | { ok: false; status: number; error: string } {
  const secret = params.webhookSecret.trim();
  const receivedRaw = parseSignature(params.signatureHeader);

  if (!secret) {
    if (params.isProduction) {
      return { ok: false, status: 503, error: "Webhook signature secret is not configured" };
    }
    return { ok: true };
  }

  if (!receivedRaw) {
    return { ok: false, status: 401, error: "Missing webhook signature" };
  }

  const expectedHex = createHmac("sha256", secret).update(params.rawBody).digest("hex");
  const expectedBase64 = createHmac("sha256", secret).update(params.rawBody).digest("base64");
  if (secureEquals(receivedRaw, expectedHex) || secureEquals(receivedRaw, expectedBase64)) {
    return { ok: true };
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

  try {
    // Get raw body for signature verification
    const body = await request.text();
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

    enforceKillSwitch({ scope: "railway-webhook", correlationId });

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
