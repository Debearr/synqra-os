#!/usr/bin/env node
import { createClient } from "@supabase/supabase-js";
import fetch from "node-fetch";
import fs from "fs";
import path from "path";

const GLOBAL_TIMEOUT = 240000;
const globalTimer = setTimeout(() => {
  console.error("💥 Global timeout exceeded");
  process.exit(1);
}, GLOBAL_TIMEOUT);

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

const required = ["SUPABASE_URL", "SUPABASE_SERVICE_KEY", "N8N_WEBHOOK_URL"];
const missing = required.filter(v => !process.env[v]);

if (missing.length) {
  console.error(`❌ Missing environment variables: ${missing.join(", ")}`);
  process.exit(1);
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const MAX_RETRIES = 3;
const BASE_DELAY = 2000;
const REQUEST_TIMEOUT = 10000;

function logToFile(data) {
  try {
    const logPath = path.join(process.cwd(), ".healthcell", "local-logs.jsonl");
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
    const { error } = await supabase
      .from("health_logs")
      .insert([data]);
    
    if (error) throw error;
  } catch (error) {
    console.error("⚠️ Supabase logging failed:", error.message);
    logToFile(data);
  }
}

async function notifyN8N(payload, retries = 2) {
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
    console.log(`🔍 [Attempt ${attempt}/${MAX_RETRIES}] Checking Supabase health...`);
    
    const { data: dbCheck, error: dbError } = await supabase
      .from("health_logs")
      .select("id")
      .limit(1);
    
    if (dbError) throw new Error(`DB query failed: ${dbError.message}`);
    
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
    
    const responseTime = Date.now() - startTime;
    
    await logHealth({
      check_id: checkId,
      status: "success",
      response_time_ms: responseTime,
      attempt_number: attempt,
      message: "All checks passed",
      timestamp: new Date().toISOString()
    });
    
    console.log(`✅ Supabase healthy (${responseTime}ms)`);
    clearTimeout(globalTimer);
    process.exit(0);
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`❌ [Attempt ${attempt}/${MAX_RETRIES}] Failed:`, error.message);
    
    await logHealth({
      check_id: checkId,
      status: "failed",
      response_time_ms: responseTime,
      attempt_number: attempt,
      message: error.message,
      error_stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    if (attempt < MAX_RETRIES) {
      const waitTime = BASE_DELAY * Math.pow(2, attempt - 1);
      console.log(`⏳ Retrying in ${waitTime / 1000}s...`);
      await delay(attempt - 1);
      return checkHealth(attempt + 1);
    }
    
    console.log("🚨 All retries exhausted - triggering recovery...");
    
    await notifyN8N({
      check_id: checkId,
      status: "critical_failure",
      attempts: MAX_RETRIES,
      last_error: error.message,
      timestamp: new Date().toISOString(),
      service: "supabase",
      action_required: "investigate_and_restart"
    });
    
    clearTimeout(globalTimer);
    process.exit(1);
  }
}

checkHealth().catch(error => {
  console.error("💥 Unexpected error:", error);
  clearTimeout(globalTimer);
  process.exit(1);
});
