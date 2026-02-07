/**
 * Liquidity & Pools
 * - Finds basic buy-side/sell-side liquidity pools from equal highs/lows and stop clusters.
 * - Designed for SMC-style liquidity mapping ahead of mitigation and sweep logic.
 */

import { Candle, LiquidityPool, StructurePoint } from "./types";

const EQUAL_THRESHOLD_PCT = 0.0005; // 0.05% tolerance for equal highs/lows

export function findLiquidityPools(
  candles: Candle[],
  swings: StructurePoint[]
): LiquidityPool[] {
  const pools: LiquidityPool[] = [];

  // Equal highs / equal lows (within tolerance)
  for (let i = 0; i < swings.length - 1; i++) {
    const a = swings[i];
    const b = swings[i + 1];
    const tol = Math.abs((a.price * EQUAL_THRESHOLD_PCT));
    const equal = Math.abs(a.price - b.price) <= tol;
    if (!equal) continue;

    if (a.type === "SWING_HIGH" && b.type === "SWING_HIGH") {
      pools.push({
        type: "BSL",
        price: (a.price + b.price) / 2,
        reason: "equal_highs",
        indices: [a.index, b.index],
      });
    }
    if (a.type === "SWING_LOW" && b.type === "SWING_LOW") {
      pools.push({
        type: "SSL",
        price: (a.price + b.price) / 2,
        reason: "equal_lows",
        indices: [a.index, b.index],
      });
    }
  }

  // Stop clusters: simple heuristic above last swing high / below last swing low
  const lastHigh = [...swings].reverse().find((s) => s.type === "SWING_HIGH");
  const lastLow = [...swings].reverse().find((s) => s.type === "SWING_LOW");

  if (lastHigh) {
    const buffer = lastHigh.price * 0.0008; // 0.08%
    const stopBandHigh = lastHigh.price + buffer;
    pools.push({
      type: "BSL",
      price: stopBandHigh,
      reason: "stop_cluster_high",
      indices: [lastHigh.index],
    });
  }

  if (lastLow) {
    const buffer = lastLow.price * 0.0008;
    const stopBandLow = lastLow.price - buffer;
    pools.push({
      type: "SSL",
      price: stopBandLow,
      reason: "stop_cluster_low",
      indices: [lastLow.index],
    });
  }

  return dedupePools(pools);
}

function dedupePools(pools: LiquidityPool[]): LiquidityPool[] {
  const seen = new Map<string, LiquidityPool>();
  for (const pool of pools) {
    const key = `${pool.type}-${pool.reason}-${pool.price.toFixed(5)}`;
    if (!seen.has(key)) seen.set(key, pool);
  }
  return Array.from(seen.values());
}
