/**
 * Regime Detection
 * - Classifies market behavior as EXPANSION or MEAN_REVERSION.
 * - Uses simple volatility + slope heuristics for deterministic output.
 */

import type { Candle, RegimeState, TrendDirection } from "./types";

interface DetectRegimeOptions {
  lookback?: number;
  expansionSlopePct?: number;
  expansionVolatilityRatio?: number;
}

const defaultOptions: Required<DetectRegimeOptions> = {
  lookback: 30,
  expansionSlopePct: 0.012,
  expansionVolatilityRatio: 1.3,
};

export function detectRegime(
  candles: Candle[],
  trendDirection: TrendDirection,
  options?: DetectRegimeOptions
): RegimeState {
  if (candles.length < 5) {
    return {
      state: "MEAN_REVERSION",
      confidence: 0.4,
      reason: "Insufficient candles for regime detection",
    };
  }

  const { lookback, expansionSlopePct, expansionVolatilityRatio } = {
    ...defaultOptions,
    ...options,
  };

  const slice = candles.slice(-lookback);
  const first = slice[0];
  const last = slice[slice.length - 1];
  const slopePct = (last.close - first.close) / first.close;

  const ranges = slice.map((c) => Math.max(0, c.high - c.low));
  const avgRange = average(ranges);
  const lastRange = ranges[ranges.length - 1] ?? avgRange;
  const volatilityRatio = avgRange > 0 ? lastRange / avgRange : 0;

  const trending = trendDirection !== "RANGE";
  const expansionSignal =
    Math.abs(slopePct) >= expansionSlopePct &&
    volatilityRatio >= expansionVolatilityRatio &&
    trending;

  if (expansionSignal) {
    return {
      state: "EXPANSION",
      confidence: clamp01(0.55 + Math.min(0.4, Math.abs(slopePct) * 10)),
      reason: "Directional slope and elevated volatility indicate expansion",
      metrics: {
        slopePct,
        avgRange,
        lastRange,
        volatilityRatio,
      },
    };
  }

  return {
    state: "MEAN_REVERSION",
    confidence: clamp01(0.5 + (trendDirection === "RANGE" ? 0.2 : 0.05)),
    reason: trending
      ? "Slope/volatility below expansion threshold; favor mean reversion"
      : "Range-bound price action; favor mean reversion",
    metrics: {
      slopePct,
      avgRange,
      lastRange,
      volatilityRatio,
    },
  };
}

function average(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
