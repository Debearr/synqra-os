import { NextRequest, NextResponse } from "next/server";
import {
  routeToAgent,
  getAgent,
  AgentRequestSchema,
  type AgentRequest,
} from "@/lib/agents";
import { createAgentConfirmationGate } from "@/lib/agents/shared/router";
import { retrieveDocuments, formatDocumentsAsContext } from "@/lib/rag";
import { applySafetyGuardrails } from "@/lib/safety";
import { agentConfig } from "@/lib/agents/base/config";
import {
  buildAgentErrorEnvelope,
  ensureCorrelationId,
  enforceKillSwitch,
  logSafeguard,
  normalizeError,
  requireConfirmation,
} from "@/lib/safeguards";
import { AppError } from "@/lib/safeguards/errors";

/**
 * ============================================================
 * MAIN AGENT INVOCATION ENDPOINT
 * ============================================================
 * POST /api/agents
 * Automatically routes to the appropriate agent based on message content
 */

export async function POST(request: NextRequest) {
  const correlationId = ensureCorrelationId(request.headers.get("x-correlation-id"));

  try {
    logSafeguard({
      level: "info",
      message: "agents.invoke.start",
      scope: "agents",
      correlationId,
    });

    enforceKillSwitch({ scope: "agents", correlationId });

    // Parse and validate request body
    const body = await request.json();
    const validationResult = AgentRequestSchema.safeParse(body);

    if (!validationResult.success) {
      const normalized = normalizeError(
        new AppError({
          message: "Invalid request",
          code: "invalid_request",
          status: 400,
          safeMessage:
            "We could not read this agent request. Please check the payload and try again.",
          details: { correlationId },
        })
      );

      return NextResponse.json(
        buildAgentErrorEnvelope({
          error: normalized,
          correlationId,
          extras: { details: validationResult.error.issues },
        }),
        { status: normalized.status }
      );
    }

    // HUMAN-IN-COMMAND: Require explicit confirmation before AI action
    // Client must include { confirmed: true } in request body
    requireConfirmation({
      confirmed: body.confirmed,
      context: "Agent invocation",
      correlationId,
    });

    const agentRequest: AgentRequest = validationResult.data;

    // Route to appropriate agent
    const routing = routeToAgent(agentRequest.message);

    if (agentConfig.dev.debugAgents) {
      console.log(`🔀 Routing to ${routing.agent} agent (${(routing.confidence * 100).toFixed(0)}% confidence)`);
      console.log(`   Reason: ${routing.reason}`);
      console.log(`   Response Tier: ${routing.responseTier} (cost optimization)`);
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

    // Create confirmation gate from validated human approval
    const confirmationGate = createAgentConfirmationGate();

    // Invoke the agent with optimized response tier
    const response = await agent.invoke(enhancedRequest, {
      responseTier: routing.responseTier, // Smart token budgeting
      confirmation: confirmationGate, // Human-in-command: confirmed at API boundary
    });

    // Apply safety guardrails
    const { response: safeResponse, safetyReport } =
      applySafetyGuardrails(response);

    // Build API response with cost tracking
    const apiResponse = {
      agent: routing.agent,
      routing: {
        confidence: routing.confidence,
        reason: routing.reason,
        responseTier: routing.responseTier,
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
      tokenUsage: response.tokenUsage, // Expose cost metrics
      timestamp: new Date().toISOString(),
    };

    // Add warning header if safety review recommended
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (safetyReport.recommendation === "review") {
      headers["X-Safety-Review"] = "true";
    }

    logSafeguard({
      level: "info",
      message: "agents.invoke.success",
      scope: "agents",
      correlationId,
      data: { agent: routing.agent, responseTier: routing.responseTier },
    });

    return NextResponse.json({ ...apiResponse, correlationId }, { headers });
  } catch (error) {
    const normalized = normalizeError(error);
    const resolvedCorrelationId = ensureCorrelationId(
      (error as any)?.correlationId || correlationId
    );

    logSafeguard({
      level: "error",
      message: "agents.invoke.error",
      scope: "agents",
      correlationId: resolvedCorrelationId,
      data: { code: normalized.code },
    });

    return NextResponse.json(
      buildAgentErrorEnvelope({
        error: normalized,
        correlationId: resolvedCorrelationId,
        extras: {
          requiresConfirmation: normalized.code === "confirmation_required",
          timestamp: new Date().toISOString(),
        },
      }),
      { status: normalized.status }
    );
  }
}

/**
 * GET /api/agents
 * List available agents
 */
export async function GET() {
  const correlationId = ensureCorrelationId(null);

  try {
    return NextResponse.json({
      correlationId,
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
    const normalized = normalizeError(error);

    return NextResponse.json(
      buildAgentErrorEnvelope({
        error: normalized,
        correlationId,
      }),
      { status: normalized.status }
    );
  }
}
