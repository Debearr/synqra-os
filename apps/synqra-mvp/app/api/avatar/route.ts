import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  AVATAR_MODELS,
  AVATAR_RUNS_SQL,
  DEFAULT_VOICE,
  runAvatarEngine,
  type AvatarInput,
} from "@/lib/avatar";

/**
 * ============================================================
 * AVATAR ENGINE ENDPOINT (Phase 1 LIVE, Phase 2 scaffold)
 * ============================================================
 * POST /api/avatar -> runs deterministic routing + synthesis
 * GET /api/avatar  -> exposes model registry + setup SQL
 */

const AvatarRequestSchema = z.object({
  prompt: z.string().min(4, "Prompt required"),
  channel: z.enum(["text", "audio", "video"]).optional(),
  priority: z.enum(["speed", "accuracy", "balanced"]).optional(),
  maxBudgetUSD: z.number().positive().optional(),
  voice: z
    .object({
      name: z.string().optional(),
      tone: z.string().optional(),
      cadence: z.string().optional(),
      vocabulary: z.array(z.string()).optional(),
      guardrails: z.array(z.string()).optional(),
      audience: z.string().optional(),
    })
    .optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = AvatarRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "invalid-request", details: validation.error.issues },
        { status: 400 }
      );
    }

    const payload: AvatarInput = validation.data;
    const result = await runAvatarEngine(payload);

    return NextResponse.json(
      {
        status: "ok",
        phase: "phase-1",
        result,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Avatar engine error", error);
    return NextResponse.json(
      {
        error: "avatar-engine-failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ready",
    phase1: {
      models: AVATAR_MODELS,
      defaults: DEFAULT_VOICE,
      samplePayload: {
        prompt: "Draft a LinkedIn update on our Series A and why we built Synqra",
        priority: "accuracy",
        voice: DEFAULT_VOICE,
      },
    },
    phase2: {
      status: "planned",
      notes: "Streaming + adaptive avatars will hook into websocket + Supabase real-time.",
    },
    setup: {
      supabaseSQL: AVATAR_RUNS_SQL,
      stripe: "Reuse existing billing webhooks; flag avatar_runs for premium tiers.",
    },
    timestamp: new Date().toISOString(),
  });
}
