import { NextRequest, NextResponse } from "next/server";
import { runFullBenchmark } from "@/lib/models/benchmark";
import {
  buildAgentErrorEnvelope,
  ensureCorrelationId,
  enforceKillSwitch,
  logSafeguard,
  normalizeError,
} from "@/lib/safeguards";

/**
 * ============================================================
 * BENCHMARK API ENDPOINT
 * ============================================================
 * POST /api/models/benchmark
 * Run comprehensive benchmark suite
 */

export async function POST(request: NextRequest) {
  const correlationId = ensureCorrelationId(request.headers.get("x-correlation-id"));

  try {
    logSafeguard({
      level: "info",
      message: "models.benchmark.start",
      scope: "models/benchmark",
      correlationId,
    });

    enforceKillSwitch({ scope: "models/benchmark", correlationId });
    
    const results = await runFullBenchmark();
    
    return NextResponse.json({
      correlationId,
      success: true,
      ...results,
    });
  } catch (error) {
    const normalized = normalizeError(error);
    const resolvedCorrelationId = ensureCorrelationId(
      (error as any)?.correlationId || correlationId
    );
    logSafeguard({
      level: "error",
      message: "models.benchmark.error",
      scope: "models/benchmark",
      correlationId: resolvedCorrelationId,
      data: { code: normalized.code },
    });

    return NextResponse.json(
      buildAgentErrorEnvelope({
        error: normalized,
        correlationId: resolvedCorrelationId,
        extras: { message: normalized.safeMessage },
      }),
      { status: normalized.status }
    );
  }
}

/**
 * GET /api/models/benchmark
 * Get benchmark history (placeholder)
 */
export async function GET(request: NextRequest) {
  const correlationId = ensureCorrelationId(request.headers.get("x-correlation-id"));

  try {
    enforceKillSwitch({ scope: "models/benchmark", correlationId });

    return NextResponse.json({
      correlationId,
      message: "Benchmark history not yet implemented",
      endpoint: "POST /api/models/benchmark to run new benchmark",
    });
  } catch (error) {
    const normalized = normalizeError(error);
    const resolvedCorrelationId = ensureCorrelationId(
      (error as any)?.correlationId || correlationId
    );

    return NextResponse.json(
      buildAgentErrorEnvelope({
        error: normalized,
        correlationId: resolvedCorrelationId,
        extras: { message: normalized.safeMessage },
      }),
      { status: normalized.status }
    );
  }
}
