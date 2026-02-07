import crypto from "crypto";
import { requireSupabaseAdmin } from "@/lib/supabaseAdmin";
import { config } from "./config";
import { routePost } from "./router";
import { buildPostingIdempotencyKey } from "./idempotency";

interface QueueJobInput {
  platform: string;
  payload: Record<string, unknown>;
  jobId: string;
  variantId?: string;
  ownerId?: string | null;
  idempotencyKey?: string;
}

interface PostingJobPayload {
  platform: string;
  jobId: string;
  variantId?: string | null;
  data: Record<string, unknown>;
}

interface PostingJobRecord {
  job_id: string;
  payload: PostingJobPayload;
  idempotency_key: string;
  retry_count: number;
  owner_id: string | null;
}

const DEFAULT_POLL_INTERVAL_MS = 3000;
const DEFAULT_BATCH_SIZE = 5;

let workerTimer: NodeJS.Timeout | null = null;
let isPolling = false;

function ensureWorkerRunning() {
  if (workerTimer) return;
  workerTimer = setInterval(() => {
    pollAndProcess().catch((error) => {
      console.error("Posting worker poll failed:", error);
    });
  }, DEFAULT_POLL_INTERVAL_MS);
  pollAndProcess().catch((error) => {
    console.error("Posting worker initial poll failed:", error);
  });
}

export async function enqueue(job: QueueJobInput): Promise<{ enqueued: boolean; jobId?: string }> {
  const supabase = requireSupabaseAdmin();
  const payload: PostingJobPayload = {
    platform: job.platform,
    jobId: job.jobId,
    variantId: job.variantId ?? null,
    data: job.payload,
  };
  const idempotencyKey =
    job.idempotencyKey ||
    buildPostingIdempotencyKey({
      jobId: job.jobId,
      platform: job.platform,
      variantId: job.variantId,
      payload: job.payload,
    });

  const { data, error } = await supabase
    .from("posting_jobs")
    .upsert(
      {
        job_id: crypto.randomUUID(),
        status: "pending",
        payload,
        idempotency_key: idempotencyKey,
        retry_count: 0,
        owner_id: job.ownerId ?? null,
      },
      { onConflict: "idempotency_key", ignoreDuplicates: true }
    )
    .select("job_id")
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to enqueue posting job: ${error.message}`);
  }

  if (data?.job_id) {
    ensureWorkerRunning();
    return { enqueued: true, jobId: data.job_id };
  }

  return { enqueued: false };
}

async function pollAndProcess(): Promise<void> {
  if (isPolling) return;
  isPolling = true;

  try {
    const supabase = requireSupabaseAdmin();
    const { data, error } = await supabase.rpc("claim_posting_jobs", {
      p_limit: DEFAULT_BATCH_SIZE,
    });

    if (error) {
      throw new Error(`Failed to claim posting jobs: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return;
    }

    for (const job of data as PostingJobRecord[]) {
      await processJob(job);
    }
  } finally {
    isPolling = false;
  }
}

async function processJob(job: PostingJobRecord): Promise<void> {
  const supabase = requireSupabaseAdmin();
  const payload = job.payload || ({} as PostingJobPayload);
  const platform = payload.platform;
  const data = payload.data;

  if (!platform) {
    await supabase
      .from("posting_jobs")
      .update({
        status: "failed",
        last_error: "Missing platform in payload",
        updated_at: new Date().toISOString(),
      })
      .eq("job_id", job.job_id);
    return;
  }

  try {
    await routePost(platform, data, {
      jobId: payload.jobId,
      idempotencyKey: job.idempotency_key,
      ownerId: job.owner_id ?? undefined,
    });

    await supabase
      .from("posting_jobs")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("job_id", job.job_id);
  } catch (error) {
    const attempts = (job.retry_count ?? 0) + 1;
    const message = error instanceof Error ? error.message : "Unknown error";

    if (attempts < config.retryAttempts) {
      await supabase
        .from("posting_jobs")
        .update({
          status: "pending",
          retry_count: attempts,
          last_error: message,
          updated_at: new Date().toISOString(),
        })
        .eq("job_id", job.job_id);
    } else {
      await supabase
        .from("posting_jobs")
        .update({
          status: "failed",
          retry_count: attempts,
          last_error: message,
          updated_at: new Date().toISOString(),
        })
        .eq("job_id", job.job_id);
    }
  }
}

export async function getQueueSize(): Promise<number> {
  const supabase = requireSupabaseAdmin();
  const { count, error } = await supabase
    .from("posting_jobs")
    .select("job_id", { count: "exact", head: true })
    .eq("status", "pending");

  if (error) {
    console.error("Failed to get posting queue size:", error);
    return 0;
  }

  return count ?? 0;
}

export function stopPostingWorker(): void {
  if (workerTimer) {
    clearInterval(workerTimer);
    workerTimer = null;
  }
}
