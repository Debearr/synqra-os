import { NextResponse } from "next/server";
import { ragHealthCheck } from "@/lib/rag";
import { agentConfig, validateConfig } from "@/lib/agents";

/**
 * ============================================================
 * HEALTH CHECK ENDPOINT
 * ============================================================
 * Railway and monitoring systems use this to verify the app is running
 * Includes: Database, Agents, RAG, and Supabase connectivity
 */

async function checkSupabaseHealth() {
  try {
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return { status: "unconfigured", message: "Supabase credentials not set" };
    }

    const startTime = Date.now();
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: "GET",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      signal: AbortSignal.timeout(5000),
    });

    const responseTime = Date.now() - startTime;

    if (response.ok) {
      return {
        status: "healthy",
        responseTime: `${responseTime}ms`,
      };
    } else {
      return {
        status: "degraded",
        responseTime: `${responseTime}ms`,
        error: `HTTP ${response.status}`,
      };
    }
  } catch (error) {
    return {
      status: "down",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function performHealthCheck() {
  try {
    const startTime = Date.now();

    // Run all checks in parallel
    const [configValidation, ragHealth, supabaseHealth] = await Promise.all([
      Promise.resolve(validateConfig()),
      Promise.resolve(ragHealthCheck()),
      checkSupabaseHealth(),
    ]);

    // Overall health status
    const isHealthy =
      configValidation.valid &&
      ragHealth.status === "healthy" &&
      supabaseHealth.status === "healthy";

    const totalTime = Date.now() - startTime;

    const response = {
      status: isHealthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      responseTime: `${totalTime}ms`,
      services: {
        database: supabaseHealth,
        agents: {
          status: configValidation.valid ? "healthy" : "degraded",
          mode: agentConfig.agent.mode,
          errors: configValidation.errors,
        },
        rag: {
          status: ragHealth.status,
          documentsCount: ragHealth.documentsCount,
          categoriesCount: ragHealth.categoriesCount,
        },
      },
      version: "1.0.0",
    };

    return NextResponse.json(response, {
      status: isHealthy ? 200 : 503,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Health check failed:", error);

    return NextResponse.json(
      {
        status: "down",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      }
    );
  }
}

export async function GET() {
  return performHealthCheck();
}

export async function HEAD() {
  const response = await performHealthCheck();
  return new NextResponse(null, {
    status: response.status,
    headers: response.headers,
  });
}
