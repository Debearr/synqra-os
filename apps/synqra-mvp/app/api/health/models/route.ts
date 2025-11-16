import { NextRequest, NextResponse } from "next/server";
import { getLoaderStatus } from "@/lib/models/localModelLoader";
import { getRoutingStats } from "@/lib/models/intelligentRouter";

/**
 * ============================================================
 * MODEL HEALTH CHECK
 * ============================================================
 * GET /api/health/models
 * Health check endpoint for model system
 */

export async function GET(request: NextRequest) {
  try {
    const loaderStatus = getLoaderStatus();
    const routingStats = getRoutingStats();
    
    // Determine health status
    const hasLoadedModels = loaderStatus.loaded.length > 0;
    const hasFailedModels = loaderStatus.failed.length > 0;
    const memoryOK = loaderStatus.totalMemoryMB < 4096; // 4GB threshold
    
    let status: "healthy" | "degraded" | "unhealthy";
    
    if (hasLoadedModels && !hasFailedModels && memoryOK) {
      status = "healthy";
    } else if (hasLoadedModels && (hasFailedModels || !memoryOK)) {
      status = "degraded";
    } else {
      status = "unhealthy";
    }
    
    const response = {
      status,
      timestamp: new Date().toISOString(),
      models: {
        loaded: loaderStatus.loaded.length,
        failed: loaderStatus.failed.length,
        loading: loaderStatus.loading.length,
      },
      routing: {
        totalRequests: routingStats.totalRequests,
        localPercentage: Math.round(routingStats.localPercentage),
      },
      memory: {
        used: loaderStatus.totalMemoryMB,
        threshold: 4096,
        ok: memoryOK,
      },
    };
    
    // Return 503 if unhealthy
    if (status === "unhealthy") {
      return NextResponse.json(response, { status: 503 });
    }
    
    return NextResponse.json(response);
  } catch (error) {
    console.error("Model health check error:", error);

    return NextResponse.json(
      {
        status: "unhealthy",
        error: "Health check failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 }
    );
  }
}
