import { createHash } from "crypto";
import { requireSupabaseAdmin } from "@/lib/supabaseAdmin";
import { stableStringify } from "@/lib/jobs/stable-stringify";

export type BackgroundJobRun = {
  id: string;
  user_id: string;
  job_type: string;
  status: string;
  payload: Record<string, unknown>;
  scheduled_time: string;
  started_at: string | null;
  completed_at: string | null;
  error_log: string | null;
  retry_count: number;
  next_retry_at: string | null;
  idempotency_key: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export function generateIdempotencyKey(jobType: string, payload: unknown, timestamp: string): string {
  const normalizedPayload = stableStringify(payload);
  const base = `${jobType}:${timestamp}:${normalizedPayload}`;
  return createHash("sha256").update(base).digest("hex");
}

export async function checkIdempotency(key: string): Promise<BackgroundJobRun | null> {
  const supabase = requireSupabaseAdmin();
  const { data, error } = await supabase
    .from("background_job_runs")
    .select("*")
    .eq("idempotency_key", key)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Idempotency lookup failed: ${error.message}`);
  }

  return (data as BackgroundJobRun | null) ?? null;
}
