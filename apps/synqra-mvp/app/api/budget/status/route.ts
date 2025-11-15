import { NextRequest, NextResponse } from "next/server";
import { getBudgetStatus } from "@/lib/agents/budgetGuardrails";

/**
 * ============================================================
 * BUDGET STATUS MONITORING ENDPOINT
 * ============================================================
 * GET /api/budget/status
 * Real-time budget tracking and cost monitoring
 */

export async function GET(request: NextRequest) {
  try {
    const status = getBudgetStatus();

    // Determine overall health
    let health: "healthy" | "warning" | "critical" | "emergency" = "healthy";
    if (status.isLocked) {
      health = "emergency";
    } else if (status.monthly.percentage >= 85) {
      health = "critical";
    } else if (status.monthly.percentage >= 70) {
      health = "warning";
    }

    return NextResponse.json({
      status: health,
      budget: {
        monthly: {
          limit: status.monthly.limit,
          used: status.monthly.used,
          remaining: status.monthly.limit - status.monthly.used,
          percentage: Math.round(status.monthly.percentage),
        },
        daily: {
          limit: status.daily.limit,
          used: status.daily.used,
          remaining: status.daily.limit - status.daily.used,
          percentage: Math.round(status.daily.percentage),
        },
        hourly: {
          limit: status.hourly.limit,
          used: status.hourly.used,
          remaining: status.hourly.limit - status.hourly.used,
          percentage: Math.round(status.hourly.percentage),
        },
      },
      projections: {
        monthlyTotal: status.projectedMonthlyTotal,
        willExceedBudget: status.projectedMonthlyTotal > status.monthly.limit,
      },
      locked: status.isLocked,
      alerts: {
        warningThreshold: 70,
        criticalThreshold: 85,
        emergencyThreshold: 95,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Budget status error:", error);

    return NextResponse.json(
      {
        error: "Failed to retrieve budget status",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
