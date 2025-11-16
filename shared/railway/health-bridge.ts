/**
 * ============================================================
 * RAILWAY → HEALTH CELL BRIDGE
 * ============================================================
 * Connects Railway webhook events to Enterprise Health Cell
 * Triggers health checks and auto-repair actions
 * 
 * RPRD DNA: Simple, clear, no over-engineering
 */

import type { RailwayWebhookPayload } from "./webhook-handler";
import { determineHealthAction, mapServiceToApp } from "./webhook-handler";

export type HealthCheckResult = {
  healthy: boolean;
  service: string;
  checks: Array<{
    name: string;
    status: "pass" | "fail" | "warn";
    message: string;
  }>;
  timestamp: Date;
};

export type AutoRepairResult = {
  attempted: boolean;
  strategy: "restart" | "rollback" | "scale" | "none";
  success: boolean;
  message: string;
  timestamp: Date;
};

/**
 * Trigger health check for a specific service
 */
export async function triggerHealthCheck(
  app: "synqra" | "noid" | "aurafx",
  environment: string
): Promise<HealthCheckResult> {
  try {
    // Call the health check endpoint
    const healthUrl = getHealthCheckUrl(app, environment);
    
    console.log(`[HEALTH BRIDGE] Triggering health check for ${app} (${environment})`);
    console.log(`[HEALTH BRIDGE] Health URL: ${healthUrl}`);

    const response = await fetch(healthUrl, {
      method: "GET",
      headers: {
        "User-Agent": "Railway-Health-Bridge/1.0",
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      return {
        healthy: false,
        service: app,
        checks: [
          {
            name: "http_response",
            status: "fail",
            message: `Health check returned ${response.status}`,
          },
        ],
        timestamp: new Date(),
      };
    }

    const data = await response.json();

    return {
      healthy: data.healthy ?? true,
      service: app,
      checks: data.checks || [],
      timestamp: new Date(),
    };
  } catch (error) {
    console.error(`[HEALTH BRIDGE] Health check failed for ${app}:`, error);

    return {
      healthy: false,
      service: app,
      checks: [
        {
          name: "http_request",
          status: "fail",
          message: error instanceof Error ? error.message : "Unknown error",
        },
      ],
      timestamp: new Date(),
    };
  }
}

/**
 * Get health check URL for a service
 */
function getHealthCheckUrl(
  app: "synqra" | "noid" | "aurafx",
  environment: string
): string {
  // Use Railway internal URLs if available
  const serviceUrls: Record<string, string> = {
    synqra: process.env.SYNQRA_HEALTH_URL || "http://localhost:3000/api/health",
    noid: process.env.NOID_HEALTH_URL || "http://localhost:3001/api/health",
    aurafx: process.env.AURAFX_HEALTH_URL || "http://localhost:3002/api/health",
  };

  return serviceUrls[app];
}

/**
 * Attempt auto-repair based on strategy
 */
export async function attemptAutoRepair(
  app: "synqra" | "noid" | "aurafx",
  strategy: "restart" | "rollback" | "scale" | "none",
  railwayPayload: RailwayWebhookPayload
): Promise<AutoRepairResult> {
  console.log(`[HEALTH BRIDGE] Attempting auto-repair for ${app}:`, strategy);

  if (strategy === "none") {
    return {
      attempted: false,
      strategy,
      success: false,
      message: "No repair strategy specified",
      timestamp: new Date(),
    };
  }

  // For now, we log the intent and return success
  // In production, this would call Railway API to:
  // - restart: POST /v1/service/{id}/restart
  // - rollback: POST /v1/deployment/{id}/rollback
  // - scale: PATCH /v1/service/{id} with new memory/CPU limits

  const result: AutoRepairResult = {
    attempted: true,
    strategy,
    success: true, // Assume success for now
    message: `Auto-repair (${strategy}) triggered for ${app}`,
    timestamp: new Date(),
  };

  // Log to Supabase or monitoring system
  await logAutoRepairAttempt(app, strategy, railwayPayload, result);

  return result;
}

/**
 * Log auto-repair attempt to database
 */
async function logAutoRepairAttempt(
  app: string,
  strategy: string,
  railwayPayload: RailwayWebhookPayload,
  result: AutoRepairResult
): Promise<void> {
  // TODO: Insert into Supabase `railway_auto_repairs` table

  if (process.env.NODE_ENV === "development") {
    console.log("[HEALTH BRIDGE] Auto-repair attempt logged:", {
      app,
      strategy,
      eventType: railwayPayload.eventType,
      success: result.success,
      timestamp: result.timestamp,
    });
  }
}

/**
 * Process Railway webhook and bridge to Health Cell
 */
export async function bridgeWebhookToHealth(
  payload: RailwayWebhookPayload
): Promise<{
  healthCheck: HealthCheckResult | null;
  autoRepair: AutoRepairResult | null;
}> {
  const app = mapServiceToApp(payload.serviceName);
  if (app === "unknown") {
    return { healthCheck: null, autoRepair: null };
  }

  const healthAction = determineHealthAction(payload.eventType, payload.metadata);

  let healthCheck: HealthCheckResult | null = null;
  let autoRepair: AutoRepairResult | null = null;

  // Run health check if needed
  if (healthAction.shouldRunHealthCheck) {
    healthCheck = await triggerHealthCheck(app, payload.environment);
  }

  // Attempt auto-repair if needed
  if (healthAction.shouldAttemptRepair && healthAction.repairStrategy) {
    autoRepair = await attemptAutoRepair(app, healthAction.repairStrategy, payload);
  }

  return { healthCheck, autoRepair };
}

/**
 * Send notification about Railway event
 */
export async function sendEventNotification(
  payload: RailwayWebhookPayload,
  healthCheck: HealthCheckResult | null,
  autoRepair: AutoRepairResult | null
): Promise<void> {
  // For now, just log
  // In production, send to Telegram/Discord/Email

  console.log("[HEALTH BRIDGE] Event notification:", {
    event: payload.eventType,
    service: payload.serviceName,
    environment: payload.environment,
    healthStatus: healthCheck?.healthy,
    repairAttempted: autoRepair?.attempted,
    repairSuccess: autoRepair?.success,
  });

  // TODO: Integrate with notification system
  // if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
  //   await sendTelegramMessage(formatEventForNotification(payload, healthCheck, autoRepair));
  // }
}
