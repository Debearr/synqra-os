import { config } from "./config";
import { routePost } from "./router";
import { requireSupabaseAdmin } from "@/lib/supabaseAdmin";
import { randomUUID } from "crypto";

interface QueueJob {
  id: string;
  platform: string;
  payload: Record<string, unknown>;
  jobId: string;
  attempts: number;
  scheduledPostId: string | null;
}

type ScheduledPostRow = {
  id: string;
  job_id: string;
  platform: string;
  payload: Record<string, unknown> | null;
  retry_count: number | null;
};

const queue: QueueJob[] = [];
let isProcessing = false;
let hasHydratedFromStore = false;

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function persistScheduledPost(job: QueueJob): Promise<string | null> {
  if (!isUuid(job.jobId)) {
    console.warn(`[queue] Skipping durable write: jobId is not a UUID (${job.jobId})`);
    return null;
  }

  try {
    const supabase = requireSupabaseAdmin();
    const { data, error } = await supabase
      .from("scheduled_posts")
      .insert({
        job_id: job.jobId,
        platform: job.platform,
        scheduled_for: new Date().toISOString(),
        status: "queued",
        retry_count: 0,
        payload: job.payload,
      })
      .select("id")
      .single();

    if (error) {
      console.error("[queue] Failed to persist scheduled post:", error.message);
      return null;
    }

    return data.id;
  } catch (error) {
    console.error("[queue] Failed to persist scheduled post:", error);
    return null;
  }
}

async function updateScheduledPost(
  scheduledPostId: string | null,
  patch: Record<string, unknown>
): Promise<void> {
  if (!scheduledPostId) return;

  try {
    const supabase = requireSupabaseAdmin();
    const { error } = await supabase.from("scheduled_posts").update(patch).eq("id", scheduledPostId);
    if (error) {
      console.error("[queue] Failed to update scheduled post:", error.message);
    }
  } catch (error) {
    console.error("[queue] Failed to update scheduled post:", error);
  }
}

async function hydrateQueueFromStore(): Promise<void> {
  if (hasHydratedFromStore) return;
  hasHydratedFromStore = true;

  try {
    const supabase = requireSupabaseAdmin();
    const { data, error } = await supabase
      .from("scheduled_posts")
      .select("id,job_id,platform,payload,retry_count")
      .in("status", ["queued", "pending"])
      .order("scheduled_for", { ascending: true })
      .limit(100);

    if (error) {
      console.error("[queue] Failed to hydrate queued posts:", error.message);
      return;
    }

    const rows = (data || []) as ScheduledPostRow[];
    for (const row of rows) {
      if (!row.payload || typeof row.payload !== "object") continue;
      queue.push({
        id: row.id,
        platform: row.platform,
        payload: row.payload,
        jobId: row.job_id,
        attempts: row.retry_count ?? 0,
        scheduledPostId: row.id,
      });
    }
  } catch (error) {
    console.error("[queue] Failed to hydrate queued posts:", error);
  }
}

export function enqueue(job: Omit<QueueJob, "id" | "attempts" | "scheduledPostId">): void {
  const queueJob: QueueJob = {
    ...job,
    id: randomUUID(),
    attempts: 0,
    scheduledPostId: null,
  };

  queue.push(queueJob);
  console.log(`[queue] Enqueued: ${job.platform} for job ${job.jobId}`);

  void (async () => {
    queueJob.scheduledPostId = await persistScheduledPost(queueJob);
    await processQueue();
  })();
}

async function processQueue(): Promise<void> {
  if (isProcessing) return;
  await hydrateQueueFromStore();
  if (queue.length === 0) return;

  isProcessing = true;

  try {
    const job = queue.shift();
    if (!job) return;

    await updateScheduledPost(job.scheduledPostId, {
      status: "processing",
      error_message: null,
      retry_count: job.attempts,
    });

    try {
      await routePost(job.platform, job.payload);
      console.log(`[queue] Processed: ${job.platform} for job ${job.jobId}`);
      await updateScheduledPost(job.scheduledPostId, {
        status: "posted",
        posted_at: new Date().toISOString(),
        error_message: null,
      });
    } catch (error) {
      job.attempts += 1;
      const message = error instanceof Error ? error.message : "Unknown posting error";

      if (job.attempts < config.retryAttempts) {
        const delay = config.retryDelays[job.attempts - 1] || 60000;
        console.warn(`[queue] Retry ${job.attempts}/${config.retryAttempts} for ${job.platform} in ${delay}ms`);
        await updateScheduledPost(job.scheduledPostId, {
          status: "queued",
          retry_count: job.attempts,
          error_message: message,
        });

        setTimeout(() => {
          queue.unshift(job);
          void processQueue();
        }, delay);
      } else {
        console.error(`[queue] Failed permanently: ${job.platform} for job ${job.jobId}`, message);
        await updateScheduledPost(job.scheduledPostId, {
          status: "failed",
          retry_count: job.attempts,
          error_message: message,
        });
      }
    }
  } finally {
    isProcessing = false;
    if (queue.length > 0) {
      setTimeout(() => {
        void processQueue();
      }, 1000);
    }
  }
}

export function getQueueSize(): number {
  return queue.length;
}
