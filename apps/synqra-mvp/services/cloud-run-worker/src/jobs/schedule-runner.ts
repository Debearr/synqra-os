import { recordInternalOutcome } from "../adapters/router-client.js";
import { getSupabaseClient } from "../adapters/supabase.js";
import { checkPlatformBanRisk, validatePublishRequest } from "../policies/platform-safety.js";

type ScheduleRunResult = {
  scanned: number;
  published: number;
  skipped: number;
  failed: number;
};

async function markSchedulingRequest(id: string, status: string, metadata: Record<string, unknown>) {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("scheduling_requests")
    .update({
      approval_status: status,
      metadata,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    throw new Error(`Failed updating scheduling request ${id}: ${error.message}`);
  }
}

async function claimApprovedSchedulingRequest(row: {
  id: string;
  updated_at: string;
  metadata: Record<string, unknown> | null;
}, lockToken: string, nowIso: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("scheduling_requests")
    .update({
      metadata: {
        ...(row.metadata || {}),
        lastAttemptAt: nowIso,
        workerLockToken: lockToken,
      },
      updated_at: nowIso,
    })
    .eq("id", row.id)
    .eq("approval_status", "approved")
    .eq("updated_at", row.updated_at)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(`Failed claiming scheduling request ${row.id}: ${error.message}`);
  }

  return Boolean(data?.id);
}

async function publishApprovedRequest(row: {
  id: string;
  user_id: string;
  content_id: string;
  platform: string;
  scheduled_time: string;
  approved_by: string | null;
  approved_at: string | null;
  metadata: Record<string, unknown> | null;
}): Promise<{ status: "published" | "skipped" | "failed"; reason?: string }> {
  if (!row.approved_by || !row.approved_at) {
    return { status: "failed", reason: "Missing explicit approval record" };
  }

  const content = String(row.metadata?.content || row.content_id || "");
  const publishValidation = validatePublishRequest(row.platform, content);
  if (!publishValidation.ok) {
    return { status: "skipped", reason: publishValidation.reason };
  }

  const banRisk = await checkPlatformBanRisk(row.user_id, row.platform);
  if (!banRisk.ok) {
    return { status: "failed", reason: banRisk.reason };
  }

  return { status: "published" };
}

export async function runScheduleRunner(): Promise<ScheduleRunResult> {
  const supabase = getSupabaseClient();
  const nowIso = new Date().toISOString();
  const backlogAlertThreshold = Number.parseInt(
    process.env.SCHEDULER_BACKLOG_ALERT_THRESHOLD || "200",
    10
  );
  const { count: backlogCount, error: backlogError } = await supabase
    .from("scheduling_requests")
    .select("id", { count: "exact", head: true })
    .eq("approval_status", "approved")
    .lte("scheduled_time", nowIso);

  if (!backlogError && typeof backlogCount === "number") {
    console.info(
      JSON.stringify({
        level: "info",
        message: "scheduler.queue.backlog",
        backlogCount,
        backlogAlertThreshold,
      })
    );
    if (backlogCount > backlogAlertThreshold) {
      console.warn(
        JSON.stringify({
          level: "warn",
          message: "scheduler.queue.backlog_exceeded",
          backlogCount,
          backlogAlertThreshold,
        })
      );
    }
  }

  const { data, error } = await supabase
    .from("scheduling_requests")
    .select("id,user_id,content_id,platform,scheduled_time,approved_by,approved_at,metadata,updated_at")
    .eq("approval_status", "approved")
    .lte("scheduled_time", nowIso)
    .order("scheduled_time", { ascending: true })
    .limit(100);

  if (error) {
    throw new Error(`Failed to query approved scheduling requests: ${error.message}`);
  }

  const rows = (data || []) as Array<{
    id: string;
    user_id: string;
    content_id: string;
    platform: string;
    scheduled_time: string;
    approved_by: string | null;
    approved_at: string | null;
    metadata: Record<string, unknown> | null;
    updated_at: string;
  }>;

  const result: ScheduleRunResult = {
    scanned: rows.length,
    published: 0,
    skipped: 0,
    failed: 0,
  };

  for (const row of rows) {
    const lockToken = `${nowIso}:${row.id}`;
    const claimed = await claimApprovedSchedulingRequest(row, lockToken, nowIso);
    if (!claimed) {
      continue;
    }

    const publishResult = await publishApprovedRequest(row);
    if (publishResult.status === "published") {
      await markSchedulingRequest(row.id, "completed", {
        ...(row.metadata || {}),
        workerLockToken: lockToken,
        publishedAt: nowIso,
      });
      await recordInternalOutcome({
        userId: row.user_id,
        eventType: "published",
        status: "success",
        platform: row.platform,
        metadata: {
          schedulingRequestId: row.id,
        },
        outcomeClassification: "scheduled_publish",
      });
      result.published += 1;
      continue;
    }

    if (publishResult.status === "skipped") {
      await markSchedulingRequest(row.id, "approved", {
        ...(row.metadata || {}),
        workerLockToken: lockToken,
        lastSkipReason: publishResult.reason || "Skipped by scheduler policy",
        lastAttemptAt: nowIso,
      });
      await recordInternalOutcome({
        userId: row.user_id,
        eventType: "scheduled",
        status: "skipped",
        platform: row.platform,
        metadata: {
          schedulingRequestId: row.id,
          reason: publishResult.reason || "Skipped by scheduler policy",
        },
        outcomeClassification: "scheduled_publish_skipped",
      });
      result.skipped += 1;
      continue;
    }

    await markSchedulingRequest(row.id, "approved", {
      ...(row.metadata || {}),
      workerLockToken: lockToken,
      lastError: publishResult.reason || "Publish execution failed",
      lastAttemptAt: nowIso,
    });
    await recordInternalOutcome({
      userId: row.user_id,
      eventType: "scheduled",
      status: "failed",
      platform: row.platform,
      metadata: {
        schedulingRequestId: row.id,
        reason: publishResult.reason || "Publish execution failed",
      },
      outcomeClassification: "scheduled_publish_failed",
    });
    result.failed += 1;
  }

  return result;
}

