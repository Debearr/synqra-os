import { logTelemetryEvent } from "../adapters/firebase-telemetry.js";
import { getSupabaseClient } from "../adapters/supabase.js";

type OutcomeAuditResult = {
  scanned: number;
  summaryRowsUpserted: number;
};

type SummaryAccumulator = {
  user_id: string;
  summary_date: string;
  platform: string | null;
  event_type: string;
  pass_count: number;
  fail_count: number;
  fail_reasons: Record<string, number>;
  metadata: Record<string, unknown>;
};

const PASS_STATUSES = new Set(["success", "completed", "approved", "published", "pass"]);

function buildKey(userId: string, summaryDate: string, platform: string | null, eventType: string): string {
  return `${userId}::${summaryDate}::${platform || "_"}::${eventType}`;
}

export async function runOutcomeAuditRunner(): Promise<OutcomeAuditResult> {
  const supabase = getSupabaseClient();
  const sinceIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const summaryDate = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("outcome_events")
    .select("user_id,event_type,status,platform,metadata")
    .gte("created_at", sinceIso)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to query outcome events: ${error.message}`);
  }

  const events = (data || []) as Array<{
    user_id: string;
    event_type: string;
    status: string;
    platform: string | null;
    metadata: Record<string, unknown> | null;
  }>;

  const aggregate = new Map<string, SummaryAccumulator>();
  for (const event of events) {
    const key = buildKey(event.user_id, summaryDate, event.platform, event.event_type);
    const current =
      aggregate.get(key) ||
      ({
        user_id: event.user_id,
        summary_date: summaryDate,
        platform: event.platform,
        event_type: event.event_type,
        pass_count: 0,
        fail_count: 0,
        fail_reasons: {},
        metadata: {
          source: "cloud-run-worker",
          window_start: sinceIso,
        },
      } satisfies SummaryAccumulator);

    const normalizedStatus = event.status.trim().toLowerCase();
    if (PASS_STATUSES.has(normalizedStatus)) {
      current.pass_count += 1;
    } else {
      current.fail_count += 1;
      const reason =
        (event.metadata && typeof event.metadata.reason === "string" && event.metadata.reason.trim()) || normalizedStatus;
      current.fail_reasons[reason] = (current.fail_reasons[reason] || 0) + 1;
    }

    aggregate.set(key, current);
  }

  if (aggregate.size > 0) {
    const rows = Array.from(aggregate.values());
    const { error: upsertError } = await supabase.from("outcome_audit_summary").upsert(rows, {
      onConflict: "user_id,summary_date,platform,event_type",
    });

    if (upsertError) {
      throw new Error(`Failed to upsert outcome audit summary: ${upsertError.message}`);
    }
  }

  await logTelemetryEvent({
    eventName: "outcome_audit_completed",
    properties: {
      summaryDate,
      scanned: events.length,
      rows: aggregate.size,
    },
  });

  return {
    scanned: events.length,
    summaryRowsUpserted: aggregate.size,
  };
}

