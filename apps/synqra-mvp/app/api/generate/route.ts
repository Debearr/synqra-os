import { NextRequest, NextResponse } from "next/server";
import {
  generateMultiPlatform,
  logContentGeneration,
  type Platform,
} from "@/lib/contentGenerator";
import { requireSupabase } from "@/lib/supabaseClient";

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
  media_url?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequest = await request.json();
    const { searchParams } = new URL(request.url);
    const demoMode = searchParams.get("demo") === "true";
    const persistEnabled =
      (process.env.GENERATE_PERSIST_ENABLED || "").toLowerCase() === "true";

    // Validate input
    if (!body.brief || !body.platforms || body.platforms.length === 0) {
      return NextResponse.json(
        {
          error: "Invalid request",
          message: "Both 'brief' and 'platforms' are required",
        },
        { status: 400 }
      );
    }

    const { brief, platforms, media_url } = body;

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
        {
          error: "Database error",
          message: jobError.message,
        },
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
          media_url: media_url || null,
        }))
    );

    const { data: savedVariants, error: variantsError } = await supabase
      .from("content_variants")
      .insert(variantsToInsert)
      .select();

    if (variantsError) {
      console.error("Failed to save content variants:", variantsError);
      return NextResponse.json(
        {
          error: "Database error",
          message: variantsError.message,
        },
        { status: 500 }
      );
    }

    // Log the generation
    logContentGeneration(job.id, brief, platforms);

    return NextResponse.json(
      {
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
    console.error("Content generation error:", error);

    return NextResponse.json(
      {
        error: "Content generation failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/generate
 * Health check and endpoint info
 */
export async function GET() {
  return NextResponse.json({
    endpoint: "/api/generate",
    method: "POST",
    description: "Generate platform-native hooks and CTAs from a brief",
    requiredFields: ["brief", "platforms"],
    optionalFields: ["media_url"],
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
