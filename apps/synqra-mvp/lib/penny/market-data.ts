import "server-only";

import { Candle, Timeframe } from "@/lib/aura-fx/types";
import { requireSupabaseAdmin } from "@/lib/supabaseAdmin";

// Block 4 keeps market scope intentionally narrow. Do not expand asset coverage here yet.
export const PENNY_SUPPORTED_PAIRS = ["EURUSD", "GBPUSD", "XAUUSD"] as const;
export const PENNY_SUPPORTED_TIMEFRAMES = ["M15", "H1", "H4"] as const satisfies ReadonlyArray<Timeframe>;
export const PENNY_MIN_SIGNAL_CANDLES = 80;
export const PENNY_CANDLE_FETCH_LIMIT = 120;

type SupportedPair = (typeof PENNY_SUPPORTED_PAIRS)[number];
type SupportedTimeframe = (typeof PENNY_SUPPORTED_TIMEFRAMES)[number];

export type PennyCandleIngestInput = {
  ownerId: string;
  pair: string;
  timeframe: Timeframe | string;
  candles: Candle[];
  source?: string;
};

function normalizeText(value: string): string {
  return value.trim();
}

export function normalizePennyPair(pair: string): SupportedPair {
  const normalized = normalizeText(pair).toUpperCase().replace("/", "");
  if (!PENNY_SUPPORTED_PAIRS.includes(normalized as SupportedPair)) {
    throw new Error(`Unsupported Penny pair: ${pair}`);
  }

  return normalized as SupportedPair;
}

export function normalizePennyTimeframe(timeframe: Timeframe | string): SupportedTimeframe {
  const normalized = normalizeText(String(timeframe)).toUpperCase();
  if (!PENNY_SUPPORTED_TIMEFRAMES.includes(normalized as SupportedTimeframe)) {
    throw new Error(`Unsupported Penny timeframe: ${timeframe}`);
  }

  return normalized as SupportedTimeframe;
}

export function assertPennyMarketScope(pair: string, timeframe: Timeframe | string) {
  return {
    pair: normalizePennyPair(pair),
    timeframe: normalizePennyTimeframe(timeframe),
  };
}

export async function persistPennyAuraCandles(input: PennyCandleIngestInput): Promise<{
  count: number;
  pair: SupportedPair;
  timeframe: SupportedTimeframe;
  latestCandleTime: string | null;
}> {
  const supabase = requireSupabaseAdmin();
  const ownerId = normalizeText(input.ownerId);
  const { pair, timeframe } = assertPennyMarketScope(input.pair, input.timeframe);
  const source = input.source?.trim() || "internal_ingest";

  if (!ownerId) {
    throw new Error("ownerId is required");
  }

  if (!Array.isArray(input.candles) || input.candles.length === 0) {
    throw new Error("At least one candle is required");
  }

  const rows = input.candles.map((candle) => {
    if (
      typeof candle.time !== "number" ||
      typeof candle.open !== "number" ||
      typeof candle.high !== "number" ||
      typeof candle.low !== "number" ||
      typeof candle.close !== "number"
    ) {
      throw new Error("Invalid candle payload");
    }

    return {
      owner_id: ownerId,
      pair,
      timeframe,
      candle_time: new Date(candle.time).toISOString(),
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
      volume: typeof candle.volume === "number" ? candle.volume : null,
      source,
    };
  });

  const { error } = await supabase.from("aura_candles").upsert(rows, {
    onConflict: "owner_id,pair,timeframe,candle_time",
  });

  if (error) {
    throw new Error(`Failed to persist Penny candles: ${error.message}`);
  }

  const latestCandleTime =
    rows
      .map((row) => row.candle_time)
      .sort()
      .slice(-1)[0] ?? null;

  return {
    count: rows.length,
    pair,
    timeframe,
    latestCandleTime,
  };
}

export async function getLatestPennyAuraCandles(input: {
  ownerId: string;
  pair: string;
  timeframe: Timeframe | string;
  limit?: number;
}): Promise<Candle[]> {
  const supabase = requireSupabaseAdmin();
  const ownerId = normalizeText(input.ownerId);
  const { pair, timeframe } = assertPennyMarketScope(input.pair, input.timeframe);
  const limit = Math.max(PENNY_MIN_SIGNAL_CANDLES, Math.min(input.limit ?? PENNY_CANDLE_FETCH_LIMIT, 300));

  if (!ownerId) {
    throw new Error("ownerId is required");
  }

  const { data, error } = await supabase
    .from("aura_candles")
    .select("candle_time,open,high,low,close,volume")
    .eq("owner_id", ownerId)
    .eq("pair", pair)
    .eq("timeframe", timeframe)
    .order("candle_time", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to load Penny candles: ${error.message}`);
  }

  return (data || [])
    .slice()
    .reverse()
    .map((row) => ({
      time: new Date(String(row.candle_time)).getTime(),
      open: Number(row.open),
      high: Number(row.high),
      low: Number(row.low),
      close: Number(row.close),
      volume: row.volume == null ? undefined : Number(row.volume),
      timeframe,
    }));
}
