import { NextRequest, NextResponse } from "next/server";
import { queryCouncil } from "@/src/lib/aiCouncil";
import type { CouncilRequest } from "@/src/lib/aiCouncil";
import { enforceSynqraLiteDraftSecurity, PublicGatekeeperError, type SynqraTier } from "@/lib/security/gatekeeper";
import { logCouncilUsage } from "@/src/lib/aiCouncil/logging";

/**
 * ============================================================
 * AI COUNCIL BATCH ENDPOINT
 * ============================================================
 * POST /api/council/batch
 * Process multiple prompts in parallel
 * 
 * Features:
 * - Batch processing with concurrency limits
 * - Individual results per prompt
 * - Rate limiting per batch
 */

const MAX_BATCH_SIZE = 10;
const MAX_CONCURRENT = 5;

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let requestId: string | undefined;

  try {
    const body = await request.json();

    // Validate batch structure
    if (!body.prompts || !Array.isArray(body.prompts)) {
      return NextResponse.json(
        {
          error: "Invalid request",
          message: "The 'prompts' field is required and must be an array",
        },
        { status: 400 }
      );
    }

    if (body.prompts.length === 0) {
      return NextResponse.json(
        {
          error: "Invalid request",
          message: "Prompts array cannot be empty",
        },
        { status: 400 }
      );
    }

    if (body.prompts.length > MAX_BATCH_SIZE) {
      return NextResponse.json(
        {
          error: "Invalid request",
          message: `Maximum ${MAX_BATCH_SIZE} prompts per batch`,
        },
        { status: 400 }
      );
    }

    // Validate each prompt
    for (let i = 0; i < body.prompts.length; i++) {
      const prompt = body.prompts[i];
      if (typeof prompt !== "string" || prompt.trim().length === 0) {
        return NextResponse.json(
          {
            error: "Invalid request",
            message: `Prompt at index ${i} must be a non-empty string`,
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

    requestId = `batch_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Process prompts with concurrency limit
    const prompts: string[] = body.prompts;
    const councilOptions: Partial<CouncilRequest> = {
      systemPrompt: body.systemPrompt,
      members: body.members,
      temperature: body.temperature,
      maxTokens: body.maxTokens,
    };

    const results = await processBatch(prompts, councilOptions);

    const duration = Date.now() - startTime;
    const totalTokens = results.reduce(
      (sum, r) => sum + r.responses.reduce((s, resp) => s + (resp.tokens?.total || 0), 0),
      0
    );

    // Log batch usage
    await logCouncilUsage({
      requestId,
      prompt: `[BATCH: ${prompts.length} prompts]`,
      responses: results.flatMap((r) => r.responses),
      totalTokens,
      totalPromptTokens: totalTokens,
      totalCompletionTokens: 0,
      duration,
      tier: effectiveTier,
    });

    return NextResponse.json(
      {
        requestId,
        batchSize: prompts.length,
        results,
        metadata: {
          totalTokens,
          duration,
          tier: effectiveTier,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("AI Council Batch API error:", error);

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
        error: "Batch processing failed",
        message: error instanceof Error ? error.message : "Unknown error",
        requestId,
      },
      { status: 500 }
    );
  }
}

/**
 * Process batch with concurrency limit
 */
async function processBatch(
  prompts: string[],
  options: Partial<CouncilRequest>
): Promise<Array<{ prompt: string; responses: any[]; consensus?: string; timestamp: string }>> {
  const results: Array<{ prompt: string; responses: any[]; consensus?: string; timestamp: string }> = [];

  // Process in chunks to limit concurrency
  for (let i = 0; i < prompts.length; i += MAX_CONCURRENT) {
    const chunk = prompts.slice(i, i + MAX_CONCURRENT);
    const chunkResults = await Promise.all(
      chunk.map(async (prompt) => {
        try {
          const result = await queryCouncil({
            prompt,
            ...options,
          });
          return {
            prompt,
            responses: result.responses,
            consensus: result.consensus,
            timestamp: result.timestamp,
          };
        } catch (error) {
          console.error(`Error processing prompt in batch:`, error);
          return {
            prompt,
            responses: [],
            timestamp: new Date().toISOString(),
          };
        }
      })
    );
    results.push(...chunkResults);
  }

  return results;
}

/**
 * GET /api/council/batch
 */
export async function GET() {
  return NextResponse.json({
    endpoint: "/api/council/batch",
    method: "POST",
    description: "Process multiple prompts in parallel using the AI Council",
    limits: {
      maxBatchSize: MAX_BATCH_SIZE,
      maxConcurrent: MAX_CONCURRENT,
    },
    requestSchema: {
      prompts: "string[] (required) - Array of prompts to process",
      systemPrompt: "string (optional) - Custom system prompt",
      members: "array (optional) - Custom council members",
      temperature: "number (optional) - Temperature for responses (0-2)",
      maxTokens: "number (optional) - Maximum tokens per response (1-8000)",
    },
    example: {
      prompts: [
        "What are the key considerations for building a scalable SaaS product?",
        "How should I structure my pricing model?",
      ],
      temperature: 0.7,
    },
  });
}

