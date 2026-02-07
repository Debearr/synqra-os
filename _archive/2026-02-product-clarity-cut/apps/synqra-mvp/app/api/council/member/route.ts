import { NextRequest, NextResponse } from "next/server";
import { queryMember, DEFAULT_COUNCIL_MEMBERS } from "@/src/lib/aiCouncil";
import { OPENROUTER_MODELS } from "@/src/lib/openrouter";
import type { CouncilMember } from "@/src/lib/aiCouncil";
import { enforceSynqraLiteDraftSecurity, PublicGatekeeperError, type SynqraTier } from "@/lib/security/gatekeeper";
import { logCouncilUsage } from "@/src/lib/aiCouncil/logging";

/**
 * ============================================================
 * AI COUNCIL MEMBER ENDPOINT
 * ============================================================
 * POST /api/council/member
 * Query a single council member
 * 
 * Features:
 * - Single model queries
 * - Lower cost for focused queries
 * - Rate limiting
 */

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let requestId: string | undefined;

  try {
    const body = await request.json();

    // Validate input
    if (!body.prompt || typeof body.prompt !== "string") {
      return NextResponse.json(
        {
          error: "Invalid request",
          message: "The 'prompt' field is required and must be a string",
        },
        { status: 400 }
      );
    }

    if (body.prompt.trim().length === 0) {
      return NextResponse.json(
        {
          error: "Invalid request",
          message: "Prompt cannot be empty",
        },
        { status: 400 }
      );
    }

    // Validate member selection
    let member: CouncilMember | undefined;

    if (body.memberName) {
      // Find member by name
      member = DEFAULT_COUNCIL_MEMBERS.find((m) => m.name.toLowerCase() === body.memberName.toLowerCase());
      if (!member) {
        return NextResponse.json(
          {
            error: "Invalid request",
            message: `Member '${body.memberName}' not found. Available: ${DEFAULT_COUNCIL_MEMBERS.map((m) => m.name).join(", ")}`,
          },
          { status: 400 }
        );
      }
    } else if (body.model) {
      // Use custom member with specified model
      if (!Object.values(OPENROUTER_MODELS).includes(body.model)) {
        return NextResponse.json(
          {
            error: "Invalid request",
            message: `Model '${body.model}' not supported`,
          },
          { status: 400 }
        );
      }
      member = {
        model: body.model,
        name: body.memberName || "Custom",
        role: body.role || "AI Assistant",
        temperature: body.temperature,
      };
    } else {
      // Default to first member
      member = DEFAULT_COUNCIL_MEMBERS[0];
    }

    // Security and rate limiting
    const tierHeader = (request.headers.get("x-synqra-tier") || "").toLowerCase();
    const tier: SynqraTier =
      tierHeader === "premium" || tierHeader === "enterprise" ? (tierHeader as SynqraTier) : "free";
    const fingerprint = request.headers.get("x-synqra-fp");
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      null;
    const userAgent = request.headers.get("user-agent");
    const authHeader = request.headers.get("authorization");
    const effectiveTier: SynqraTier = authHeader ? "premium" : tier;

    // Apply security (skip for premium/enterprise)
    if (effectiveTier === "free") {
      try {
        enforceSynqraLiteDraftSecurity({
          tier: effectiveTier,
          fingerprint: fingerprint || null,
          email: request.headers.get("x-synqra-email") || null,
          ip,
          userAgent,
        });
      } catch (securityError) {
        if (securityError instanceof PublicGatekeeperError) {
          return NextResponse.json(
            {
              error: "Rate limit exceeded",
              message: securityError.message,
            },
            { status: securityError.status }
          );
        }
        throw securityError;
      }
    }

    requestId = `member_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Query single member
    const response = await queryMember(
      member,
      body.prompt.trim(),
      body.systemPrompt,
      {
        temperature: body.temperature,
        maxTokens: body.maxTokens,
      }
    );

    const duration = Date.now() - startTime;

    // Log usage
    await logCouncilUsage({
      requestId,
      prompt: body.prompt.trim(),
      responses: [response],
      totalTokens: response.tokens?.total || 0,
      totalPromptTokens: response.tokens?.prompt || 0,
      totalCompletionTokens: response.tokens?.completion || 0,
      duration,
      tier: effectiveTier,
    });

    return NextResponse.json(
      {
        ...response,
        metadata: {
          requestId,
          duration,
          tier: effectiveTier,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("AI Council Member API error:", error);

    if (requestId) {
      await logCouncilUsage({
        requestId,
        prompt: "",
        responses: [],
        totalTokens: 0,
        totalPromptTokens: 0,
        totalCompletionTokens: 0,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : "Unknown error",
      }).catch(() => {});
    }

    return NextResponse.json(
      {
        error: "Member query failed",
        message: error instanceof Error ? error.message : "Unknown error",
        requestId,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/council/member
 */
export async function GET() {
  return NextResponse.json({
    endpoint: "/api/council/member",
    method: "POST",
    description: "Query a single council member for focused responses",
    availableMembers: DEFAULT_COUNCIL_MEMBERS.map((m) => ({
      name: m.name,
      role: m.role,
      model: m.model,
    })),
    requestSchema: {
      prompt: "string (required) - The question or prompt",
      memberName: `string (optional) - Name of member to query. Available: ${DEFAULT_COUNCIL_MEMBERS.map((m) => m.name).join(", ")}`,
      model: "string (optional) - Model identifier if using custom member",
      role: "string (optional) - Role description if using custom member",
      systemPrompt: "string (optional) - Custom system prompt",
      temperature: "number (optional) - Temperature for response (0-2)",
      maxTokens: "number (optional) - Maximum tokens per response (1-8000)",
    },
    example: {
      prompt: "What are the key considerations for building a scalable SaaS product?",
      memberName: "Claude",
      temperature: 0.7,
    },
  });
}

