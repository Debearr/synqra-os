import { NextRequest, NextResponse } from "next/server";
import {
  createGuardrailSystem,
  type ProjectName,
} from "@/shared/guardrails/noid-guardrail-system";

/**
 * ════════════════════════════════════════════════════════════════
 * GUARDRAIL STATUS ENDPOINT
 * ════════════════════════════════════════════════════════════════
 * 
 * GET /api/guardrails/status
 * 
 * Returns current guardrail configuration and violation history
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const project = (searchParams.get("project") || "synqra") as ProjectName;

    // Create guardrail system
    const guardrails = createGuardrailSystem(project);

    // Get configuration
    const config = guardrails.getConfig();

    // Get recent violations
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000); // Last 24 hours
    const recentViolations = guardrails.getViolations({ since });

    // Calculate violation statistics
    const violationStats = {
      total: recentViolations.length,
      byCategory: recentViolations.reduce((acc, v) => {
        acc[v.category] = (acc[v.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byLevel: recentViolations.reduce((acc, v) => {
        acc[v.level] = (acc[v.level] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      blocked: recentViolations.filter((v) => v.action === "blocked").length,
    };

    return NextResponse.json(
      {
        ok: true,
        project,
        status: "active",
        config: {
          enabled: config.enabled,
          level: config.level,
          rules: {
            budget: {
              monthlyLimit: config.rules.budget.monthlyLimit,
              alertThresholds: config.rules.budget.alertThresholds,
            },
            safety: {
              hallucinationDetection: config.rules.safety.hallucinationDetection,
              piiProtection: config.rules.safety.piiProtection,
            },
            privacy: {
              gdprCompliance: config.rules.privacy.gdprCompliance,
              ccpaCompliance: config.rules.privacy.ccpaCompliance,
            },
            brand: {
              voiceConsistencyCheck: config.rules.brand.voiceConsistencyCheck,
            },
            rate: {
              requestsPerMinute: config.rules.rate.requestsPerMinute,
              requestsPerHour: config.rules.rate.requestsPerHour,
            },
            isolation: {
              enforceProjectBoundaries:
                config.rules.isolation.enforceProjectBoundaries,
            },
          },
        },
        violations: {
          last24Hours: violationStats,
          recent: recentViolations.slice(0, 10), // Last 10 violations
        },
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Guardrails Status Error]:", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Failed to fetch guardrail status",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/guardrails/status
 * 
 * Update guardrail configuration (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: Add admin authentication
    const adminToken = request.headers.get("x-admin-token");
    if (adminToken !== process.env.ADMIN_TOKEN) {
      return NextResponse.json(
        {
          ok: false,
          error: "Unauthorized",
          message: "Admin token required",
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { project, updates } = body;

    if (!project || !updates) {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid request",
          message: "Project and updates required",
        },
        { status: 400 }
      );
    }

    // Create and update guardrail system
    const guardrails = createGuardrailSystem(project as ProjectName);
    guardrails.updateConfig(updates);

    return NextResponse.json(
      {
        ok: true,
        message: "Guardrail configuration updated",
        project,
        updatedConfig: guardrails.getConfig(),
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Guardrails Update Error]:", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Failed to update guardrail configuration",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
