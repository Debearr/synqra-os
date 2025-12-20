/**
 * Confluence Scorer
 * - Combines trend, structure, liquidity, imbalances, and time-of-day into a weighted probability score.
 * - Returns a ConfluenceBreakdown with bias and human-readable notes for downstream consumers.
 */

import {
  Bias,
  ConfluenceBreakdown,
  FairValueGap,
  Killzone,
  LiquidityPool,
  OrderBlock,
  StructureEvent,
  TrendDirection,
} from "./types";

interface ConfluenceInputs {
  trendDirection: TrendDirection;
  structureEvents: StructureEvent[];
  liquidityPools: LiquidityPool[];
  orderBlocks: OrderBlock[];
  fairValueGaps: FairValueGap[];
  killzone: { killzone: Killzone; isActive: boolean };
  multiTimeframeBias?: TrendDirection;
}

const weights = {
  alignment: 0.35,
  liquidity: 0.3,
  timeframe: 0.2,
  time: 0.15,
};

export function scoreConfluence(inputs: ConfluenceInputs): ConfluenceBreakdown {
  const notes: string[] = [];

  const alignmentScore = scoreAlignment(inputs, notes);
  const liquidityScore = scoreLiquidity(inputs, notes);
  const timeframeScore = scoreTimeframe(inputs, notes);
  const timeScore = scoreTime(inputs, notes);

  const overallScore =
    alignmentScore * weights.alignment +
    liquidityScore * weights.liquidity +
    timeframeScore * weights.timeframe +
    timeScore * weights.time;

  const primaryBias = resolveBias(inputs, alignmentScore, liquidityScore, timeframeScore);

  return {
    trendScore: alignmentScore,
    liquidityScore,
    structureScore: alignmentScore, // reuse alignment for structure weight placeholder
    timeScore,
    overallScore: clamp01(overallScore),
    primaryBias,
    notes,
  };
}

function scoreAlignment(
  inputs: ConfluenceInputs,
  notes: string[]
): number {
  const trend = inputs.trendDirection;
  const hasBullishOB = inputs.orderBlocks.some((ob) => ob.type === "DEMAND");
  const hasBearishOB = inputs.orderBlocks.some((ob) => ob.type === "SUPPLY");
  const hasBullishFVG = inputs.fairValueGaps.some((fvg) => fvg.direction === "BULLISH");
  const hasBearishFVG = inputs.fairValueGaps.some((fvg) => fvg.direction === "BEARISH");

  let score = 0.5;
  if (trend === "BULLISH" && hasBullishOB) {
    score += 0.2;
    notes.push("Bullish HTF with demand OB");
  }
  if (trend === "BEARISH" && hasBearishOB) {
    score += 0.2;
    notes.push("Bearish HTF with supply OB");
  }
  if (trend === "BULLISH" && hasBullishFVG) {
    score += 0.1;
    notes.push("Bullish FVG supports continuation");
  }
  if (trend === "BEARISH" && hasBearishFVG) {
    score += 0.1;
    notes.push("Bearish FVG supports continuation");
  }

  // Conflict rules: MSS over FVG continuation
  const hasBearishEvent = inputs.structureEvents.some((e) => e.direction === "BEARISH");
  const hasBullishEvent = inputs.structureEvents.some((e) => e.direction === "BULLISH");
  if (trend === "BULLISH" && hasBearishEvent) {
    score -= 0.2;
    notes.push("MSS/BOS against bullish trend");
  }
  if (trend === "BEARISH" && hasBullishEvent) {
    score -= 0.2;
    notes.push("MSS/BOS against bearish trend");
  }

  return clamp01(score);
}

function scoreLiquidity(inputs: ConfluenceInputs, notes: string[]): number {
  const bsl = inputs.liquidityPools.filter((p) => p.type === "BSL");
  const ssl = inputs.liquidityPools.filter((p) => p.type === "SSL");

  let score = 0.5;

  if (inputs.trendDirection === "BULLISH" && ssl.length) {
    score += 0.2;
    notes.push("Liquidity resting below (SSL) for potential sweep");
  }
  if (inputs.trendDirection === "BEARISH" && bsl.length) {
    score += 0.2;
    notes.push("Liquidity resting above (BSL) for potential sweep");
  }

  // Conflict: if both sides equal, neutralize
  if (bsl.length && ssl.length) {
    score -= 0.1;
    notes.push("Both BSL/SSL present; liquidity balanced");
  }

  return clamp01(score);
}

function scoreTimeframe(inputs: ConfluenceInputs, notes: string[]): number {
  if (!inputs.multiTimeframeBias) return 0.5;
  if (inputs.multiTimeframeBias === inputs.trendDirection) {
    notes.push("Multi-timeframe agreement");
    return 0.8;
  }
  notes.push("Timeframe conflict – stand aside.");
  return 0.2;
}

function scoreTime(inputs: ConfluenceInputs, notes: string[]): number {
  if (inputs.killzone.isActive) {
    notes.push(`${inputs.killzone.killzone} active`);
    return 0.8;
  }
  return 0.4;
}

function resolveBias(
  inputs: ConfluenceInputs,
  alignmentScore: number,
  liquidityScore: number,
  timeframeScore: number
): Bias {
  // Strong conflict between HTF and multi-timeframe → no trade
  if (
    inputs.multiTimeframeBias &&
    inputs.multiTimeframeBias !== inputs.trendDirection &&
    timeframeScore < 0.3
  ) {
    return "NO_TRADE";
  }

  const combined = alignmentScore * 0.5 + liquidityScore * 0.3 + timeframeScore * 0.2;
  if (combined >= 0.65) {
    return inputs.trendDirection === "BULLISH" ? "LONG" : "SHORT";
  }
  if (combined <= 0.4) {
    return "NO_TRADE";
  }
  return inputs.trendDirection === "BULLISH" ? "LONG" : "SHORT";
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
