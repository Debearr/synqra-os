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
  const { data, error } = await supabase
    .from("scheduling_requests")
    .select("id,user_id,content_id,platform,scheduled_time,approved_by,approved_at,metadata")
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
  }>;

  const result: ScheduleRunResult = {
    scanned: rows.length,
    published: 0,
    skipped: 0,
    failed: 0,
  };

  for (const row of rows) {
    const publishResult = await publishApprovedRequest(row);
    if (publishResult.status === "published") {
      await markSchedulingRequest(row.id, "completed", {
        ...(row.metadata || {}),
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

