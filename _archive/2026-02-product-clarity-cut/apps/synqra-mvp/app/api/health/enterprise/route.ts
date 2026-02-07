/**
 * ============================================================
 * ENTERPRISE HEALTH CHECK
 * ============================================================
 * Comprehensive health checks for production monitoring
 */

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  getSupabaseAnonKey,
  getSupabaseServiceRoleKey,
  getSupabaseUrl,
} from "@/lib/supabase/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type HealthCheck = {
  name: string;
  status: "pass" | "fail" | "warn";
  message: string;
  duration: number;
  timestamp: Date;
  metadata?: Record<string, unknown>;
};

type HealthReport = {
  overall: "healthy" | "degraded" | "critical";
  timestamp: Date;
  checks: HealthCheck[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
  };
  environment: string;
  autoRepairAttempted: boolean;
};

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const checks: HealthCheck[] = [];
  void request;

  try {
    // 1. Environment Variables Check
    checks.push(await checkEnvironmentVariables());

    // 2. Database Connection Check
    checks.push(await checkDatabaseConnection());

    // 3. Resource Usage Checks
    checks.push(await checkMemoryUsage());

    // Generate summary
    const passed = checks.filter((c) => c.status === "pass").length;
    const failed = checks.filter((c) => c.status === "fail").length;
    const warnings = checks.filter((c) => c.status === "warn").length;

    // Determine overall status
    let overall: HealthReport["overall"] = "healthy";
    if (failed > 0) {
      overall = failed >= 3 ? "critical" : "degraded";
    } else if (warnings > 2) {
      overall = "degraded";
    }

    const report: HealthReport = {
      overall,
      timestamp: new Date(),
      checks,
      summary: {
        total: checks.length,
        passed,
        failed,
        warnings,
      },
      environment: process.env.RAILWAY_ENVIRONMENT || "development",
      autoRepairAttempted: false,
    };

    const statusCode = overall === "healthy" ? 200 : overall === "degraded" ? 500 : 503;

    return NextResponse.json(report, { status: statusCode });
  } catch (error) {
    console.error("[ENTERPRISE HEALTH] Unexpected error:", error);

    const report: HealthReport = {
      overall: "critical",
      timestamp: new Date(),
      checks: [
        {
          name: "health_check_execution",
          status: "fail",
          message: error instanceof Error ? error.message : "Unknown error",
          duration: Date.now() - startTime,
          timestamp: new Date(),
        },
      ],
      summary: {
        total: 1,
        passed: 0,
        failed: 1,
        warnings: 0,
      },
      environment: process.env.RAILWAY_ENVIRONMENT || "development",
      autoRepairAttempted: false,
    };

    return NextResponse.json(report, { status: 503 });
  }
}

async function checkEnvironmentVariables(): Promise<HealthCheck> {
  const start = Date.now();
  const legacyAliases = ["SUPABASE_SERVICE_KEY", "SUPABASE_SERVICE_ROLE"].filter(
    (key) => !!process.env[key]
  );

  try {
    const supabaseUrl = getSupabaseUrl();
    const supabaseAnonKey = getSupabaseAnonKey();
    const supabaseServiceRoleKey = getSupabaseServiceRoleKey();

    const status: HealthCheck["status"] =
      legacyAliases.length > 0 || !process.env.SUPABASE_SERVICE_ROLE_KEY
        ? "warn"
        : "pass";
    const message =
      status === "warn"
        ? `Canonical Supabase vars resolved with legacy aliases present: ${legacyAliases.join(
            ", "
          ) || "none"}`
        : "Canonical Supabase env vars present";

    return {
      name: "environment_variables",
      status,
      message,
      duration: Date.now() - start,
      timestamp: new Date(),
      metadata: {
        supabaseUrl: Boolean(supabaseUrl),
        supabaseAnonKey: Boolean(supabaseAnonKey),
        supabaseServiceRoleKey: Boolean(supabaseServiceRoleKey),
        legacyAliases,
      },
    };
  } catch (error) {
    return {
      name: "environment_variables",
      status: "fail",
      message: error instanceof Error ? error.message : "Check failed",
      duration: Date.now() - start,
      timestamp: new Date(),
    };
  }
}

async function checkDatabaseConnection(): Promise<HealthCheck> {
  const start = Date.now();

  try {
    const supabase = createClient(getSupabaseUrl(), getSupabaseAnonKey());

    const { error } = await supabase
      .from("profiles")
      .select("count")
      .limit(1)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      return {
        name: "database_connection",
        status: "warn",
        message: `Database warning: ${error.message}`,
        duration: Date.now() - start,
        timestamp: new Date(),
      };
    }

    return {
      name: "database_connection",
      status: "pass",
      message: "Database connected",
      duration: Date.now() - start,
      timestamp: new Date(),
    };
  } catch (error) {
    return {
      name: "database_connection",
      status: "fail",
      message: error instanceof Error ? error.message : "Connection failed",
      duration: Date.now() - start,
      timestamp: new Date(),
    };
  }
}

async function checkMemoryUsage(): Promise<HealthCheck> {
  const start = Date.now();

  try {
    const used = process.memoryUsage();
    const heapUsedMB = Math.round(used.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(used.heapTotal / 1024 / 1024);
    const rssMB = Math.round(used.rss / 1024 / 1024);
    const heapUsagePercent = (heapUsedMB / heapTotalMB) * 100;

    if (heapUsagePercent > 90) {
      return {
        name: "memory_usage",
        status: "fail",
        message: `High memory usage: ${heapUsedMB}MB / ${heapTotalMB}MB (${heapUsagePercent.toFixed(1)}%)`,
        duration: Date.now() - start,
        timestamp: new Date(),
        metadata: { heapUsedMB, heapTotalMB, rssMB, heapUsagePercent },
      };
    }

    if (heapUsagePercent > 80) {
      return {
        name: "memory_usage",
        status: "warn",
        message: `Memory usage: ${heapUsedMB}MB / ${heapTotalMB}MB (${heapUsagePercent.toFixed(1)}%)`,
        duration: Date.now() - start,
        timestamp: new Date(),
        metadata: { heapUsedMB, heapTotalMB, rssMB, heapUsagePercent },
      };
    }

    return {
      name: "memory_usage",
      status: "pass",
      message: `Memory usage: ${heapUsedMB}MB / ${heapTotalMB}MB (${heapUsagePercent.toFixed(1)}%)`,
      duration: Date.now() - start,
      timestamp: new Date(),
      metadata: { heapUsedMB, heapTotalMB, rssMB, heapUsagePercent },
    };
  } catch {
    return {
      name: "memory_usage",
      status: "warn",
      message: "Could not check memory",
      duration: Date.now() - start,
      timestamp: new Date(),
    };
  }
}
