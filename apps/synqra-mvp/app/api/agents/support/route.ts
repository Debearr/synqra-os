import { NextRequest, NextResponse } from "next/server";
import { supportAgent, AgentRequestSchema, type AgentRequest } from "@/lib/agents";
import { retrieveDocuments, formatDocumentsAsContext } from "@/lib/rag";
import { applySafetyGuardrails } from "@/lib/safety";
import { agentConfig } from "@/lib/agents/base/config";

/**
 * ============================================================
 * SUPPORT AGENT ENDPOINT
 * ============================================================
 * POST /api/agents/support
 * Direct invocation of the Support Agent
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = AgentRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request",
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const agentRequest: AgentRequest = validationResult.data;

    // Retrieve RAG context if enabled
    let enhancedRequest = agentRequest;
    if (agentConfig.rag.enabled && agentRequest.context?.useRAG !== false) {
      const documents = await retrieveDocuments(agentRequest.message, {
        category: "support", // Support-specific category hint
      });

      if (documents.length > 0) {
        const ragContext = formatDocumentsAsContext(documents);
        enhancedRequest = {
          ...agentRequest,
          context: {
            ...agentRequest.context,
            ragContext,
            ragDocuments: documents,
          },
        };
      }
    }

    // Invoke support agent
    const response = await supportAgent.invoke(enhancedRequest);

    // Apply safety guardrails
    const { response: safeResponse, safetyReport } =
      applySafetyGuardrails(response);

    return NextResponse.json({
      agent: "support",
      response: safeResponse,
      safety: {
        recommendation: safetyReport.recommendation,
        confidence: safetyReport.overallConfidence,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Support agent error:", error);

    return NextResponse.json(
      {
        error: "Support agent invocation failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/agents/support
 * Get support agent info
 */
export async function GET() {
  return NextResponse.json({
    ...supportAgent.getInfo(),
    endpoint: "/api/agents/support",
    mode: agentConfig.agent.mode,
  });
}
