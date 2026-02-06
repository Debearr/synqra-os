import { NextRequest, NextResponse } from "next/server";
import { queryCouncil, DEFAULT_COUNCIL_MEMBERS } from "@/src/lib/aiCouncil";
import type { CouncilRequest } from "@/src/lib/aiCouncil";
import { enforceSynqraLiteDraftSecurity, PublicGatekeeperError, type SynqraTier } from "@/lib/security/gatekeeper";
import { logCouncilUsage } from "@/src/lib/aiCouncil/logging";

/**
 * ============================================================
 * AI COUNCIL API ENDPOINT
 * ============================================================
 * POST /api/council
 * Production-grade multi-model intelligence endpoint
 * 
 * Features:
 * - Rate limiting and security
 * - Cost tracking
 * - Individual model responses + consensus
 * - Error handling with graceful degradation
 */

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let requestId: string | undefined;

  try {
    const body: CouncilRequest = await request.json();

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

    // Validate prompt length
    const promptLength = body.prompt.trim().length;
    if (promptLength === 0) {
      return NextResponse.json(
        {
          error: "Invalid request",
          message: "Prompt cannot be empty",
        },
        { status: 400 }
      );
    }

    if (promptLength > 10000) {
      return NextResponse.json(
        {
          error: "Invalid request",
          message: "Prompt exceeds maximum length of 10,000 characters",
        },
        { status: 400 }
      );
    }

    // Validate members if provided
    if (body.members) {
      if (!Array.isArray(body.members) || body.members.length === 0) {
        return NextResponse.json(
          {
            error: "Invalid request",
            message: "Members must be a non-empty array",
          },
          { status: 400 }
        );
      }

      if (body.members.length > 10) {
        return NextResponse.json(
          {
            error: "Invalid request",
            message: "Maximum 10 council members allowed",
          },
          { status: 400 }
        );
      }

      for (const member of body.members) {
        if (!member.model || !member.name || !member.role) {
          return NextResponse.json(
            {
              error: "Invalid request",
              message: "Each member must have 'model', 'name', and 'role' fields",
            },
            { status: 400 }
          );
        }
      }
    }

    // Validate temperature if provided
    if (body.temperature !== undefined) {
      if (typeof body.temperature !== "number" || body.temperature < 0 || body.temperature > 2) {
        return NextResponse.json(
          {
            error: "Invalid request",
            message: "Temperature must be a number between 0 and 2",
          },
          { status: 400 }
        );
      }
    }

    // Validate maxTokens if provided
    if (body.maxTokens !== undefined) {
      if (typeof body.maxTokens !== "number" || body.maxTokens < 1 || body.maxTokens > 8000) {
        return NextResponse.json(
          {
            error: "Invalid request",
            message: "maxTokens must be a number between 1 and 8000",
          },
          { status: 400 }
        );
      }
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

    // Generate request ID for tracking
    requestId = `council_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Extract user metadata from auth header for context injection
    let enhancedSystemPrompt = body.systemPrompt;
    if (authHeader) {
      try {
        const { createClient } = await import("@supabase/supabase-js");
        const { getSupabaseUrl, getSupabaseAnonKey } = await import("@/lib/supabase/env");
        const supabase = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
          global: {
            headers: {
              Authorization: authHeader,
            },
          },
        });

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user?.user_metadata) {
          const { industry, role, goal } = user.user_metadata;
          if (industry || role || goal) {
            const contextLine = `You are advising a ${role || "professional"} in the ${industry || "business"} sector. Prioritize guidance aligned with ${goal || "their objectives"}.`;
            enhancedSystemPrompt = enhancedSystemPrompt
              ? `${enhancedSystemPrompt}\n\n${contextLine}`
              : contextLine;
          }
        }
      } catch (error) {
        // Silently fail - user metadata injection is optional
        console.warn("Failed to inject user metadata:", error);
      }
    }

    // Query the council
    const result = await queryCouncil({
      prompt: body.prompt.trim(),
      systemPrompt: enhancedSystemPrompt,
      members: body.members,
      temperature: body.temperature,
      maxTokens: body.maxTokens,
    });

    // Calculate total tokens and cost
    const totalTokens = result.responses.reduce((sum, r) => sum + (r.tokens?.total || 0), 0);
    const totalPromptTokens = result.responses.reduce((sum, r) => sum + (r.tokens?.prompt || 0), 0);
    const totalCompletionTokens = result.responses.reduce((sum, r) => sum + (r.tokens?.completion || 0), 0);
    const duration = Date.now() - startTime;

    // Log usage for cost tracking
    await logCouncilUsage({
      requestId,
      prompt: body.prompt.trim(),
      responses: result.responses,
      totalTokens,
      totalPromptTokens,
      totalCompletionTokens,
      duration,
      tier: effectiveTier,
    });

    return NextResponse.json(
      {
        ...result,
        metadata: {
          requestId,
          totalTokens,
          totalPromptTokens,
          totalCompletionTokens,
          duration,
          tier: effectiveTier,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("AI Council API error:", error);

    // Log error
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
        error: "Council query failed",
        message: error instanceof Error ? error.message : "Unknown error",
        requestId,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/council
 * Returns information about the council endpoint and available members
 */
export async function GET() {
  return NextResponse.json({
    endpoint: "/api/council",
    method: "POST",
    description: "Query multiple AI models for diverse perspectives",
    defaultMembers: DEFAULT_COUNCIL_MEMBERS.map((m) => ({
      name: m.name,
      role: m.role,
      model: m.model,
    })),
    requestSchema: {
      prompt: "string (required) - The question or prompt for the council",
      systemPrompt: "string (optional) - Custom system prompt",
      members: "array (optional) - Custom council members",
      temperature: "number (optional) - Temperature for responses (0-1)",
      maxTokens: "number (optional) - Maximum tokens per response",
    },
    example: {
      prompt: "What are the key considerations for building a scalable SaaS product?",
      temperature: 0.7,
    },
  });
}

/**
 * Handle unsupported methods
 */
export async function PUT() {
  return new NextResponse("Method Not Allowed", {
    status: 405,
    headers: { Allow: "GET, POST" },
  });
}

export async function DELETE() {
  return new NextResponse("Method Not Allowed", {
    status: 405,
    headers: { Allow: "GET, POST" },
  });
}

export async function PATCH() {
  return new NextResponse("Method Not Allowed", {
    status: 405,
    headers: { Allow: "GET, POST" },
  });
}

