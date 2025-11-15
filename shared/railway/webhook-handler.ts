/**
 * ============================================================
 * RAILWAY WEBHOOK HANDLER
 * ============================================================
 * Receives and processes Railway webhook events
 * Bridges to Enterprise Health Cell for monitoring and auto-repair
 * 
 * RPRD DNA: Simple, clear, bulletproof
 */

import crypto from "crypto";

export type RailwayEventType =
  | "DEPLOYMENT_CRASHED"
  | "DEPLOYMENT_OOM_KILLED"
  | "MONITOR_TRIGGERED"
  | "VOLUME_ALERT_TRIGGERED"
  | "CPU_THRESHOLD_ALERT"
  | "MEMORY_THRESHOLD_ALERT"
  | "DEPLOYMENT_SUCCEEDED"
  | "DEPLOYMENT_FAILED"
  | "SERVICE_STARTED"
  | "SERVICE_STOPPED";

export type RailwayEnvironmentType = "production" | "staging" | "pr" | "development";

export type RailwayWebhookPayload = {
  eventType: RailwayEventType;
  environment: RailwayEnvironmentType;
  serviceName: string;
  serviceId: string;
  deploymentId?: string;
  projectId: string;
  timestamp: string;
  
  // Additional context
  metadata?: {
    exitCode?: number;
    signal?: string;
    memoryUsage?: number;
    cpuUsage?: number;
    errorMessage?: string;
  };
};

export type WebhookHandlerResult = {
  success: boolean;
  action: "handled" | "ignored" | "escalated";
  reason: string;
  healthCheckTriggered: boolean;
  autoRepairAttempted: boolean;
};

/**
 * Critical events that require immediate action
 */
const CRITICAL_EVENTS: RailwayEventType[] = [
  "DEPLOYMENT_CRASHED",
  "DEPLOYMENT_OOM_KILLED",
  "MONITOR_TRIGGERED",
  "DEPLOYMENT_FAILED",
];

/**
 * Warning events that should be logged but not acted upon immediately
 */
const WARNING_EVENTS: RailwayEventType[] = [
  "CPU_THRESHOLD_ALERT",
  "MEMORY_THRESHOLD_ALERT",
  "VOLUME_ALERT_TRIGGERED",
];

/**
 * Info events that are logged for visibility
 */
const INFO_EVENTS: RailwayEventType[] = [
  "DEPLOYMENT_SUCCEEDED",
  "SERVICE_STARTED",
  "SERVICE_STOPPED",
];

/**
 * Verify Railway webhook signature (if Railway supports it)
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  if (!signature || !secret) {
    console.warn("[RAILWAY WEBHOOK] No signature or secret provided - skipping verification");
    return true; // Allow in dev, but warn
  }

  try {
    const hmac = crypto.createHmac("sha256", secret);
    const digest = hmac.update(payload).digest("hex");
    const expectedSignature = `sha256=${digest}`;

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error("[RAILWAY WEBHOOK] Signature verification failed:", error);
    return false;
  }
}

/**
 * Determine event severity
 */
export function getEventSeverity(eventType: RailwayEventType): "critical" | "warning" | "info" {
  if (CRITICAL_EVENTS.includes(eventType)) return "critical";
  if (WARNING_EVENTS.includes(eventType)) return "warning";
  return "info";
}

/**
 * Check if event should be acted upon
 */
export function shouldActOnEvent(
  eventType: RailwayEventType,
  environment: RailwayEnvironmentType
): boolean {
  const severity = getEventSeverity(eventType);

  // Always act on critical events in production
  if (severity === "critical" && environment === "production") {
    return true;
  }

  // Act on critical events in staging if they're deployment-related
  if (
    severity === "critical" &&
    environment === "staging" &&
    (eventType === "DEPLOYMENT_CRASHED" || eventType === "DEPLOYMENT_FAILED")
  ) {
    return true;
  }

  // Ignore PR events (low priority, ephemeral)
  if (environment === "pr") {
    return false;
  }

  // Ignore info events
  if (severity === "info") {
    return false;
  }

  return false;
}

/**
 * Map service name to our internal app identifier
 */
export function mapServiceToApp(serviceName: string): "synqra" | "noid" | "aurafx" | "unknown" {
  const lower = serviceName.toLowerCase();

  if (lower.includes("synqra")) return "synqra";
  if (lower.includes("noid")) return "noid";
  if (lower.includes("aurafx") || lower.includes("aura")) return "aurafx";

  return "unknown";
}

/**
 * Determine health check action based on event
 */
export function determineHealthAction(
  eventType: RailwayEventType,
  metadata?: RailwayWebhookPayload["metadata"]
): {
  shouldRunHealthCheck: boolean;
  shouldAttemptRepair: boolean;
  repairStrategy?: "restart" | "rollback" | "scale" | "none";
} {
  switch (eventType) {
    case "DEPLOYMENT_CRASHED":
      return {
        shouldRunHealthCheck: true,
        shouldAttemptRepair: true,
        repairStrategy: metadata?.exitCode === 137 ? "scale" : "restart", // 137 = OOM
      };

    case "DEPLOYMENT_OOM_KILLED":
      return {
        shouldRunHealthCheck: true,
        shouldAttemptRepair: true,
        repairStrategy: "scale", // Need more memory
      };

    case "DEPLOYMENT_FAILED":
      return {
        shouldRunHealthCheck: true,
        shouldAttemptRepair: false, // Don't auto-repair build failures
        repairStrategy: "none",
      };

    case "MONITOR_TRIGGERED":
      return {
        shouldRunHealthCheck: true,
        shouldAttemptRepair: true,
        repairStrategy: "restart",
      };

    default:
      return {
        shouldRunHealthCheck: false,
        shouldAttemptRepair: false,
        repairStrategy: "none",
      };
  }
}

/**
 * Process Railway webhook event
 */
export async function handleRailwayWebhook(
  payload: RailwayWebhookPayload
): Promise<WebhookHandlerResult> {
  const { eventType, environment, serviceName, metadata } = payload;

  // Log all events for visibility
  console.log("[RAILWAY WEBHOOK] Event received:", {
    eventType,
    environment,
    serviceName,
    timestamp: payload.timestamp,
  });

  // Check if we should act on this event
  if (!shouldActOnEvent(eventType, environment)) {
    return {
      success: true,
      action: "ignored",
      reason: `Event ${eventType} in ${environment} is not critical`,
      healthCheckTriggered: false,
      autoRepairAttempted: false,
    };
  }

  // Map to internal app
  const app = mapServiceToApp(serviceName);
  if (app === "unknown") {
    console.warn("[RAILWAY WEBHOOK] Unknown service:", serviceName);
    return {
      success: false,
      action: "ignored",
      reason: `Unknown service: ${serviceName}`,
      healthCheckTriggered: false,
      autoRepairAttempted: false,
    };
  }

  // Determine health action
  const healthAction = determineHealthAction(eventType, metadata);

  // Log the action plan
  console.log("[RAILWAY WEBHOOK] Action plan:", {
    app,
    eventType,
    healthCheck: healthAction.shouldRunHealthCheck,
    repair: healthAction.shouldAttemptRepair,
    strategy: healthAction.repairStrategy,
  });

  // Return plan (actual execution will happen in the API route)
  return {
    success: true,
    action: "handled",
    reason: `${eventType} triggered for ${app} in ${environment}`,
    healthCheckTriggered: healthAction.shouldRunHealthCheck,
    autoRepairAttempted: healthAction.shouldAttemptRepair,
  };
}

/**
 * Deduplicate events to prevent alert fatigue
 */
const recentEvents = new Map<string, number>();
const DEDUP_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

export function isDuplicateEvent(
  eventType: RailwayEventType,
  serviceName: string,
  deploymentId?: string
): boolean {
  const key = `${eventType}:${serviceName}:${deploymentId || "none"}`;
  const now = Date.now();
  const lastSeen = recentEvents.get(key);

  if (lastSeen && now - lastSeen < DEDUP_WINDOW_MS) {
    return true; // Duplicate within window
  }

  // Update last seen
  recentEvents.set(key, now);

  // Clean old entries
  for (const [k, timestamp] of recentEvents.entries()) {
    if (now - timestamp > DEDUP_WINDOW_MS) {
      recentEvents.delete(k);
    }
  }

  return false;
}

/**
 * Format webhook event for logging/alerting
 */
export function formatEventForNotification(payload: RailwayWebhookPayload): string {
  const severity = getEventSeverity(payload.eventType);
  const icon = severity === "critical" ? "🚨" : severity === "warning" ? "⚠️" : "ℹ️";

  const lines = [
    `${icon} **Railway Event: ${payload.eventType}**`,
    `Service: ${payload.serviceName}`,
    `Environment: ${payload.environment}`,
    `Time: ${new Date(payload.timestamp).toLocaleString()}`,
  ];

  if (payload.metadata) {
    if (payload.metadata.exitCode !== undefined) {
      lines.push(`Exit Code: ${payload.metadata.exitCode}`);
    }
    if (payload.metadata.memoryUsage) {
      lines.push(`Memory: ${(payload.metadata.memoryUsage / 1024 / 1024).toFixed(2)} MB`);
    }
    if (payload.metadata.errorMessage) {
      lines.push(`Error: ${payload.metadata.errorMessage}`);
    }
  }

  return lines.join("\n");
}
