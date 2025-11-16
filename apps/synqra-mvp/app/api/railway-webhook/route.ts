/**
 * ============================================================
 * RAILWAY WEBHOOK RECEIVER ENDPOINT
 * ============================================================
 * Receives Railway webhook events and bridges to Health Cell
 * 
 * RPRD DNA: Bulletproof, simple, well-logged
 */

import { NextRequest, NextResponse } from "next/server";
import {
  verifyWebhookSignature,
  handleRailwayWebhook,
  isDuplicateEvent,
  formatEventForNotification,
  type RailwayWebhookPayload,
} from "@/shared/railway/webhook-handler";
import { bridgeWebhookToHealth, sendEventNotification } from "@/shared/railway/health-bridge";

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
      const isValid = verifyWebhookSignature(body, signature, webhookSecret);
      if (!isValid) {
        console.error("[RAILWAY WEBHOOK] Invalid signature");
        return NextResponse.json(
          { error: "Invalid webhook signature" },
          { status: 401 }
        );
      }
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

    // Check for duplicate events (prevent alert fatigue)
    if (isDuplicateEvent(payload.eventType, payload.serviceName, payload.deploymentId)) {
      console.log("[RAILWAY WEBHOOK] Duplicate event ignored:", {
        eventType: payload.eventType,
        service: payload.serviceName,
      });

      return NextResponse.json({
        success: true,
        action: "ignored",
        reason: "Duplicate event within deduplication window",
      });
    }

    // Handle webhook event
    const handlerResult = await handleRailwayWebhook(payload);

    // If event was ignored, return early
    if (handlerResult.action === "ignored") {
      return NextResponse.json({
        success: true,
        action: "ignored",
        reason: handlerResult.reason,
        processingTime: Date.now() - startTime,
      });
    }

    // Bridge to Health Cell (if action was "handled")
    const { healthCheck, autoRepair } = await bridgeWebhookToHealth(payload);

    // Send notification (if critical)
    if (handlerResult.action === "handled" || handlerResult.action === "escalated") {
      await sendEventNotification(payload, healthCheck, autoRepair);
    }

    // Return response
    return NextResponse.json({
      success: true,
      action: handlerResult.action,
      reason: handlerResult.reason,
      healthCheck: healthCheck
        ? {
            healthy: healthCheck.healthy,
            checksRun: healthCheck.checks.length,
            failedChecks: healthCheck.checks.filter((c) => c.status === "fail").length,
          }
        : null,
      autoRepair: autoRepair
        ? {
            attempted: autoRepair.attempted,
            strategy: autoRepair.strategy,
            success: autoRepair.success,
          }
        : null,
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
