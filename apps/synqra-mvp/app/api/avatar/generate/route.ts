import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { optimizeAvatarScript } from "@/lib/kie-ai/optimizer";
import { estimateAvatarCost } from "@/lib/kie-ai/cost-estimator";
import { selectAvatarProvider } from "@/lib/kie-ai/router";
import { validateWithKieAI } from "@/lib/kie-ai/validator";
import { sanitizeAvatarAudio, sanitizeAvatarImage } from "@/lib/avatar/validators/assets";
import { fetchAvatarUsage } from "@/lib/avatar/usage";
import { enqueueAvatarJob } from "@/lib/avatar/workers/generate";
import type { AvatarPlan, AvatarUsage, AvatarVoiceProfile } from "@/lib/avatar/types";
import { requireSupabaseAdmin } from "@/lib/supabaseAdmin";

async function toDataUrl(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString("base64");
  return `data:${file.type};base64,${base64}`;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const script = (formData.get("script") as string) || "";
    const plan = (formData.get("plan") as AvatarPlan) || "lite";
    const userId = (formData.get("userId") as string) || "anonymous";
    const channel = ((formData.get("channel") as string) || "video") as "video" | "audio" | "text";
    const priority = ((formData.get("priority") as string) || "balanced") as "quality" | "speed" | "balanced";
    const voiceInput = formData.get("voice") as string | null;
    const voice: AvatarVoiceProfile | undefined = voiceInput ? JSON.parse(voiceInput) : undefined;

    const imageFile = formData.get("image") as File | null;
    const audioFile = formData.get("audio") as File | null;

    const imageBase64 = imageFile ? await toDataUrl(imageFile) : undefined;
    const audioBase64 = audioFile ? await toDataUrl(audioFile) : undefined;

    const { parsed, validation } = await validateWithKieAI({
      userId,
      script,
      plan,
      channel,
      voice,
      imageBase64,
      audioBase64,
    });

    let existingUsage: AvatarUsage | undefined = undefined;
    try {
      const supabase = requireSupabaseAdmin();
      existingUsage = await fetchAvatarUsage(supabase, parsed.userId);
    } catch (usageError) {
      console.warn("Avatar usage lookup skipped", usageError);
    }

    const optimized = await optimizeAvatarScript({ script: validation.sanitizedScript, voice: parsed.voice });
    const sanitizedImage = parsed.imageBase64 ? await sanitizeAvatarImage(parsed.imageBase64) : undefined;
    const sanitizedAudio = parsed.audioBase64 ? await sanitizeAvatarAudio(parsed.audioBase64) : undefined;

    const cost = estimateAvatarCost(parsed.plan, existingUsage, 1);
    const provider = selectAvatarProvider({
      plan: parsed.plan,
      channel,
      priority,
      scriptLength: optimized.script.length,
    });

    const jobId = crypto.randomUUID();
    const previewUrl = sanitizedImage?.dataUrl ?? sanitizedAudio?.dataUrl;

    await enqueueAvatarJob({
      jobId,
      userId: parsed.userId,
      script: optimized.script,
      voice: parsed.voice ?? {},
      plan: parsed.plan,
      provider,
      previewUrl: previewUrl ?? undefined,
      sanitizedImage: sanitizedImage?.dataUrl,
      sanitizedAudio: sanitizedAudio?.dataUrl,
      promptHash: sanitizedImage?.perceptualHash ?? optimized.fingerprint,
      metadata: {
        riskScore: validation.riskScore,
        flags: validation.flags.join(","),
      },
    });

    return NextResponse.json({
      jobId,
      provider,
      previewUrl,
      cost,
      validation,
    });
  } catch (error) {
    console.error("Avatar generate error", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
