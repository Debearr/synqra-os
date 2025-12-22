import { z } from "zod";
import type { AvatarPlan, AvatarVoiceProfile, KieAIValidationResult } from "../avatar/types";

const voiceProfileSchema: z.ZodType<AvatarVoiceProfile> = z.object({
  name: z.string().optional(),
  tone: z.string().optional(),
  cadence: z.string().optional(),
  vocabulary: z.array(z.string()).optional(),
  guardrails: z.array(z.string()).optional(),
  audience: z.string().optional(),
});

export const avatarGenerateSchema = z.object({
  userId: z.string().min(3, "userId is required"),
  script: z.string().min(24, "script is required"),
  plan: z.enum(["lite", "pro", "studio"] satisfies AvatarPlan[]),
  channel: z.enum(["video", "audio", "text"]).default("video"),
  voice: voiceProfileSchema.optional(),
  imageBase64: z.string().optional(),
  audioBase64: z.string().optional(),
});

export type AvatarGenerateInput = z.infer<typeof avatarGenerateSchema>;

interface KieAISdkClient {
  validate: (payload: { text: string; channel?: string }) => Promise<{ score?: number; flags?: string[]; topics?: string[]; sanitized_text?: string }>;
}

interface KieAISdkModule {
  KieAI: new (config: { apiKey?: string }) => KieAISdkClient;
}

const heuristicFlags = ["nsfw", "politics", "medical", "finance"];

export async function validateWithKieAI(payload: AvatarGenerateInput): Promise<{ parsed: AvatarGenerateInput; validation: KieAIValidationResult }>
{
  const parsed = avatarGenerateSchema.parse(payload);
  const sanitizedScript = parsed.script.trim();
  const flagged = heuristicFlags.filter((flag) => sanitizedScript.toLowerCase().includes(flag));

  let remoteScore = 0.1;
  let remoteFlags: string[] = [];
  let remoteTopics: string[] = [];
  if (process.env.KIE_AI_API_KEY) {
    const sdk = (await import("@kie-ai/sdk")) as unknown as KieAISdkModule;
    const client = new sdk.KieAI({ apiKey: process.env.KIE_AI_API_KEY });
    const response = await client.validate({ text: sanitizedScript, channel: parsed.channel });
    remoteScore = typeof response.score === "number" ? response.score : remoteScore;
    remoteFlags = response.flags ?? [];
    remoteTopics = response.topics ?? [];
  }

  const riskScore = Math.max(remoteScore, flagged.length * 0.1);
  const validation: KieAIValidationResult = {
    sanitizedScript,
    riskScore,
    flags: [...new Set([...flagged, ...remoteFlags])],
    topics: remoteTopics,
  };

  return { parsed, validation };
}
