#!/usr/bin/env node
/**
 * Enterprise Health Cell System - Core Monitoring Engine
 * Monitors Supabase infrastructure for Synqra OS, NØID Labs, and AuraFX
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
  GLOBAL_TIMEOUT: 240000,
  REQUEST_TIMEOUT: 10000,
  MAX_RETRIES: 3,
  BASE_DELAY: 2000,
  LOG_DIR: path.join(__dirname, ".healthcell"),
  LOG_FILE: "local-logs.jsonl",
};

// Required environment variables
const REQUIRED_ENV = ["SUPABASE_URL", "SUPABASE_SERVICE_KEY"];
const OPTIONAL_ENV = ["N8N_WEBHOOK_URL"];

// ==============================================
// GLOBAL ERROR HANDLING
// ==============================================

const globalTimer = setTimeout(() => {
  console.error("💥 Global timeout exceeded");
  process.exit(1);
}, CONFIG.GLOBAL_TIMEOUT);

process.on("unhandledRejection", (error) => {
  console.error("❌ Unhandled rejection:", error);
  clearTimeout(globalTimer);
  process.exit(1);
});

process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught exception:", error);
  clearTimeout(globalTimer);
  process.exit(1);
});

// ==============================================
// ENVIRONMENT VALIDATION
// ==============================================

function validateEnvironment() {
  const missing = REQUIRED_ENV.filter((v) => !process.env[v]);

  if (missing.length) {
    console.error(`❌ Missing required environment variables: ${missing.join(", ")}`);
    process.exit(1);
  }

  const missingOptional = OPTIONAL_ENV.filter((v) => !process.env[v]);
  if (missingOptional.length) {
    console.warn(`⚠️  Missing optional environment variables: ${missingOptional.join(", ")}`);
  }

  return true;
}

validateEnvironment();

// ==============================================
// SUPABASE CLIENT
// ==============================================

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

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
    console.error("⚠️  Could not write to local log:", error.message);
  }
}

/**
 * Delays execution with exponential backoff
 */
function delay(attempt) {
  const backoff = CONFIG.BASE_DELAY * Math.pow(2, attempt);
  const jitter = Math.random() * 1000;
  return new Promise((resolve) => setTimeout(resolve, backoff + jitter));
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

/**
 * Generates unique check ID
 */
function generateCheckId() {
  return `check_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ==============================================
// DATABASE OPERATIONS
// ==============================================

/**
 * Gets all active services to check
 */
async function getActiveServices() {
  try {
    const { data, error } = await supabase
      .from("health_services")
      .select(`
        id,
        service_key,
        display_name,
        endpoint_url,
        timeout_ms,
        retry_count,
        thresholds,
        config,
        health_projects (
          project_key,
          display_name,
          supabase_url
        )
      `)
      .eq("is_active", true);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("❌ Failed to fetch active services:", error.message);
    return [];
  }
}

/**
 * Logs health check result to database
 */
async function logHealthCheck(data) {
  try {
    const { error } = await supabase.from("health_logs").insert([data]);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("⚠️  Supabase logging failed:", error.message);
    logToFile(data);
    return false;
  }
}

/**
 * Gets alert rules for a service
 */
async function getAlertRules(serviceId) {
  try {
    const { data, error } = await supabase
      .from("health_alert_rules")
      .select("*")
      .eq("service_id", serviceId)
      .eq("is_active", true);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("⚠️  Failed to fetch alert rules:", error.message);
    return [];
  }
}

/**
 * Checks if alert should be triggered
 */
async function checkAlertConditions(serviceId, status, responseTime) {
  try {
    const rules = await getAlertRules(serviceId);
    const { data: serviceStatus } = await supabase
      .from("health_service_status")
      .select("consecutive_failures, current_status")
      .eq("service_id", serviceId)
      .single();

    for (const rule of rules) {
      let shouldTrigger = false;
      const config = rule.condition_config || {};

      switch (rule.condition_type) {
        case "consecutive_failures":
          if (serviceStatus?.consecutive_failures >= config.threshold) {
            shouldTrigger = true;
          }
          break;

        case "response_time":
          if (responseTime && responseTime > config.threshold_ms) {
            shouldTrigger = true;
          }
          break;

        case "error_rate":
          // Calculate error rate from recent checks
          const { data: recentLogs } = await supabase
            .from("health_logs")
            .select("status")
            .eq("service_id", serviceId)
            .gte("timestamp", new Date(Date.now() - 3600000).toISOString())
            .order("timestamp", { ascending: false })
            .limit(100);

          if (recentLogs && recentLogs.length > 0) {
            const errorCount = recentLogs.filter((log) =>
              ["degraded", "critical"].includes(log.status)
            ).length;
            const errorRate = errorCount / recentLogs.length;

            if (errorRate >= config.threshold) {
              shouldTrigger = true;
            }
          }
          break;
      }

      if (shouldTrigger) {
        await triggerAlert(rule, serviceId, status);
      }
    }
  } catch (error) {
    console.error("⚠️  Failed to check alert conditions:", error.message);
  }
}

/**
 * Triggers an alert
 */
async function triggerAlert(rule, serviceId, status) {
  try {
    // Check if there's already an active alert for this rule
    const { data: existingAlerts } = await supabase
      .from("health_alerts")
      .select("id")
      .eq("alert_rule_id", rule.id)
      .in("status", ["active", "acknowledged"])
      .limit(1);

    if (existingAlerts && existingAlerts.length > 0) {
      console.log(`ℹ️  Alert already active for rule: ${rule.rule_name}`);
      return;
    }

    // Create new alert
    const alert = {
      alert_rule_id: rule.id,
      service_id: serviceId,
      severity: rule.severity,
      status: "active",
      title: rule.rule_name,
      message: `Service health check failed: ${status}`,
      metadata: { rule_condition: rule.condition_type },
    };

    const { data: newAlert, error } = await supabase
      .from("health_alerts")
      .insert([alert])
      .select()
      .single();

    if (error) throw error;

    console.log(`🚨 Alert triggered: ${rule.rule_name}`);

    // Send notifications
    await sendAlertNotifications(newAlert, rule.notification_channels);
  } catch (error) {
    console.error("⚠️  Failed to trigger alert:", error.message);
  }
}

/**
 * Sends alert notifications
 */
async function sendAlertNotifications(alert, channels) {
  for (const channel of channels) {
    try {
      if (channel === "n8n" && process.env.N8N_WEBHOOK_URL) {
        await notifyN8N({
          alert_id: alert.id,
          severity: alert.severity,
          title: alert.title,
          message: alert.message,
          triggered_at: alert.triggered_at,
        });
      }

      // Log notification
      await supabase.from("health_alert_notifications").insert([
        {
          alert_id: alert.id,
          channel,
          status: "sent",
          sent_at: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      console.error(`⚠️  Failed to send ${channel} notification:`, error.message);

      // Log failed notification
      await supabase.from("health_alert_notifications").insert([
        {
          alert_id: alert.id,
          channel,
          status: "failed",
          error_message: error.message,
          sent_at: new Date().toISOString(),
        },
      ]);
    }
  }
}

/**
 * Notifies N8N webhook
 */
async function notifyN8N(payload, retries = 2) {
  if (!process.env.N8N_WEBHOOK_URL) {
    console.warn("⚠️  N8N_WEBHOOK_URL not configured, skipping notification");
    return false;
  }

  for (let i = 0; i <= retries; i++) {
    try {
      console.log(`🚨 Notifying N8N (attempt ${i + 1}/${retries + 1})...`);

      const response = await fetchWithTimeout(
        process.env.N8N_WEBHOOK_URL,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
        10000
      );

      if (!response.ok) {
        throw new Error(`N8N webhook returned ${response.status}`);
      }

      console.log("✅ N8N notified successfully");
      return true;
    } catch (error) {
      console.error(`❌ N8N notification attempt ${i + 1} failed:`, error.message);
      if (i < retries) {
        await delay(i);
      }
    }
  }

  logToFile({
    event: "n8n_notification_failed",
    payload,
    timestamp: new Date().toISOString(),
  });

  return false;
}

// ==============================================
// SERVICE HEALTH CHECKS
// ==============================================

/**
 * Checks PostgreSQL database health
 */
async function checkPostgresHealth(service) {
  const startTime = Date.now();

  try {
    // Simple query to check database connectivity
    const { data, error } = await supabase
      .from("health_logs")
      .select("id")
      .limit(1);

    if (error) throw error;

    const responseTime = Date.now() - startTime;
    return {
      status: "healthy",
      responseTime,
      message: "PostgreSQL connection successful",
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      status: "critical",
      responseTime,
      message: `PostgreSQL check failed: ${error.message}`,
      error: error.stack,
    };
  }
}

/**
 * Checks REST API health
 */
async function checkRestApiHealth(service) {
  const startTime = Date.now();

  try {
    const url = service.endpoint_url || `${service.health_projects.supabase_url}/rest/v1/`;

    const response = await fetchWithTimeout(
      url,
      {
        headers: {
          apikey: process.env.SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
        },
      },
      service.timeout_ms || CONFIG.REQUEST_TIMEOUT
    );

    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      return {
        status: "critical",
        responseTime,
        message: `REST API returned ${response.status}`,
      };
    }

    const body = await response.text();
    if (!body) {
      return {
        status: "degraded",
        responseTime,
        message: "REST API returned empty response",
      };
    }

    // Check response time thresholds
    const thresholds = service.thresholds || {};
    if (responseTime > thresholds.response_time_critical_ms) {
      return {
        status: "critical",
        responseTime,
        message: `Response time critical: ${responseTime}ms`,
      };
    } else if (responseTime > thresholds.response_time_warning_ms) {
      return {
        status: "degraded",
        responseTime,
        message: `Response time warning: ${responseTime}ms`,
      };
    }

    return {
      status: "healthy",
      responseTime,
      message: "REST API check successful",
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      status: "critical",
      responseTime,
      message: `REST API check failed: ${error.message}`,
      error: error.stack,
    };
  }
}

/**
 * Checks Auth service health
 */
async function checkAuthHealth(service) {
  const startTime = Date.now();

  try {
    const url = service.endpoint_url || `${service.health_projects.supabase_url}/auth/v1/health`;

    const response = await fetchWithTimeout(
      url,
      {
        headers: {
          apikey: process.env.SUPABASE_SERVICE_KEY,
        },
      },
      service.timeout_ms || CONFIG.REQUEST_TIMEOUT
    );

    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      return {
        status: "critical",
        responseTime,
        message: `Auth service returned ${response.status}`,
      };
    }

    return {
      status: "healthy",
      responseTime,
      message: "Auth service check successful",
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      status: "critical",
      responseTime,
      message: `Auth service check failed: ${error.message}`,
      error: error.stack,
    };
  }
}

/**
 * Checks Storage service health
 */
async function checkStorageHealth(service) {
  const startTime = Date.now();

  try {
    const url = service.endpoint_url || `${service.health_projects.supabase_url}/storage/v1/bucket`;

    const response = await fetchWithTimeout(
      url,
      {
        headers: {
          apikey: process.env.SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
        },
      },
      service.timeout_ms || CONFIG.REQUEST_TIMEOUT
    );

    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      return {
        status: "degraded",
        responseTime,
        message: `Storage service returned ${response.status}`,
      };
    }

    return {
      status: "healthy",
      responseTime,
      message: "Storage service check successful",
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      status: "degraded",
      responseTime,
      message: `Storage service check failed: ${error.message}`,
      error: error.stack,
    };
  }
}

/**
 * Checks Realtime service health
 */
async function checkRealtimeHealth(service) {
  // Realtime doesn't have an easy HTTP health check endpoint
  // We'll just check if we can connect to the Supabase project
  return await checkRestApiHealth(service);
}

/**
 * Checks N8N webhook health
 */
async function checkN8NHealth(service) {
  const startTime = Date.now();

  try {
    if (!process.env.N8N_WEBHOOK_URL) {
      return {
        status: "unknown",
        responseTime: 0,
        message: "N8N_WEBHOOK_URL not configured",
      };
    }

    const response = await fetchWithTimeout(
      process.env.N8N_WEBHOOK_URL,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "health_check",
          timestamp: new Date().toISOString(),
        }),
      },
      service.timeout_ms || CONFIG.REQUEST_TIMEOUT
    );

    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      return {
        status: "degraded",
        responseTime,
        message: `N8N returned ${response.status}`,
      };
    }

    return {
      status: "healthy",
      responseTime,
      message: "N8N webhook check successful",
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      status: "degraded",
      responseTime,
      message: `N8N check failed: ${error.message}`,
      error: error.stack,
    };
  }
}

/**
 * Routes health check to appropriate checker
 */
async function performHealthCheck(service, attempt = 1) {
  const checkId = generateCheckId();
  console.log(`🔍 Checking ${service.display_name} (${service.service_key})...`);

  let result;

  switch (service.service_key) {
    case "postgres":
      result = await checkPostgresHealth(service);
      break;
    case "rest_api":
      result = await checkRestApiHealth(service);
      break;
    case "auth":
      result = await checkAuthHealth(service);
      break;
    case "storage":
      result = await checkStorageHealth(service);
      break;
    case "realtime":
      result = await checkRealtimeHealth(service);
      break;
    case "n8n":
      result = await checkN8NHealth(service);
      break;
    case "external":
      result = await checkRestApiHealth(service);
      break;
    default:
      result = {
        status: "unknown",
        responseTime: 0,
        message: `Unknown service type: ${service.service_key}`,
      };
  }

  // Log the result
  const logEntry = {
    check_id: checkId,
    service_id: service.id,
    status: result.status,
    response_time_ms: result.responseTime,
    attempt_number: attempt,
    message: result.message,
    error_stack: result.error || null,
    timestamp: new Date().toISOString(),
  };

  await logHealthCheck(logEntry);

  // Check alert conditions
  if (result.status !== "healthy") {
    await checkAlertConditions(service.id, result.status, result.responseTime);
  }

  return result;
}

/**
 * Performs health check with retries
 */
async function performHealthCheckWithRetry(service) {
  const maxRetries = service.retry_count || CONFIG.MAX_RETRIES;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const result = await performHealthCheck(service, attempt);

    if (result.status === "healthy") {
      console.log(`✅ ${service.display_name}: ${result.message} (${result.responseTime}ms)`);
      return { success: true, result };
    }

    console.error(
      `❌ ${service.display_name} failed (attempt ${attempt}/${maxRetries}): ${result.message}`
    );

    if (attempt < maxRetries) {
      const waitTime = CONFIG.BASE_DELAY * Math.pow(2, attempt - 1);
      console.log(`⏳ Retrying in ${waitTime / 1000}s...`);
      await delay(attempt - 1);
    }
  }

  return { success: false, result: null };
}

// ==============================================
// MAIN EXECUTION
// ==============================================

async function main() {
  console.log("🚀 Enterprise Health Cell System - Starting health checks...");
  console.log(`📅 ${new Date().toISOString()}`);
  console.log("━".repeat(60));

  const startTime = Date.now();

  // Get all active services
  const services = await getActiveServices();

  if (services.length === 0) {
    console.warn("⚠️  No active services found to monitor");
    clearTimeout(globalTimer);
    process.exit(0);
  }

  console.log(`📊 Monitoring ${services.length} services across all projects`);
  console.log("");

  // Perform health checks for all services
  const results = await Promise.allSettled(
    services.map((service) => performHealthCheckWithRetry(service))
  );

  // Analyze results
  const successful = results.filter(
    (r) => r.status === "fulfilled" && r.value.success
  ).length;
  const failed = results.length - successful;

  console.log("");
  console.log("━".repeat(60));
  console.log(`✅ Successful checks: ${successful}/${results.length}`);
  console.log(`❌ Failed checks: ${failed}/${results.length}`);
  console.log(`⏱️  Total time: ${Date.now() - startTime}ms`);

  // Exit with appropriate code
  clearTimeout(globalTimer);

  if (failed === 0) {
    console.log("✅ All services healthy");
    process.exit(0);
  } else {
    console.error("❌ Some services are unhealthy");
    process.exit(1);
  }
}

// Run the main function
main().catch((error) => {
  console.error("💥 Unexpected error:", error);
  clearTimeout(globalTimer);
  process.exit(1);
});
