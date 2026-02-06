/**
 * AuraFX Signal Formatter
 * - Converts engine outputs into clean, human-readable signals with education blocks.
 * - Ready for UI, logs, or downstream webhook/Telegram use.
 */

// @ts-expect-error - uuid v10 resolves to browser build, suppressing type error
import { v4 as uuid } from "uuid";
import {
  AuraFxEngineResult,
  AuraFxSignalPayload,
  Bias,
  PriceRange,
  PublicSignal,
  Timeframe,
} from "./types";
import { computeRiskSizing } from "./risk";

interface BuildSignalOptions {
  symbol: string;
  timeframe: Timeframe | string;
  riskProfile?: "conservative" | "balanced" | "aggressive";
  accountBalance?: number;
  riskPercent?: number; // 0-1
}

export function buildSignalPayload(
  engine: AuraFxEngineResult,
  options: BuildSignalOptions
): AuraFxSignalPayload {
  const bias = engine.confluence.primaryBias;
  const confidence = clamp01(engine.confluence.overallScore);

  const entryZone = deriveEntry(engine);
  const stopZone = deriveStop(engine, entryZone);
  const targetZone = deriveTarget(engine, entryZone);

  const rationaleShort = buildRationaleShort(bias, confidence, engine);
  const educationBlocks = buildEducationBlocks(engine, bias);
  const risk = computeRiskSizing({
    direction: bias,
    entryZone,
    stopZone,
    targetZone,
    accountBalance: options.accountBalance,
    riskPercent: options.riskPercent,
  }) ?? undefined;

  return {
    id: uuid(),
    symbol: options.symbol,
    timeframe: options.timeframe,
    direction: bias,
    confidence,
    entryZone,
    stopZone,
    targetZone,
    killzone: engine.session.killzone,
    risk: risk ?? undefined,
    rationaleShort,
    educationBlocks,
    generatedAt: new Date().toISOString(),
  };
}

export function toJson(signal: AuraFxSignalPayload): string {
  return JSON.stringify(signal);
}

export function toTelegramText(signal: AuraFxSignalPayload): string {
  return [
    `AURA-FX ${signal.symbol} ${signal.timeframe}`,
    `Bias: ${signal.direction} | Confidence: ${(signal.confidence * 100).toFixed(0)}%`,
    `Entry: ${formatZone(signal.entryZone)} | Stop: ${formatZone(signal.stopZone)} | Target: ${formatZone(signal.targetZone)}`,
    `Killzone: ${signal.killzone}`,
    `Why: ${signal.rationaleShort}`,
    `WHAT: ${signal.educationBlocks.what}`,
    `WHY: ${signal.educationBlocks.why}`,
    `HOW: ${signal.educationBlocks.how}`,
  ].join("\n");
}

export function toPublicSignal(signal: AuraFxSignalPayload): PublicSignal {
  const {
    id,
    symbol,
    timeframe,
    direction,
    confidence,
    entryZone,
    stopZone,
    targetZone,
    killzone,
    risk,
    rationaleShort,
    educationBlocks,
    generatedAt,
  } = signal;

  return {
    id,
    symbol,
    timeframe,
    direction,
    confidence,
    entryZone,
    stopZone,
    targetZone,
    killzone,
    risk,
    rationaleShort,
    educationBlocks,
    generatedAt,
  };
}

function deriveEntry(engine: AuraFxEngineResult): PriceRange | string {
  const lastOB = engine.orderBlocks.slice(-1)[0];
  if (lastOB) return lastOB.priceRange;

  const lastCandle = engine.structurePoints.slice(-1)[0];
  return lastCandle ? `Around ${lastCandle.price.toFixed(5)}` : "Await setup";
}

function deriveStop(
  engine: AuraFxEngineResult,
  entry: PriceRange | string
): PriceRange | string {
  const lastLow = engine.structurePoints
    .filter((p) => p.type === "SWING_LOW")
    .slice(-1)[0];

  const lastHigh = engine.structurePoints
    .filter((p) => p.type === "SWING_HIGH")
    .slice(-1)[0];

  if (engine.confluence.primaryBias === "LONG" && lastLow) {
    return { low: lastLow.price * 0.999, high: lastLow.price * 1.001 };
  }

  if (engine.confluence.primaryBias === "SHORT" && lastHigh) {
    return { low: lastHigh.price * 0.999, high: lastHigh.price * 1.001 };
  }

  return typeof entry === "string"
    ? "Define stop below/above recent swing"
    : entry;
}

function deriveTarget(
  engine: AuraFxEngineResult,
  entry: PriceRange | string
): PriceRange | string {
  const pool =
    engine.confluence.primaryBias === "LONG"
      ? engine.liquidityPools.find((p) => p.type === "BSL")
      : engine.liquidityPools.find((p) => p.type === "SSL");

  if (pool) {
    return { low: pool.price * 0.999, high: pool.price * 1.001 };
  }

  const lastEvent = engine.structureEvents.slice(-1)[0];
  return lastEvent
    ? `Next swing at ${lastEvent.brokenLevel.toFixed(5)}`
    : entry;
}

function buildRationaleShort(
  bias: Bias,
  confidence: number,
  engine: AuraFxEngineResult
): string {
  const killzone = engine.session.killzone;
  const direction =
    bias === "NO_TRADE"
      ? "No-trade"
      : bias === "LONG"
      ? "Bullish"
      : "Bearish";

  return `${direction} setup with ${(confidence * 100).toFixed(
    0
  )}% confidence during ${killzone}`;
}

function buildEducationBlocks(engine: AuraFxEngineResult, bias: Bias) {
  const trend = engine.trend.direction;
  const hasSweep =
    engine.liquidityPools.some((p) => p.type === "BSL") ||
    engine.liquidityPools.some((p) => p.type === "SSL");
  const hasFvg = engine.fairValueGaps.length > 0;

  return {
    what: `${trend} market structure with recent ${
      hasSweep ? "liquidity sweep" : "swing break"
    } and ${hasFvg ? "imbalance present" : "balanced pricing"}.`,
    why: `Institutional flows favor ${
      trend === "BULLISH"
        ? "discount bids"
        : trend === "BEARISH"
        ? "premium offers"
        : "patience"
    } aligned with session ${engine.session.killzone}.`,
    how:
      bias === "NO_TRADE"
        ? "Stand aside until HTF/LTF align; wait for fresh BOS/CHOCH and clean imbalance."
        : `Use the entry zone as a ${
            bias === "LONG" ? "discount" : "premium"
          } area; invalidate if price closes beyond stop band.`,
  };
}

function formatZone(zone: PriceRange | string): string {
  if (typeof zone === "string") return zone;
  return `${zone.low.toFixed(5)} - ${zone.high.toFixed(5)}`;
}
const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));
