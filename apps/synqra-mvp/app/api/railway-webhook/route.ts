/**
 * ============================================================
 * RAILWAY WEBHOOK RECEIVER ENDPOINT
 * ============================================================
 * Receives Railway webhook events and bridges to Health Cell
 * 
 * RPRD DNA: Bulletproof, simple, well-logged
 */

import { NextRequest, NextResponse } from "next/server";

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
  [key: string]: unknown;
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/railway-webhook
 * 
 * Receives Railway webhook events
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Get raw body for signature verification
    const body = await request.text();
    const signature = request.headers.get("x-railway-signature") || "";
    const webhookSecret = process.env.RAILWAY_WEBHOOK_SECRET || "";

    // Verify signature (if Railway supports it)
    if (webhookSecret && signature) {
      // TODO: Implement signature verification
      console.log("[RAILWAY WEBHOOK] Signature verification skipped (not implemented)");
    }

    // Parse payload
    let payload: RailwayWebhookPayload;
    try {
      payload = JSON.parse(body);
    } catch (error) {
      console.error("[RAILWAY WEBHOOK] Failed to parse payload:", error);
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!payload.eventType || !payload.serviceName || !payload.environment) {
      console.error("[RAILWAY WEBHOOK] Missing required fields:", payload);
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Log the webhook event
    console.log("[RAILWAY WEBHOOK] Received event:", {
      eventType: payload.eventType,
      service: payload.serviceName,
      environment: payload.environment,
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
    });
  } catch (error) {
    console.error("[RAILWAY WEBHOOK] Unexpected error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
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
  });
}
