import { supabaseAdmin } from "../supabaseAdmin";
import type { AvatarRunResult } from "./types";

/**
 * ============================================================
 * AVATAR ENGINE - LOGGING (Supabase)
 * ============================================================
 * Persists avatar runs for observability + budgeting
 */

export const AVATAR_RUNS_SQL = `
CREATE TABLE IF NOT EXISTS avatar_runs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id TEXT NOT NULL,
  model TEXT NOT NULL,
  provider TEXT NOT NULL,
  confidence NUMERIC(4,3) NOT NULL,
  prompt_length INTEGER NOT NULL,
  estimated_tokens INTEGER NOT NULL,
  voice JSONB NOT NULL,
  synthesis JSONB NOT NULL,
  response TEXT NOT NULL,
  safety JSONB NOT NULL,
  phase TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
`;

export async function logAvatarRun(result: AvatarRunResult) {
  if (!supabaseAdmin) {
    console.warn("⚠️ Supabase admin not configured. Avatar run will not be persisted.");
    return { stored: false, reason: "missing-supabase-admin" } as const;
  }

  const { error } = await supabaseAdmin.from("avatar_runs").insert({
    request_id: result.requestId,
    model: result.routing.model,
    provider: result.modelProfile.provider,
    confidence: result.routing.confidence,
    prompt_length: result.metrics.promptLength,
    estimated_tokens: result.metrics.estimatedTokens,
    voice: result.voiceProfile,
    synthesis: result.synthesis,
    response: result.response,
    safety: result.safety,
    phase: result.metrics.phase,
  });

  if (error) {
    console.error("Failed to log avatar run", error);
    return { stored: false, reason: error.message } as const;
  }

  return { stored: true } as const;
}
