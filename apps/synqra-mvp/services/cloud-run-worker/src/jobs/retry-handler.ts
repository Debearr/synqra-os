import { getSupabaseClient } from "../adapters/supabase.js";
import { calculateBackoff, shouldRetry } from "../policies/retry-policy.js";
import type { BackgroundJobRun } from "../types.js";

type RetryResult = {
  scanned: number;
  requeued: number;
  exhausted: number;
};

export async function runRetryHandler(): Promise<RetryResult> {
  const maxAttempts = Number(process.env.JOB_MAX_ATTEMPTS || 5);
  const baseBackoff = Number(process.env.JOB_BASE_BACKOFF_SECONDS || 10);
  const maxBackoff = Number(process.env.JOB_MAX_BACKOFF_SECONDS || 900);
  const nowIso = new Date().toISOString();
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("background_job_runs")
    .select("*")
    .eq("status", "failed")
    .lt("retry_count", maxAttempts)
    .or(`next_retry_at.is.null,next_retry_at.lte.${nowIso}`)
    .order("updated_at", { ascending: true })
    .limit(100);

  if (error) {
    throw new Error(`Failed to query failed jobs: ${error.message}`);
  }

  const failedJobs = (data || []) as BackgroundJobRun[];
  const result: RetryResult = { scanned: failedJobs.length, requeued: 0, exhausted: 0 };

  for (const job of failedJobs) {
    const nextAttempt = job.retry_count + 1;
    const canRetry = shouldRetry(job.error_log || "", nextAttempt, maxAttempts);
    if (!canRetry) {
      result.exhausted += 1;
      continue;
    }

    const delaySeconds = calculateBackoff(nextAttempt, baseBackoff, maxBackoff);
    const nextRetryAt = new Date(Date.now() + delaySeconds * 1000).toISOString();

    const { data: updatedRow, error: updateError } = await supabase
      .from("background_job_runs")
      .update({
        status: "pending",
        retry_count: nextAttempt,
        next_retry_at: nextRetryAt,
        scheduled_time: nextRetryAt,
      })
      .eq("id", job.id)
      .eq("status", "failed")
      .eq("retry_count", job.retry_count)
      .select("id")
      .maybeSingle();

    if (updateError) {
      throw new Error(`Failed to requeue job ${job.id}: ${updateError.message}`);
    }

    if (!updatedRow?.id) {
      continue;
    }

    result.requeued += 1;
  }

  return result;
}

