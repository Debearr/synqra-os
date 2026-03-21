import "server-only";

import { Timeframe } from "@/lib/aura-fx/types";
import { requireSupabaseAdmin } from "@/lib/supabaseAdmin";
import { buildPennyAuraSignalFlowJobIdempotencyKey } from "./idempotency";
import { assertPennyMarketScope } from "./market-data";

export const PENNY_AURA_SIGNAL_FLOW_JOB_TYPE = "penny_aura_signal_flow";

export async function enqueuePennyAuraSignalFlowJob(input: {
  ownerId: string;
  pair: string;
  timeframe: Timeframe | string;
  latestCandleTime: string;
  source?: string;
  scheduledTime?: string | null;
}): Promise<{ jobId: string | null; idempotencyKey: string; duplicate: boolean }> {
  const supabase = requireSupabaseAdmin();
  const ownerId = input.ownerId.trim();
  const { pair, timeframe } = assertPennyMarketScope(input.pair, input.timeframe);
  const latestCandleTime = input.latestCandleTime.trim();

  if (!ownerId) {
    throw new Error("ownerId is required");
  }

  if (!latestCandleTime) {
    throw new Error("latestCandleTime is required");
  }

  const scheduledTime = input.scheduledTime?.trim() || new Date().toISOString();
  const payload = {
    ownerId,
    pair,
    timeframe,
    latestCandleTime,
    source: input.source?.trim() || "internal_ingest",
  };
  const idempotencyKey = buildPennyAuraSignalFlowJobIdempotencyKey({
    ownerId,
    pair,
    timeframe,
    latestCandleTime,
    source: payload.source,
  });

  const { data, error } = await supabase
    .from("background_job_runs")
    .insert({
      user_id: ownerId,
      job_type: PENNY_AURA_SIGNAL_FLOW_JOB_TYPE,
      status: "pending",
      payload,
      scheduled_time: scheduledTime,
      retry_count: 0,
      idempotency_key: idempotencyKey,
      metadata: {
        penny: true,
        flow: "aura_signal_flow",
        pair,
        timeframe,
        latestCandleTime,
      },
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return {
        jobId: null,
        idempotencyKey,
        duplicate: true,
      };
    }

    throw new Error(`Failed to enqueue Penny signal job: ${error.message}`);
  }

  return {
    jobId: String(data.id),
    idempotencyKey,
    duplicate: false,
  };
}
