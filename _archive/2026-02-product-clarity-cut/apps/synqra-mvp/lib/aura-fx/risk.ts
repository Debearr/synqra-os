/**
 * AuraFX Risk Utilities
 * - R-multiple calculation
 * - Invalidation-based position sizing
 */

import type { Bias, PriceRange } from "./types";

export interface RiskSizingInput {
  direction: Bias;
  entryZone: PriceRange | string;
  stopZone: PriceRange | string;
  targetZone: PriceRange | string;
  accountBalance?: number;
  riskPercent?: number; // 0-1
}

export interface RiskSizingResult {
  rMultiple: number;
  stopDistance: number;
  entryPrice: number;
  stopPrice: number;
  targetPrice: number;
  riskAmount?: number;
  positionSize?: number;
}

export function computeRiskSizing(input: RiskSizingInput): RiskSizingResult | null {
  if (input.direction === "NO_TRADE") {
    return null;
  }
  const entryPrice = midpoint(input.entryZone);
  const stopPrice = midpoint(input.stopZone);
  const targetPrice = midpoint(input.targetZone);

  if (entryPrice === null || stopPrice === null || targetPrice === null) {
    return null;
  }

  const stopDistance = Math.abs(entryPrice - stopPrice);
  if (stopDistance <= 0) {
    return null;
  }

  const rMultiple = computeRMultiple(input.direction, entryPrice, stopPrice, targetPrice);
  if (!Number.isFinite(rMultiple)) {
    return null;
  }

  let riskAmount: number | undefined;
  let positionSize: number | undefined;

  if (
    typeof input.accountBalance === "number" &&
    typeof input.riskPercent === "number" &&
    input.accountBalance > 0 &&
    input.riskPercent > 0
  ) {
    riskAmount = input.accountBalance * input.riskPercent;
    positionSize = riskAmount / stopDistance;
  }

  return {
    rMultiple,
    stopDistance,
    entryPrice,
    stopPrice,
    targetPrice,
    riskAmount,
    positionSize,
  };
}

function midpoint(zone: PriceRange | string): number | null {
  if (typeof zone === "string") return null;
  return (zone.low + zone.high) / 2;
}

function computeRMultiple(
  direction: Bias,
  entry: number,
  stop: number,
  target: number
): number {
  if (direction === "LONG") {
    return (target - entry) / (entry - stop);
  }
  if (direction === "SHORT") {
    return (entry - target) / (stop - entry);
  }
  return 0;
}
