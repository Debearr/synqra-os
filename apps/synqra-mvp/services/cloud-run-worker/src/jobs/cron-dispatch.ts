import { getSupabaseClient } from "../adapters/supabase.js";
import {
  createInternalCommunicationDraft,
  createInternalSchedulingRequest,
  recordInternalOutcome,
} from "../adapters/router-client.js";
import type { BackgroundJobRun } from "../types.js";

type DispatchResult = {
  scanned: number;
  dispatched: number;
  completed: number;
  failed: number;
  skippedDuplicates: number;
  byType: Record<string, number>;
};

async function hasDuplicateIdempotency(job: BackgroundJobRun): Promise<boolean> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("background_job_runs")
    .select("id")
    .eq("idempotency_key", job.idempotency_key)
    .in("status", ["running", "completed"])
    .neq("id", job.id)
    .limit(1);

  if (error) {
    throw new Error(`Duplicate check failed: ${error.message}`);
  }

  return (data || []).length > 0;
}

async function markJobStatus(jobId: string, status: BackgroundJobRun["status"], extra: Record<string, unknown> = {}) {
  const supabase = getSupabaseClient();
  const nowIso = new Date().toISOString();
  const payload: Record<string, unknown> = { status, ...extra };
  if (status === "running") payload.started_at = nowIso;
  if (status === "completed" || status === "failed" || status === "cancelled") payload.completed_at = nowIso;

  const { error } = await supabase.from("background_job_runs").update(payload).eq("id", jobId);
  if (error) {
    throw new Error(`Failed to update job ${jobId} to ${status}: ${error.message}`);
  }
}

async function claimPendingJob(jobId: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from("background_job_runs")
    .update({ status: "running", started_at: nowIso })
    .eq("id", jobId)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to claim pending job ${jobId}: ${error.message}`);
  }

  return Boolean(data?.id);
}

async function dispatchJob(job: BackgroundJobRun): Promise<void> {
  if (job.job_type === "scheduling_request") {
    await createInternalSchedulingRequest({
      userId: job.user_id,
      contentId: String(job.payload.contentId || ""),
      platform: String(job.payload.platform || ""),
      scheduledTime: String(job.payload.scheduledTime || job.scheduled_time),
      metadata: (job.payload.metadata as Record<string, unknown>) || {},
    });
    return;
  }

  if (job.job_type === "communications_draft") {
    await createInternalCommunicationDraft({
      userId: job.user_id,
      type: job.payload.type === "calendar" ? "calendar" : "email",
      recipient: String(job.payload.recipient || ""),
      subject: typeof job.payload.subject === "string" ? job.payload.subject : "",
      body: typeof job.payload.body === "string" ? job.payload.body : "",
      sensitivityLevel:
        job.payload.sensitivityLevel === "high" || job.payload.sensitivityLevel === "low"
          ? (job.payload.sensitivityLevel as "high" | "low")
          : "normal",
      approved: Boolean(job.payload.approved),
      metadata: (job.payload.metadata as Record<string, unknown>) || {},
    });
    return;
  }

  await recordInternalOutcome({
    userId: job.user_id,
    jobId: job.id,
    eventType: "created",
    status: "success",
    metadata: { source: "cron-dispatch", jobType: job.job_type },
    platform: typeof job.payload.platform === "string" ? job.payload.platform : undefined,
    outcomeClassification: "job_dispatched",
  });
}

export async function runCronDispatch(): Promise<DispatchResult> {
  const supabase = getSupabaseClient();
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from("background_job_runs")
    .select("*")
    .eq("status", "pending")
    .lte("scheduled_time", nowIso)
    .order("scheduled_time", { ascending: true })
    .limit(100);

  if (error) {
    throw new Error(`Failed to query pending jobs: ${error.message}`);
  }

  const jobs = (data || []) as BackgroundJobRun[];
  const result: DispatchResult = {
    scanned: jobs.length,
    dispatched: 0,
    completed: 0,
    failed: 0,
    skippedDuplicates: 0,
    byType: {},
  };

  for (const job of jobs) {
    result.byType[job.job_type] = (result.byType[job.job_type] || 0) + 1;
    const duplicate = await hasDuplicateIdempotency(job);
    if (duplicate) {
      await markJobStatus(job.id, "cancelled", { error_log: "Skipped duplicate idempotency run" });
      result.skippedDuplicates += 1;
      continue;
    }

    const claimed = await claimPendingJob(job.id);
    if (!claimed) {
      continue;
    }
    result.dispatched += 1;

    try {
      await dispatchJob(job);
      await markJobStatus(job.id, "completed");
      result.completed += 1;
    } catch (dispatchError) {
      await markJobStatus(job.id, "failed", {
        error_log: dispatchError instanceof Error ? dispatchError.message : "Unknown dispatch error",
      });
      result.failed += 1;
    }
  }

  return result;
}

