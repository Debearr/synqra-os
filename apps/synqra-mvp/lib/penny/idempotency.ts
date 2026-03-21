import "server-only";

import { createHash } from "crypto";

import { Timeframe } from "@/lib/aura-fx/types";
import { generateIdempotencyKey } from "@/lib/jobs/idempotency";
import { assertPennyMarketScope } from "./market-data";

export function buildPennySignalSourceIdempotencyKey(input: {
  ownerId: string;
  pair: string;
  timeframe: Timeframe | string;
  latestCandleTime: number;
}): string {
  const { pair, timeframe } = assertPennyMarketScope(input.pair, input.timeframe);

  return createHash("sha256")
    .update(`${input.ownerId.trim()}:${pair}:${timeframe}:${input.latestCandleTime}`)
    .digest("hex");
}

export function buildPennyDeliveryIdempotencyKey(input: {
  signalId: string;
  chatId: string;
}): string {
  return createHash("sha256")
    .update(`${input.signalId}:${input.chatId.trim()}`)
    .digest("hex");
}

export function buildPennyAuraSignalFlowJobIdempotencyKey(input: {
  ownerId: string;
  pair: string;
  timeframe: Timeframe | string;
  latestCandleTime: string;
  source?: string | null;
}): string {
  const { pair, timeframe } = assertPennyMarketScope(input.pair, input.timeframe);
  const payload = {
    ownerId: input.ownerId.trim(),
    pair,
    timeframe,
    latestCandleTime: input.latestCandleTime.trim(),
    source: input.source?.trim() || "internal_ingest",
  };

  return generateIdempotencyKey("penny_aura_signal_flow", payload, payload.latestCandleTime);
}
