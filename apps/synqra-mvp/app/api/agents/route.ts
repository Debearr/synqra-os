import { NextRequest, NextResponse } from "next/server";
import {
  routeToAgent,
  getAgent,
  AgentRequestSchema,
  type AgentRequest,
} from "@/lib/agents";
import { retrieveDocuments, formatDocumentsAsContext } from "@/lib/rag";
import { applySafetyGuardrails } from "@/lib/safety";
import { agentConfig } from "@/lib/agents/base/config";

/**
 * ============================================================
 * MAIN AGENT INVOCATION ENDPOINT
 * ============================================================
 * POST /api/agents
 * Automatically routes to the appropriate agent based on message content
 */

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
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

    // Route to appropriate agent
    const routing = routeToAgent(agentRequest.message);

    if (agentConfig.dev.debugAgents) {
      console.log(`🔀 Routing to ${routing.agent} agent (${(routing.confidence * 100).toFixed(0)}% confidence)`);
      console.log(`   Reason: ${routing.reason}`);
    }

    // Get the appropriate agent
    const agent = getAgent(routing.agent);

    // Retrieve RAG context if enabled
    let enhancedRequest = agentRequest;
    if (agentConfig.rag.enabled && agentRequest.context?.useRAG !== false) {
      const documents = await retrieveDocuments(agentRequest.message);

      if (documents.length > 0) {
        const ragContext = formatDocumentsAsContext(documents);

        // Enhance the message with RAG context
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

    // Invoke the agent
    const response = await agent.invoke(enhancedRequest);

    // Apply safety guardrails
    const { response: safeResponse, safetyReport } =
      applySafetyGuardrails(response);

    // Build API response
    const apiResponse = {
      agent: routing.agent,
      routing: {
        confidence: routing.confidence,
        reason: routing.reason,
      },
      response: safeResponse,
      safety: {
        recommendation: safetyReport.recommendation,
        confidence: safetyReport.overallConfidence,
        flags:
          safetyReport.recommendation !== "allow"
            ? [
                ...safetyReport.checks.hallucination.flags,
                ...safetyReport.checks.unsafe.flags,
                ...safetyReport.checks.confidence.flags,
              ]
            : [],
      },
      timestamp: new Date().toISOString(),
    };

    // Add warning header if safety review recommended
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (safetyReport.recommendation === "review") {
      headers["X-Safety-Review"] = "true";
    }

    return NextResponse.json(apiResponse, { headers });
  } catch (error) {
    console.error("Agent invocation error:", error);

    return NextResponse.json(
      {
        error: "Agent invocation failed",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/agents
 * List available agents
 */
export async function GET() {
  try {
    return NextResponse.json({
      agents: [
        {
          role: "sales",
          name: "Synqra Sales Agent",
          description:
            "Expert sales consultant for lead qualification and product inquiries",
          endpoint: "/api/agents/sales",
        },
        {
          role: "support",
          name: "Synqra Support Agent",
          description:
            "Technical support specialist for troubleshooting and issue resolution",
          endpoint: "/api/agents/support",
        },
        {
          role: "service",
          name: "Synqra Service Agent",
          description:
            "Customer service specialist for account management and billing",
          endpoint: "/api/agents/service",
        },
      ],
      mode: agentConfig.agent.mode,
      ragEnabled: agentConfig.rag.enabled,
      safetyEnabled: agentConfig.safety.hallucinationCheck,
    });
  } catch (error) {
    console.error("Failed to list agents:", error);

    return NextResponse.json(
      {
        error: "Failed to list agents",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
