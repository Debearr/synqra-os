import { NextRequest, NextResponse } from "next/server";
import {
  createGuardrailSystem,
  type ProjectName,
} from "@/shared/guardrails/noid-guardrail-system";

/**
 * ════════════════════════════════════════════════════════════════
 * GUARDRAIL CHECK ENDPOINT
 * ════════════════════════════════════════════════════════════════
 * 
 * POST /api/guardrails/check
 * 
 * Run guardrail checks on a request before processing
 * 
 * Request body:
 * {
 *   project: "synqra" | "noid" | "aurafx",
 *   operation: "generate_content" | "post_content" | etc,
 *   estimatedCost?: number,
 *   content?: string,
 *   userId?: string,
 *   metadata?: object
 * }
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      project = "synqra",
      operation,
      estimatedCost,
      content,
      userId,
      metadata = {},
    } = body;

    if (!operation) {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid request",
          message: "Operation is required",
        },
        { status: 400 }
      );
    }

    // Create guardrail system
    const guardrails = createGuardrailSystem(project as ProjectName);

    // Generate request ID
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Run all guardrail checks
    const checkResult = await guardrails.runAllChecks({
      userId,
      requestId,
      operation,
      estimatedCost,
      content,
      metadata,
    });

    // Determine response status
    const responseStatus = checkResult.allowed ? 200 : 403;

    // Prepare response
    const response = {
      ok: checkResult.allowed,
      requestId,
      allowed: checkResult.allowed,
      project,
      operation,
      overallLevel: checkResult.overallLevel,
      results: checkResult.results.map((r) => ({
        category: r.category,
        passed: r.passed,
        level: r.level,
        message: r.message,
        violations: r.violations,
        recommendations: r.recommendations,
      })),
      violations: checkResult.violations.map((v) => ({
        category: v.category,
        level: v.level,
        rule: v.rule,
        description: v.description,
        action: v.action,
      })),
      summary: {
        totalChecks: checkResult.results.length,
        passed: checkResult.results.filter((r) => r.passed).length,
        failed: checkResult.results.filter((r) => !r.passed).length,
        blocked: checkResult.violations.filter((v) => v.action === "blocked")
          .length,
      },
      recommendations: checkResult.allowed
        ? []
        : checkResult.results
            .filter((r) => !r.passed)
            .flatMap((r) => r.recommendations),
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response, { status: responseStatus });
  } catch (error) {
    console.error("[Guardrail Check Error]:", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Guardrail check failed",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS /api/guardrails/check
 * 
 * CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
