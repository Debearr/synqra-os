/**
 * AuraFX Engine Entry
 * - Composes market structure, liquidity, killzones, imbalance detection, and confluence scoring.
 * - Use this to derive a single snapshot for a symbol/timeframe without side effects.
 */

import { buildMarketContext } from "./examples";
import { findFairValueGaps, findOrderBlocks } from "./imbalances";
import { scoreConfluence } from "./confluence";
import { AuraFxEngineResult, Candle, TrendDirection } from "./types";
import { detectStructureEvents } from "./marketStructure";
import { findLiquidityPools } from "./liquidity";
import { getKillzone } from "./killzones";

interface BuildEngineParams {
  candles: Candle[];
  trendDirection?: TrendDirection;
  tzOffsetMinutes?: number;
}

export function buildAuraFxContext(params: BuildEngineParams): AuraFxEngineResult {
  const { candles, trendDirection, tzOffsetMinutes = 0 } = params;

  // Base context
  const base = buildMarketContext(candles, tzOffsetMinutes);

  // Imbalances
  const orderBlocks = findOrderBlocks(candles, trendDirection ?? base.trend.direction);
  const fairValueGaps = findFairValueGaps(candles);

  // Confluence
  const confluence = scoreConfluence({
    trendDirection: trendDirection ?? base.trend.direction,
    structureEvents: base.structureEvents,
    liquidityPools: base.liquidityPools,
    orderBlocks,
    fairValueGaps,
    killzone: base.session,
  });

  return {
    ...base,
    orderBlocks,
    fairValueGaps,
    confluence,
  };
}
