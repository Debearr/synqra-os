import { NextRequest, NextResponse } from "next/server";
import { getLoaderStatus } from "@/lib/models/localModelLoader";
import { getRoutingStats } from "@/lib/models/intelligentRouter";
import { generateCostReport, analyzeRoutingEffectiveness } from "@/lib/models/selfLearning";
import { getHybridSystemStatus } from "@/lib/models/hybridAgent";

/**
 * ============================================================
 * MODEL SYSTEM STATUS ENDPOINT
 * ============================================================
 * GET /api/models/status
 * Real-time status of HuggingFace model stack
 */

export async function GET(request: NextRequest) {
  void request;
  try {
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
    console.error("Model status error:", error);

    return NextResponse.json(
      {
        error: "Failed to retrieve model status",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
