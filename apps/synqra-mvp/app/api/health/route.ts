import { NextResponse } from "next/server";
import { ragHealthCheck } from "@/lib/rag";
import { agentConfig, validateConfig } from "@/lib/agents";

/**
 * ============================================================
 * HEALTH CHECK ENDPOINT
 * ============================================================
 * Railway and monitoring systems use this to verify the app is running
 */

export async function GET() {
  try {
    // Check agent configuration
    const configValidation = validateConfig();

    // Check RAG system
    const ragHealth = ragHealthCheck();

    // Overall health status
    const isHealthy = configValidation.valid && ragHealth.status === "healthy";

    const response = {
      status: isHealthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      services: {
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
