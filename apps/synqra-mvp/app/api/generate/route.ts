import { NextRequest, NextResponse } from "next/server";
import {
  generateMultiPlatform,
  logContentGeneration,
  type Platform,
} from "@/lib/contentGenerator";
import { requireSupabase } from "@/lib/supabaseClient";
import {
  AppError,
  buildAgentErrorEnvelope,
  ensureCorrelationId,
  enforceKillSwitch,
  logSafeguard,
  normalizeError,
} from "@/lib/safeguards";

/**
 * ============================================================
 * CONTENT GENERATION ENDPOINT
 * ============================================================
 * POST /api/generate
 * Generates platform-native hooks, captions, and CTAs from a brief
 */

interface GenerateRequest {
  brief: string;
  platforms: Platform[];
}

export async function POST(request: NextRequest) {
  const correlationId = ensureCorrelationId(request.headers.get("x-correlation-id"));

  try {
    logSafeguard({
      level: "info",
      message: "generate.start",
      scope: "generate",
      correlationId,
    });

    enforceKillSwitch({ scope: "generate", correlationId });

    const body: GenerateRequest = await request.json();
    const { searchParams } = new URL(request.url);
    const demoMode = searchParams.get("demo") === "true";
    const persistEnabled =
      (process.env.GENERATE_PERSIST_ENABLED || "").toLowerCase() === "true";

    // Validate input
    if (!body.brief || !body.platforms || body.platforms.length === 0) {
      const normalized = normalizeError(
        new AppError({
          message: "Invalid generate request",
          code: "invalid_request",
          status: 400,
          safeMessage: "Both 'brief' and 'platforms' are required.",
          details: { correlationId },
        })
      );

      return NextResponse.json(
        buildAgentErrorEnvelope({
          error: normalized,
          correlationId,
          extras: { message: normalized.safeMessage },
        }),
        { status: normalized.status }
      );
    }

    const { brief, platforms } = body;

    // Generate variants for all platforms
    const allVariants = generateMultiPlatform(brief, platforms);
    const demoJobId = "demo-" + Date.now();
    const shouldPersist = persistEnabled && !demoMode;

    // Demo mode OR persistence disabled: do not write to database
    // (Per production constraint: avoid day-to-day/junk Supabase writes by default)
    if (!shouldPersist) {
      logContentGeneration(demoJobId, brief, platforms);
      return NextResponse.json(
        {
          correlationId,
          jobId: demoJobId,
          brief,
          platforms,
          variants: allVariants,
          demoMode: demoMode,
          persisted: false,
          message: demoMode
            ? "Demo mode: Content generated but not saved to database"
            : "Content generated. Persistence disabled (set GENERATE_PERSIST_ENABLED=true to enable saving).",
          timestamp: new Date().toISOString(),
        },
        { status: 200 }
      );
    }

    // Persistence explicitly enabled (non-default)
    const supabase = requireSupabase();
    const { data: job, error: jobError } = await supabase
      .from("content_jobs")
      .insert({
        brief,
        platform: platforms.join(","),
        status: "completed",
      })
      .select()
      .single();

    if (jobError) {
      console.error("Failed to create content job:", jobError);
      return NextResponse.json(
        buildAgentErrorEnvelope({
          error: normalizeError(
            new AppError({
              message: "Database error",
              code: "database_error",
              status: 500,
              safeMessage: jobError.message,
              details: { correlationId },
            })
          ),
          correlationId,
          extras: { message: jobError.message },
        }),
        { status: 500 }
      );
    }

    // Insert variants into Supabase
    const variantsToInsert = Object.entries(allVariants).flatMap(
      ([platform, variants]) =>
        variants.map((variant) => ({
          job_id: job.id,
          hook: variant.hook,
          caption: variant.caption,
          cta: variant.cta,
          platform: variant.platform,
          variant_index: variant.variantIndex,
        }))
    );

    const { data: savedVariants, error: variantsError } = await supabase
      .from("content_variants")
      .insert(variantsToInsert)
      .select();

    if (variantsError) {
      console.error("Failed to save content variants:", variantsError);
      return NextResponse.json(
        buildAgentErrorEnvelope({
          error: normalizeError(
            new AppError({
              message: "Database error",
              code: "database_error",
              status: 500,
              safeMessage: variantsError.message,
              details: { correlationId },
            })
          ),
          correlationId,
          extras: { message: variantsError.message },
        }),
        { status: 500 }
      );
    }

    // Log the generation
    logContentGeneration(job.id, brief, platforms);

    return NextResponse.json(
      {
        correlationId,
        jobId: job.id,
        brief,
        platforms,
        variants: allVariants,
        savedCount: savedVariants?.length || 0,
        persisted: true,
        timestamp: new Date().toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    const normalized = normalizeError(error);
    const resolvedCorrelationId = ensureCorrelationId(
      (error as any)?.correlationId || correlationId
    );

    logSafeguard({
      level: "error",
      message: "generate.error",
      scope: "generate",
      correlationId: resolvedCorrelationId,
      data: { code: normalized.code },
    });

    return NextResponse.json(
      buildAgentErrorEnvelope({
        error: normalized,
        correlationId: resolvedCorrelationId,
        extras: { message: normalized.safeMessage },
      }),
      { status: normalized.status }
    );
  }
}

/**
 * GET /api/generate
 * Health check and endpoint info
 */
export async function GET(request: NextRequest) {
  const correlationId = ensureCorrelationId(request.headers.get("x-correlation-id"));

  enforceKillSwitch({ scope: "generate", correlationId });

  return NextResponse.json({
    correlationId,
    endpoint: "/api/generate",
    method: "POST",
    description: "Generate platform-native hooks and CTAs from a brief",
    requiredFields: ["brief", "platforms"],
    supportedPlatforms: ["youtube", "tiktok", "x", "linkedin"],
    example: {
      brief: "How to build a content flywheel with zero budget",
      platforms: ["youtube", "tiktok", "x", "linkedin"],
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
