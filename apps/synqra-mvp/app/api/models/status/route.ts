import { NextRequest, NextResponse } from "next/server";
import { getLoaderStatus } from "@/lib/models/localModelLoader";
import { getRoutingStats } from "@/lib/models/intelligentRouter";
import { generateCostReport, analyzeRoutingEffectiveness } from "@/lib/models/selfLearning";
import { getHybridSystemStatus } from "@/lib/models/hybridAgent";
import {
  buildAgentErrorEnvelope,
  ensureCorrelationId,
  enforceKillSwitch,
  normalizeError,
} from "@/lib/safeguards";

/**
 * ============================================================
 * MODEL SYSTEM STATUS ENDPOINT
 * ============================================================
 * GET /api/models/status
 * Real-time status of HuggingFace model stack
 */

export async function GET(request: NextRequest) {
  const correlationId = ensureCorrelationId(request.headers.get("x-correlation-id"));

  try {
    enforceKillSwitch({ scope: "models/status", correlationId });

    // Gather all status information
    const [
      loaderStatus,
      routingStats,
      costReport,
      routingAnalysis,
      hybridStatus,
    ] = await Promise.all([
      Promise.resolve(getLoaderStatus()),
      Promise.resolve(getRoutingStats()),
      Promise.resolve(generateCostReport()),
      Promise.resolve(analyzeRoutingEffectiveness()),
      Promise.resolve(getHybridSystemStatus()),
    ]);

    return NextResponse.json({
      correlationId,
      status: "operational",
      timestamp: new Date().toISOString(),
      
      models: {
        loaded: loaderStatus.loaded,
        loading: loaderStatus.loading,
        failed: loaderStatus.failed,
        totalMemoryMB: loaderStatus.totalMemoryMB,
      },
      
      routing: {
        totalRequests: routingStats.totalRequests,
        localPercentage: Math.round(routingStats.localPercentage),
        apiPercentage: Math.round(routingStats.apiPercentage),
        costSaved: routingStats.costSaved.toFixed(2),
      },
      
      costs: {
        totalInferences: costReport.totalInferences,
        localInferences: costReport.localInferences,
        apiInferences: costReport.apiInferences,
        estimatedCostAPI: costReport.estimatedCostAPI.toFixed(2),
        savings: costReport.savings.toFixed(2),
        savingsPercentage: Math.round(costReport.savingsPercentage),
      },
      
      performance: {
        totalDataPoints: routingAnalysis.totalDataPoints,
        avgQualityByComplexity: routingAnalysis.avgQualityByComplexity,
        costEfficiency: Math.round(routingAnalysis.costEfficiency * 100),
        recommendations: routingAnalysis.recommendations,
      },
      
      system: {
        localModelsAvailable: hybridStatus.localModelsAvailable,
        apiModelsAvailable: hybridStatus.apiModelsAvailable,
        recommendedMode: hybridStatus.recommendedMode,
        costSavingsTarget: Math.round(hybridStatus.costSavings * 100) + "%",
      },
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
