import { NextRequest, NextResponse } from "next/server";
import { initializeModels } from "@/lib/models/localModelLoader";

/**
 * ============================================================
 * MODEL INITIALIZATION ENDPOINT
 * ============================================================
 * POST /api/models/init
 * Manually trigger model initialization (preload models)
 */

export async function POST(request: NextRequest) {
  void request;
  try {
    console.log("🚀 Initializing local models...");
    
    const result = await initializeModels();
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "Models initialized successfully",
        loaded: result.loaded,
        failed: result.failed,
        timestamp: new Date().toISOString(),
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "Some models failed to load",
          loaded: result.loaded,
          failed: result.failed,
          timestamp: new Date().toISOString(),
        },
        { status: 207 } // Multi-status
      );
    }
  } catch (error) {
    console.error("Model initialization error:", error);

    return NextResponse.json(
      {
        error: "Failed to initialize models",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/models/init
 * Check if models are initialized
 */
export async function GET(request: NextRequest) {
  void request;
  const { getLoaderStatus } = await import("@/lib/models/localModelLoader");
  const status = getLoaderStatus();
  
  return NextResponse.json({
    initialized: status.loaded.length > 0,
    loaded: status.loaded,
    loading: status.loading,
    failed: status.failed,
    timestamp: new Date().toISOString(),
  });
}
