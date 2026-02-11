import { NextRequest, NextResponse } from "next/server";
import {
  generateMultiPlatform,
  logContentGeneration,
  type Platform as LegacyPlatform,
} from "@/lib/contentGenerator";
import { requireSupabase } from "@/lib/supabaseClient";
import { getVoiceProfileForUser } from "@/utils/synqra/learning";
import {
  isHardenedGenerateRequest,
  runSynqraPipeline,
  type Intake as HardenedIntake,
} from "@/utils/synqra/pipeline";
import {
  AppError,
  buildAgentErrorEnvelope,
  ensureCorrelationId,
  enforceKillSwitch,
  logSafeguard,
  normalizeError,
} from "@/lib/safeguards";

export const runtime = "nodejs";

/**
 * ============================================================
 * CONTENT GENERATION ENDPOINT
 * ============================================================
 * POST /api/generate
 * Supports:
 * - Hardened Synqra pipeline mode (LinkedIn + Instagram Carousel only)
 * - Legacy multi-platform variants mode
 */

type LegacyGenerateRequest = {
  brief: string;
  platforms: LegacyPlatform[];
};

function isLegacyGenerateRequest(value: unknown): value is LegacyGenerateRequest {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;
  return (
    typeof record.brief === "string" &&
    Array.isArray(record.platforms) &&
    record.platforms.every((platform) => typeof platform === "string")
  );
}

async function handleHardenedRequest(params: {
  request: NextRequest;
  body: HardenedIntake;
  correlationId: string;
}): Promise<NextResponse> {
  const { body, correlationId } = params;
  const userVoice = await getVoiceProfileForUser({
    user_id: body.user_id,
    vertical: body.vertical,
  });

  const envelope = runSynqraPipeline(body, {
    voice_profile: userVoice.voice_profile,
    user_banned_phrases: userVoice.user_banned_phrases,
  });

  return NextResponse.json(
    {
      correlationId,
      ...envelope,
      mode: "synqra_hardened",
      persisted: false,
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}

async function handleLegacyRequest(params: {
  request: NextRequest;
  body: LegacyGenerateRequest;
  correlationId: string;
}): Promise<NextResponse> {
  const { request, body, correlationId } = params;
  const { searchParams } = new URL(request.url);
  const demoMode = searchParams.get("demo") === "true";
  const persistEnabled = (process.env.GENERATE_PERSIST_ENABLED || "").toLowerCase() === "true";

  if (!body.brief || !body.platforms || body.platforms.length === 0) {
    const normalized = normalizeError(
      new AppError({
        message: "Invalid generate request",
        code: "invalid_request",
        status: 400,
        safeMessage:
          "Provide either hardened input (platform/raw_ip/q1_about/q2_why/q3_who/objective_chip/vertical) or legacy fields ('brief' and 'platforms').",
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
  const allVariants = generateMultiPlatform(brief, platforms);
  const demoJobId = "demo-" + Date.now();
  const shouldPersist = persistEnabled && !demoMode;

  if (!shouldPersist) {
    logContentGeneration(demoJobId, brief, platforms);
    return NextResponse.json(
      {
        correlationId,
        jobId: demoJobId,
        brief,
        platforms,
        variants: allVariants,
        demoMode,
        persisted: false,
        message: demoMode
          ? "Demo mode: Content generated but not saved to database"
          : "Content generated. Persistence disabled (set GENERATE_PERSIST_ENABLED=true to enable saving).",
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  }

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

  const variantsToInsert = Object.entries(allVariants).flatMap(([platform, variants]) =>
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

    const rawBody = (await request.json().catch(() => null)) as unknown;
    if (!rawBody) {
      const normalized = normalizeError(
        new AppError({
          message: "Invalid generate request",
          code: "invalid_request",
          status: 400,
          safeMessage: "Invalid JSON body.",
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

    if (isHardenedGenerateRequest(rawBody)) {
      return handleHardenedRequest({
        request,
        body: rawBody,
        correlationId,
      });
    }

    if (isLegacyGenerateRequest(rawBody)) {
      return handleLegacyRequest({
        request,
        body: rawBody,
        correlationId,
      });
    }

    const normalized = normalizeError(
      new AppError({
        message: "Invalid generate request shape",
        code: "invalid_request",
        status: 400,
        safeMessage:
          "Unsupported payload. Use hardened fields (platform/raw_ip/q1_about/q2_why/q3_who/objective_chip/vertical) or legacy fields (brief/platforms).",
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
  } catch (error) {
    const normalized = normalizeError(error);
    const resolvedCorrelationId = ensureCorrelationId((error as { correlationId?: string })?.correlationId || correlationId);

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
    description: "Generate content via hardened Synqra pipeline or legacy variant mode",
    hardenedRequiredFields: ["platform", "raw_ip", "q1_about", "q2_why", "q3_who", "objective_chip", "vertical"],
    hardenedSupportedPlatforms: ["linkedin", "instagram_carousel"],
    hardenedSupportedVerticals: ["luxury_realtor", "travel_advisor"],
    legacyRequiredFields: ["brief", "platforms"],
    legacySupportedPlatforms: ["youtube", "tiktok", "x", "linkedin"],
  });
}

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
