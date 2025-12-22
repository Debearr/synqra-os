import crypto from "crypto";
import { AvatarVoiceProfile } from "../avatar/types";

interface OptimizeInput {
  script: string;
  voice?: AvatarVoiceProfile;
}

export async function optimizeAvatarScript(input: OptimizeInput): Promise<{ script: string; fingerprint: string }>
{
  const cleaned = input.script.trim().replace(/\s+/g, " ").slice(0, 1800);
  const fingerprint = crypto.createHash("sha256").update(cleaned).digest("hex");

  if (!process.env.KIE_AI_API_KEY) {
    return { script: cleaned, fingerprint };
  }

  const sdk = (await import("@kie-ai/sdk")) as unknown as { KieAI: new (config: { apiKey?: string }) => { optimize: (payload: { text: string; tone?: string }) => Promise<{ text: string }> } };
  const client = new sdk.KieAI({ apiKey: process.env.KIE_AI_API_KEY });
  const optimized = await client.optimize({ text: cleaned, tone: input.voice?.tone });

  return {
    script: optimized.text ?? cleaned,
    fingerprint,
  };
}
