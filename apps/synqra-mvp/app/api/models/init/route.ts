import { NextRequest, NextResponse } from "next/server";
import { initializeModels } from "@/lib/models/localModelLoader";
import {
  buildAgentErrorEnvelope,
  ensureCorrelationId,
  enforceKillSwitch,
  logSafeguard,
  normalizeError,
} from "@/lib/safeguards";

/**
 * ============================================================
 * MODEL INITIALIZATION ENDPOINT
 * ============================================================
 * POST /api/models/init
 * Manually trigger model initialization (preload models)
 */

export async function POST(request: NextRequest) {
  const correlationId = ensureCorrelationId(request.headers.get("x-correlation-id"));

  try {
    logSafeguard({
      level: "info",
      message: "models.init.start",
      scope: "models/init",
      correlationId,
    });

    enforceKillSwitch({ scope: "models/init", correlationId });

    const result = await initializeModels();
    
    if (result.success) {
      return NextResponse.json({
        correlationId,
        success: true,
        message: "Models initialized successfully",
        loaded: result.loaded,
        failed: result.failed,
        timestamp: new Date().toISOString(),
      });
    } else {
      return NextResponse.json(
        {
          correlationId,
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
    const normalized = normalizeError(error);
    const resolvedCorrelationId = ensureCorrelationId(
      (error as any)?.correlationId || correlationId
    );
    logSafeguard({
      level: "error",
      message: "models.init.error",
      scope: "models/init",
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
 * GET /api/models/init
 * Check if models are initialized
 */
export async function GET(request: NextRequest) {
  const correlationId = ensureCorrelationId(request.headers.get("x-correlation-id"));

  try {
    enforceKillSwitch({ scope: "models/init", correlationId });

    const { getLoaderStatus } = await import("@/lib/models/localModelLoader");
    const status = getLoaderStatus();
    
    return NextResponse.json({
      correlationId,
      initialized: status.loaded.length > 0,
      loaded: status.loaded,
      loading: status.loading,
      failed: status.failed,
      timestamp: new Date().toISOString(),
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
