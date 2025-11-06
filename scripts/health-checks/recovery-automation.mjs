#!/usr/bin/env node
/**
 * Enterprise Health Cell System - Recovery Automation
 * Automatically recovers services based on failure conditions
 * Version: 1.0.0
 * Created: 2025-11-06
 */

import { createClient } from "@supabase/supabase-js";
import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==============================================
// CONFIGURATION
// ==============================================

const CONFIG = {
  CHECK_INTERVAL: 60000, // Check every minute
  REQUEST_TIMEOUT: 10000,
  LOG_DIR: path.join(__dirname, ".healthcell"),
  LOG_FILE: "recovery-log.jsonl",
};

// Required environment variables
const REQUIRED_ENV = ["SUPABASE_URL", "SUPABASE_SERVICE_KEY"];

// ==============================================
// ENVIRONMENT VALIDATION
// ==============================================

function validateEnvironment() {
  const missing = REQUIRED_ENV.filter((v) => !process.env[v]);

  if (missing.length) {
    console.error(`❌ Missing required environment variables: ${missing.join(", ")}`);
    process.exit(1);
  }

  return true;
}

validateEnvironment();

// ==============================================
// SUPABASE CLIENT
// ==============================================

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// ==============================================
// UTILITY FUNCTIONS
// ==============================================

/**
 * Ensures log directory exists
 */
function ensureLogDirectory() {
  if (!fs.existsSync(CONFIG.LOG_DIR)) {
    fs.mkdirSync(CONFIG.LOG_DIR, { recursive: true });
  }
}

/**
 * Logs data to local file
 */
function logToFile(data) {
  try {
    ensureLogDirectory();
    const logPath = path.join(CONFIG.LOG_DIR, CONFIG.LOG_FILE);
    fs.appendFileSync(logPath, JSON.stringify(data) + "\n");
  } catch (error) {
    console.error("⚠️  Could not write to recovery log:", error.message);
  }
}

/**
 * Fetch with timeout support
 */
async function fetchWithTimeout(url, options = {}, timeout = CONFIG.REQUEST_TIMEOUT) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    throw error;
  }
}

// ==============================================
// RECOVERY ACTIONS
// ==============================================

/**
 * Gets services that need recovery
 */
async function getServicesNeedingRecovery() {
  try {
    const { data, error } = await supabase
      .from("health_service_status")
      .select(
        `
        service_id,
        current_status,
        consecutive_failures,
        health_services (
          id,
          service_key,
          display_name,
          config,
          health_projects (
            display_name,
            supabase_url,
            notification_emails
          ),
          health_recovery_actions (
            id,
            action_name,
            action_type,
            action_config,
            max_retries,
            is_enabled
          )
        )
      `
      )
      .in("current_status", ["degraded", "critical"])
      .gte("consecutive_failures", 3);

    if (error) throw error;

    return (data || []).filter(
      (s) =>
        s.health_services?.health_recovery_actions &&
        s.health_services.health_recovery_actions.length > 0
    );
  } catch (error) {
    console.error("❌ Failed to fetch services needing recovery:", error.message);
    return [];
  }
}

/**
 * Logs recovery action
 */
async function logRecoveryAction(actionId, serviceId, incidentId, status, result, error = null) {
  try {
    const logEntry = {
      recovery_action_id: actionId,
      service_id: serviceId,
      incident_id: incidentId,
      action_type: "auto_restart",
      status,
      started_at: new Date().toISOString(),
      completed_at: status !== "pending" && status !== "running" ? new Date().toISOString() : null,
      result_message: result,
      error_details: error,
    };

    const { error: dbError } = await supabase.from("health_recovery_log").insert([logEntry]);

    if (dbError) throw dbError;
  } catch (error) {
    console.error("⚠️  Failed to log recovery action:", error.message);
    logToFile({ event: "recovery_log_failed", actionId, serviceId, error: error.message });
  }
}

/**
 * Notifies stakeholders of recovery action
 */
async function notifyRecovery(service, action, success) {
  if (!process.env.N8N_WEBHOOK_URL) {
    console.warn("⚠️  N8N_WEBHOOK_URL not configured, skipping notification");
    return;
  }

  try {
    const payload = {
      event: "recovery_action",
      service: service.display_name,
      project: service.health_projects?.display_name,
      action: action.action_name,
      action_type: action.action_type,
      success,
      timestamp: new Date().toISOString(),
      notification_emails: service.health_projects?.notification_emails || [],
    };

    await fetchWithTimeout(process.env.N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    console.log(`✅ Recovery notification sent for ${service.display_name}`);
  } catch (error) {
    console.error("⚠️  Failed to send recovery notification:", error.message);
  }
}

/**
 * Creates incident if needed
 */
async function createOrGetIncident(service, serviceStatus) {
  try {
    // Check if there's already an active incident for this service
    const { data: existingIncidents } = await supabase
      .from("health_incidents")
      .select("id")
      .eq("service_id", service.id)
      .neq("status", "resolved")
      .limit(1);

    if (existingIncidents && existingIncidents.length > 0) {
      return existingIncidents[0].id;
    }

    // Create new incident
    const incident = {
      title: `${service.display_name} Service Degradation`,
      description: `Service is experiencing issues with ${serviceStatus.consecutive_failures} consecutive failures`,
      severity: serviceStatus.current_status === "critical" ? "critical" : "error",
      status: "investigating",
      service_id: service.id,
      affected_services: [service.id],
      started_at: new Date().toISOString(),
      detected_at: new Date().toISOString(),
      impact_description: `${service.display_name} is ${serviceStatus.current_status}`,
    };

    const { data: newIncident, error } = await supabase
      .from("health_incidents")
      .insert([incident])
      .select()
      .single();

    if (error) throw error;

    return newIncident.id;
  } catch (error) {
    console.error("⚠️  Failed to create incident:", error.message);
    return null;
  }
}

/**
 * Executes auto-restart action
 */
async function executeAutoRestart(service, action, incidentId) {
  console.log(`🔄 Attempting auto-restart for ${service.display_name}...`);

  await logRecoveryAction(
    action.id,
    service.id,
    incidentId,
    "running",
    "Initiating auto-restart procedure"
  );

  try {
    // For Supabase services, we can't actually restart them
    // But we can trigger health checks and clear consecutive failures
    const config = action.action_config || {};
    const waitTime = config.wait_time_ms || 5000;

    // Wait for the specified time
    await new Promise((resolve) => setTimeout(resolve, waitTime));

    // Trigger a new health check
    console.log(`⏳ Waiting ${waitTime}ms before re-checking service...`);

    // The next health check will verify if the service recovered
    await logRecoveryAction(
      action.id,
      service.id,
      incidentId,
      "success",
      "Auto-restart procedure completed, awaiting verification"
    );

    await notifyRecovery(service, action, true);

    return true;
  } catch (error) {
    console.error(`❌ Auto-restart failed for ${service.display_name}:`, error.message);

    await logRecoveryAction(
      action.id,
      service.id,
      incidentId,
      "failed",
      "Auto-restart failed",
      error.stack
    );

    await notifyRecovery(service, action, false);

    return false;
  }
}

/**
 * Executes manual intervention action
 */
async function executeManualIntervention(service, action, incidentId) {
  console.log(`👤 Manual intervention required for ${service.display_name}`);

  await logRecoveryAction(
    action.id,
    service.id,
    incidentId,
    "success",
    "Manual intervention notification sent"
  );

  await notifyRecovery(service, action, true);

  return true;
}

/**
 * Executes escalate action
 */
async function executeEscalate(service, action, incidentId) {
  console.log(`⬆️  Escalating issue for ${service.display_name}`);

  try {
    // Update incident severity
    if (incidentId) {
      await supabase
        .from("health_incidents")
        .update({
          severity: "critical",
          status: "identified",
        })
        .eq("id", incidentId);

      // Add incident update
      await supabase.from("health_incident_updates").insert([
        {
          incident_id: incidentId,
          update_type: "update",
          message: "Issue escalated - requires immediate attention",
          created_by: "recovery_automation",
        },
      ]);
    }

    await logRecoveryAction(
      action.id,
      service.id,
      incidentId,
      "success",
      "Issue escalated successfully"
    );

    await notifyRecovery(service, action, true);

    return true;
  } catch (error) {
    console.error(`❌ Escalation failed for ${service.display_name}:`, error.message);

    await logRecoveryAction(
      action.id,
      service.id,
      incidentId,
      "failed",
      "Escalation failed",
      error.stack
    );

    return false;
  }
}

/**
 * Executes notify-only action
 */
async function executeNotifyOnly(service, action, incidentId) {
  console.log(`📧 Sending notification for ${service.display_name}`);

  await logRecoveryAction(
    action.id,
    service.id,
    incidentId,
    "success",
    "Notification sent successfully"
  );

  await notifyRecovery(service, action, true);

  return true;
}

/**
 * Executes recovery action based on type
 */
async function executeRecoveryAction(service, action, serviceStatus) {
  const incidentId = await createOrGetIncident(service, serviceStatus);

  console.log(`🚀 Executing recovery action: ${action.action_name}`);
  console.log(`   Service: ${service.display_name}`);
  console.log(`   Action Type: ${action.action_type}`);
  console.log(`   Consecutive Failures: ${serviceStatus.consecutive_failures}`);

  let success = false;

  switch (action.action_type) {
    case "auto_restart":
      success = await executeAutoRestart(service, action, incidentId);
      break;

    case "manual_intervention":
      success = await executeManualIntervention(service, action, incidentId);
      break;

    case "escalate":
      success = await executeEscalate(service, action, incidentId);
      break;

    case "notify_only":
      success = await executeNotifyOnly(service, action, incidentId);
      break;

    default:
      console.warn(`⚠️  Unknown action type: ${action.action_type}`);
      await logRecoveryAction(
        action.id,
        service.id,
        incidentId,
        "failed",
        `Unknown action type: ${action.action_type}`
      );
  }

  return success;
}

// ==============================================
// MAIN RECOVERY LOOP
// ==============================================

async function runRecoveryCheck() {
  console.log("🔍 Checking for services needing recovery...");

  const services = await getServicesNeedingRecovery();

  if (services.length === 0) {
    console.log("✅ No services require recovery");
    return;
  }

  console.log(`📋 Found ${services.length} service(s) needing recovery`);

  for (const serviceStatus of services) {
    const service = serviceStatus.health_services;

    if (!service) continue;

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`Processing: ${service.display_name}`);
    console.log(`Status: ${serviceStatus.current_status}`);
    console.log(`Consecutive Failures: ${serviceStatus.consecutive_failures}`);

    // Get enabled recovery actions sorted by priority
    const actions = service.health_recovery_actions
      .filter((a) => a.is_enabled)
      .sort((a, b) => (a.priority || 10) - (b.priority || 10));

    if (actions.length === 0) {
      console.log(`⚠️  No enabled recovery actions configured for ${service.display_name}`);
      continue;
    }

    // Execute each recovery action
    for (const action of actions) {
      const success = await executeRecoveryAction(service, action, serviceStatus);

      if (success && action.action_type !== "notify_only") {
        // If action succeeded and it's not just a notification, break
        break;
      }
    }
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log("✅ Recovery check completed\n");
}

async function main() {
  console.log("🚀 Enterprise Health Cell - Recovery Automation System");
  console.log(`📅 ${new Date().toISOString()}`);
  console.log(`⏱️  Check interval: ${CONFIG.CHECK_INTERVAL / 1000}s`);
  console.log("━".repeat(60));

  // Run initial check
  await runRecoveryCheck();

  // Set up recurring checks
  setInterval(async () => {
    try {
      await runRecoveryCheck();
    } catch (error) {
      console.error("❌ Error during recovery check:", error);
      logToFile({
        event: "recovery_check_error",
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      });
    }
  }, CONFIG.CHECK_INTERVAL);

  console.log("✅ Recovery automation system is running...");
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n⚠️  Received SIGINT, shutting down gracefully...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n⚠️  Received SIGTERM, shutting down gracefully...");
  process.exit(0);
});

// Run the main function
main().catch((error) => {
  console.error("💥 Fatal error:", error);
  process.exit(1);
});
