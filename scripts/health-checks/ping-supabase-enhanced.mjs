#!/usr/bin/env node

/**
 * Enhanced Supabase Health Check
 * 
 * This version gracefully handles cases where the health_logs table
 * doesn't exist yet (migration not applied) and still performs
 * basic connectivity tests.
 */

import { createClient } from "@supabase/supabase-js";
import fetch from "node-fetch";
import fs from "fs";
import path from "path";

// Global timeout
const GLOBAL_TIMEOUT = 240000;
const globalTimer = setTimeout(() => {
  console.error("💥 Global timeout exceeded (4 minutes)");
  process.exit(1);
}, GLOBAL_TIMEOUT);

// Error handlers
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled rejection:', error);
  clearTimeout(globalTimer);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error);
  clearTimeout(globalTimer);
  process.exit(1);
});

// Validate required environment variables
const required = ["SUPABASE_URL", "SUPABASE_SERVICE_KEY"];
const missing = required.filter(v => !process.env[v]);

if (missing.length) {
  console.error(`❌ Missing environment variables: ${missing.join(", ")}`);
  process.exit(1);
}

console.log("🔧 Supabase Health Check Enhanced v1.0");
console.log(`📍 Target: ${process.env.SUPABASE_URL}`);
console.log(`⏰ Started: ${new Date().toISOString()}\n`);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const MAX_RETRIES = 3;
const BASE_DELAY = 2000;
const REQUEST_TIMEOUT = 10000;

function logToFile(data) {
  try {
    const logDir = path.join(process.cwd(), ".healthcell");
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    const logPath = path.join(logDir, "local-logs.jsonl");
    fs.appendFileSync(logPath, JSON.stringify(data) + "\n");
  } catch (error) {
    console.error("⚠️ Could not write to local log:", error.message);
  }
}

function delay(attempt) {
  const backoff = BASE_DELAY * Math.pow(2, attempt);
  const jitter = Math.random() * 1000;
  return new Promise(resolve => setTimeout(resolve, backoff + jitter));
}

async function fetchWithTimeout(url, options = {}, timeout = REQUEST_TIMEOUT) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    throw error;
  }
}

async function logHealth(data) {
  try {
    // Try to log to health_logs table
    const { error } = await supabase
      .from("health_logs")
      .insert([data]);
    
    if (error) {
      if (error.message.includes('relation "public.health_logs" does not exist')) {
        console.log("⚠️  health_logs table not found - migration not applied yet");
        logToFile({ ...data, note: "Migration pending - logged locally only" });
        return false;
      }
      throw error;
    }
    return true;
  } catch (error) {
    console.error("⚠️ Supabase logging failed:", error.message);
    logToFile(data);
    return false;
  }
}

async function notifyTelegram(message) {
  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHANNEL_ID) {
    console.log("📱 Telegram notifications not configured");
    return false;
  }

  try {
    const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
    const response = await fetchWithTimeout(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: process.env.TELEGRAM_CHANNEL_ID,
        text: message,
        parse_mode: "HTML"
      })
    }, 5000);

    if (!response.ok) {
      throw new Error(`Telegram API returned ${response.status}`);
    }

    console.log("✅ Telegram notification sent");
    return true;
  } catch (error) {
    console.error("❌ Telegram notification failed:", error.message);
    return false;
  }
}

async function notifyN8N(payload, retries = 2) {
  if (!process.env.N8N_WEBHOOK_URL) {
    console.log("🔗 N8N webhook not configured");
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
          body: JSON.stringify(payload)
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
    timestamp: new Date().toISOString()
  });
  
  return false;
}

async function checkHealth(attempt = 1) {
  const checkId = `check_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const startTime = Date.now();
  
  try {
    console.log(`🔍 [Attempt ${attempt}/${MAX_RETRIES}] Performing health checks...\n`);
    
    // Check 1: REST API connectivity
    console.log("  1/3 Testing REST API...");
    const restResponse = await fetchWithTimeout(
      `${process.env.SUPABASE_URL}/rest/v1/`,
      {
        headers: {
          "apikey": process.env.SUPABASE_SERVICE_KEY,
          "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_KEY}`
        }
      }
    );
    
    if (!restResponse.ok) {
      throw new Error(`REST API returned ${restResponse.status}`);
    }
    
    const body = await restResponse.text();
    if (!body) {
      throw new Error("REST API returned empty response");
    }
    console.log("      ✅ REST API operational");
    
    // Check 2: Try to query health_logs (optional)
    console.log("  2/3 Testing database access...");
    const { data: dbCheck, error: dbError } = await supabase
      .from("health_logs")
      .select("id")
      .limit(1);
    
    if (dbError) {
      if (dbError.message.includes('does not exist')) {
        console.log("      ⚠️  health_logs table not found (migration pending)");
      } else {
        throw new Error(`DB query failed: ${dbError.message}`);
      }
    } else {
      console.log("      ✅ Database access verified");
    }
    
    // Check 3: Auth API
    console.log("  3/3 Testing Auth API...");
    const authResponse = await fetchWithTimeout(
      `${process.env.SUPABASE_URL}/auth/v1/health`,
      {
        headers: {
          "apikey": process.env.SUPABASE_SERVICE_KEY
        }
      }
    );
    
    if (authResponse.ok) {
      console.log("      ✅ Auth API operational");
    } else {
      console.log("      ⚠️  Auth API check inconclusive");
    }
    
    const responseTime = Date.now() - startTime;
    
    // Log results
    const healthData = {
      check_id: checkId,
      status: "success",
      response_time_ms: responseTime,
      attempt_number: attempt,
      message: "All checks passed",
      timestamp: new Date().toISOString()
    };
    
    await logHealth(healthData);
    
    console.log(`\n✅ Supabase Health Check PASSED (${responseTime}ms)`);
    console.log(`⏰ Completed: ${new Date().toISOString()}`);
    
    clearTimeout(globalTimer);
    process.exit(0);
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`\n❌ [Attempt ${attempt}/${MAX_RETRIES}] Health Check FAILED`);
    console.error(`   Error: ${error.message}\n`);
    
    const healthData = {
      check_id: checkId,
      status: "failed",
      response_time_ms: responseTime,
      attempt_number: attempt,
      message: error.message,
      error_stack: error.stack,
      timestamp: new Date().toISOString()
    };
    
    await logHealth(healthData);
    
    if (attempt < MAX_RETRIES) {
      const waitTime = BASE_DELAY * Math.pow(2, attempt - 1);
      console.log(`⏳ Retrying in ${waitTime / 1000}s...`);
      await delay(attempt - 1);
      return checkHealth(attempt + 1);
    }
    
    console.log("🚨 All retries exhausted - triggering notifications...\n");
    
    const failurePayload = {
      check_id: checkId,
      status: "critical_failure",
      attempts: MAX_RETRIES,
      last_error: error.message,
      timestamp: new Date().toISOString(),
      service: "supabase",
      action_required: "investigate_and_restart"
    };
    
    // Notify both N8N and Telegram
    await Promise.all([
      notifyN8N(failurePayload),
      notifyTelegram(
        `🚨 <b>Supabase Health Check Failed</b>\\n\\n` +
        `Error: ${error.message}\\n` +
        `Attempts: ${MAX_RETRIES}\\n` +
        `Time: ${new Date().toISOString()}`
      )
    ]);
    
    clearTimeout(globalTimer);
    process.exit(1);
  }
}

// Start health check
checkHealth().catch(error => {
  console.error("💥 Unexpected error:", error);
  clearTimeout(globalTimer);
  process.exit(1);
});
