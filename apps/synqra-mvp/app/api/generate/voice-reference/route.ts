import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { saveVoiceReference } from "@/utils/synqra/learning";
import { ensureCorrelationId, enforceKillSwitch } from "@/lib/safeguards";

export const runtime = "nodejs";

const SAVE_VOICE_REFERENCE_SCHEMA = z.object({
  action: z.literal("save_voice_reference"),
  user_id: z.string().min(1),
  vertical: z.enum(["luxury_realtor", "travel_advisor"]),
  platform: z.enum(["linkedin", "instagram_carousel"]),
  approved_content: z.string().min(1),
  generated_draft: z.string().optional(),
  voice_profile: z
    .object({
      pov: z.enum(["i", "we", "brand"]).optional(),
      cadence_range: z
        .object({
          minWordsPerSentence: z.number().int().min(4).max(40).optional(),
          maxWordsPerSentence: z.number().int().min(6).max(60).optional(),
        })
        .optional(),
      phrase_whitelist: z.array(z.string()).optional(),
      banned_phrase_additions: z.array(z.string()).optional(),
    })
    .optional(),
});

export async function POST(request: NextRequest) {
  const correlationId = ensureCorrelationId(request.headers.get("x-correlation-id"));
  enforceKillSwitch({ scope: "generate", correlationId });

  const rawBody = await request.json().catch(() => null);
  const parsed = SAVE_VOICE_REFERENCE_SCHEMA.safeParse(rawBody);

  if (!parsed.success) {
    return NextResponse.json(
      {
        correlationId,
        saved: false,
        error: "Invalid request. Include action=save_voice_reference and required fields.",
      },
      { status: 400 }
    );
  }

  const result = await saveVoiceReference(parsed.data);
  return NextResponse.json(
    {
      correlationId,
      saved: result.stored,
      user_id: result.user_id,
      vertical: result.vertical,
      references_saved: result.references_saved,
      banned_phrase_additions: result.banned_phrase_additions,
      message: "Voice reference saved. Only pattern signals were persisted.",
    },
    { status: 200 }
  );
}

export async function GET(request: NextRequest) {
  const correlationId = ensureCorrelationId(request.headers.get("x-correlation-id"));
  return NextResponse.json({
    correlationId,
    endpoint: "/api/generate/voice-reference",
    method: "POST",
    trigger: "Save as Voice Reference",
    required: ["action", "user_id", "vertical", "platform", "approved_content"],
    action: "save_voice_reference",
  });
}
