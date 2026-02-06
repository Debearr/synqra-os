import { NextRequest, NextResponse } from "next/server";
import { runFullBenchmark } from "@/lib/models/benchmark";

/**
 * ============================================================
 * BENCHMARK API ENDPOINT
 * ============================================================
 * POST /api/models/benchmark
 * Run comprehensive benchmark suite
 */

export async function POST(request: NextRequest) {
  void request;
  try {
    console.log("🚀 Starting benchmark suite...");
    
    const results = await runFullBenchmark();
    
    return NextResponse.json({
      success: true,
      ...results,
    });
  } catch (error) {
    console.error("Benchmark error:", error);

    return NextResponse.json(
      {
        error: "Failed to run benchmark",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/models/benchmark
 * Get benchmark history (placeholder)
 */
export async function GET(request: NextRequest) {
  void request;
  return NextResponse.json({
    message: "Benchmark history not yet implemented",
    endpoint: "POST /api/models/benchmark to run new benchmark",
  });
}
