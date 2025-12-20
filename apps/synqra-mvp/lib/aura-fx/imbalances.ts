/**
 * Imbalance Detector
 * - Identifies basic order blocks (last opposite candle before impulse) and 3-candle fair value gaps.
 * - Heuristic and deterministic for unit testing; intended as inputs to confluence scoring.
 */

import { Candle, FairValueGap, OrderBlock, TrendDirection } from "./types";

interface FindOrderBlocksOptions {
  minImpulsePct?: number; // minimum move after the block to count as valid
}

const defaultOBOptions: Required<FindOrderBlocksOptions> = {
  minImpulsePct: 0.0015, // 0.15%
};

export function findOrderBlocks(
  candles: Candle[],
  direction: TrendDirection,
  options?: FindOrderBlocksOptions
): OrderBlock[] {
  const { minImpulsePct } = { ...defaultOBOptions, ...options };
  const blocks: OrderBlock[] = [];

  for (let i = 1; i < candles.length - 2; i++) {
    const prev = candles[i - 1];
    const curr = candles[i];
    const next = candles[i + 1];

    // For bullish OB: last down candle before up impulse; for bearish: last up candle before down impulse
    const isBullishOB =
      direction === "BULLISH" && curr.close < curr.open && next.close > curr.high;
    const isBearishOB =
      direction === "BEARISH" && curr.close > curr.open && next.close < curr.low;

    if (!isBullishOB && !isBearishOB) continue;

    const impulseMove =
      direction === "BULLISH"
        ? (next.close - curr.low) / curr.low
        : (curr.high - next.close) / curr.high;

    if (impulseMove < minImpulsePct) continue;

    blocks.push({
      type: isBullishOB ? "DEMAND" : "SUPPLY",
      originIndex: i,
      priceRange: { low: curr.low, high: curr.high },
      isMitigated: false,
    });
  }

  return blocks;
}

interface FindFVGOptions {
  minSizePct?: number;
}

const defaultFvgOptions: Required<FindFVGOptions> = {
  minSizePct: 0.0005, // 0.05%
};

export function findFairValueGaps(
  candles: Candle[],
  options?: FindFVGOptions
): FairValueGap[] {
  const { minSizePct } = { ...defaultFvgOptions, ...options };
  const gaps: FairValueGap[] = [];

  for (let i = 0; i < candles.length - 2; i++) {
    const a = candles[i];
    const b = candles[i + 1];
    const c = candles[i + 2];

    // Bullish FVG: candle B low > candle A high && candle C low > candle A high
    const bullishGap = b.low > a.high && c.low > a.high;
    // Bearish FVG: candle B high < candle A low && candle C high < candle A low
    const bearishGap = b.high < a.low && c.high < a.low;

    if (!bullishGap && !bearishGap) continue;

    const sizePct = bullishGap
      ? (b.low - a.high) / a.high
      : (a.low - b.high) / a.low;
    if (sizePct < minSizePct) continue;

    gaps.push({
      direction: bullishGap ? "BULLISH" : "BEARISH",
      priceRange: bullishGap
        ? { low: a.high, high: b.low }
        : { low: b.high, high: a.low },
      startIndex: i,
      endIndex: i + 2,
      isFilled: false,
    });
  }

  return gaps;
}
