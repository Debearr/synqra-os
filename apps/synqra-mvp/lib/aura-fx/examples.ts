/**
 * Usage examples (pseudo-tests) for AuraFX core engines.
 *
 * Demonstrates how to derive a MarketContext by:
 * 1) Running market structure (trend, swings, BOS/CHOCH)
 * 2) Mapping liquidity pools
 * 3) Checking killzone activity
 */

import { Candle, MarketContext } from "./types";
import { detectTrend, detectStructureEvents, detectStructurePoints } from "./marketStructure";
import { findLiquidityPools } from "./liquidity";
import { getKillzone } from "./killzones";

export function buildMarketContext(candles: Candle[], tzOffsetMinutes = 0): MarketContext {
  const trend = detectTrend(candles);
  const swings = detectStructurePoints(candles, 2);
  const events = detectStructureEvents(swings);
  const liquidityPools = findLiquidityPools(candles, swings);
  const session = getKillzone(candles[candles.length - 1]?.time ?? Date.now(), tzOffsetMinutes);

  return {
    trend,
    structurePoints: swings,
    structureEvents: events,
    liquidityPools,
    session,
  };
}

// Example invocation (for docs/tests):
// const candles: Candle[] = [
//   { time: 1710000000000, open: 1.1, high: 1.12, low: 1.09, close: 1.11 },
//   { time: 1710000060000, open: 1.11, high: 1.13, low: 1.1, close: 1.12 },
//   ...
// ];
// const ctx = buildMarketContext(candles, 0);
// console.log(ctx.trend.direction, ctx.liquidityPools, ctx.session.killzone);
