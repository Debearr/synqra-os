/**
 * Market Structure Analyzer
 * - Detects prevailing trend using recent swing progression.
 * - Finds swing highs/lows via a simple fractal lookback.
 * - Marks BOS/CHOCH events when swings break prior swing levels.
 * Intended for confluence scoring and trade filtering in AuraFX.
 */

import {
  Candle,
  StructureEvent,
  StructurePoint,
  TrendDirection,
} from "./types";

interface DetectTrendOptions {
  lookback?: number; // number of candles to consider
  minSwingSizePct?: number; // ignore very small swings
}

const defaultOptions: Required<DetectTrendOptions> = {
  lookback: 50,
  minSwingSizePct: 0.05,
};

export function detectTrend(
  candles: Candle[],
  options?: DetectTrendOptions
): { direction: TrendDirection; reason: string } {
  if (candles.length < 3) {
    return { direction: "RANGE", reason: "Insufficient candles" };
  }
  const { lookback } = { ...defaultOptions, ...options };
  const slice = candles.slice(-lookback);
  const first = slice[0];
  const last = slice[slice.length - 1];
  const changePct = (last.close - first.close) / first.close;

  // Simple heuristic: >+1.5% up is bullish, <-1.5% down is bearish, else range
  if (changePct > 0.015) {
    return { direction: "BULLISH", reason: `Price up ${formatPct(changePct)} over lookback` };
  }
  if (changePct < -0.015) {
    return { direction: "BEARISH", reason: `Price down ${formatPct(changePct)} over lookback` };
  }
  return { direction: "RANGE", reason: `Sideways ${formatPct(changePct)} over lookback` };
}

export function detectStructurePoints(
  candles: Candle[],
  window = 2
): StructurePoint[] {
  // Fractal detection: a swing high has 'window' candles on both sides with lower highs; swing low is inverse.
  const points: StructurePoint[] = [];
  for (let i = window; i < candles.length - window; i++) {
    const prev = candles.slice(i - window, i);
    const next = candles.slice(i + 1, i + 1 + window);
    const candle = candles[i];
    const isSwingHigh =
      prev.every((c) => c.high < candle.high) &&
      next.every((c) => c.high < candle.high);
    const isSwingLow =
      prev.every((c) => c.low > candle.low) &&
      next.every((c) => c.low > candle.low);

    if (isSwingHigh) {
      points.push({
        type: "SWING_HIGH",
        index: i,
        price: candle.high,
        time: candle.time,
      });
    }
    if (isSwingLow) {
      points.push({
        type: "SWING_LOW",
        index: i,
        price: candle.low,
        time: candle.time,
      });
    }
  }
  return points;
}

export function detectStructureEvents(
  swings: StructurePoint[]
): StructureEvent[] {
  const events: StructureEvent[] = [];
  if (swings.length < 2) return events;

  // Deterministic BOS/CHOCH detection:
  // - BOS: higher high following a swing low (bullish) or lower low following a swing high (bearish).
  // - CHOCH: a change of character when sequence flips (e.g., bullish swings then a lower low).
  for (let i = 1; i < swings.length; i++) {
    const prev = swings[i - 1];
    const curr = swings[i];
    const dir = resolveDirection(prev, curr);
    if (!dir) continue;

    const isContinuation =
      (dir === "BULLISH" && curr.type === "SWING_HIGH" && curr.price > prev.price) ||
      (dir === "BEARISH" && curr.type === "SWING_LOW" && curr.price < prev.price);

    const eventType = isContinuation ? "BOS" : "CHOCH";

    events.push({
      type: eventType,
      direction: dir,
      brokenLevel: prev.price,
      atIndex: curr.index,
      time: curr.time,
      fromSwing: prev,
      toSwing: curr,
    });
  }

  return events;
}

function resolveDirection(
  prev: StructurePoint,
  curr: StructurePoint
): TrendDirection | null {
  if (prev.type === "SWING_LOW" && curr.type === "SWING_HIGH") {
    return curr.price > prev.price ? "BULLISH" : "RANGE";
  }
  if (prev.type === "SWING_HIGH" && curr.type === "SWING_LOW") {
    return curr.price < prev.price ? "BEARISH" : "RANGE";
  }
  return null;
}

const formatPct = (v: number) => `${(v * 100).toFixed(2)}%`;
