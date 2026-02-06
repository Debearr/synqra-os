import assert from "node:assert/strict";
import { scoreConfluence, applySetupStateToConfluence } from "@/lib/aura-fx/confluence";
import { evaluateSetupState } from "@/lib/aura-fx/setupState";
import { computeRiskSizing } from "@/lib/aura-fx/risk";
import type { FairValueGap, LiquidityPool, OrderBlock, StructureEvent, TrendDirection } from "@/lib/aura-fx/types";

function makeBaseInputs(params: {
  trendDirection: TrendDirection;
  structureEvents?: StructureEvent[];
  liquidityPools?: LiquidityPool[];
  orderBlocks?: OrderBlock[];
  fairValueGaps?: FairValueGap[];
  killzoneActive?: boolean;
  regime?: "EXPANSION" | "MEAN_REVERSION";
}) {
  return {
    trendDirection: params.trendDirection,
    structureEvents: params.structureEvents ?? [],
    liquidityPools: params.liquidityPools ?? [],
    orderBlocks: params.orderBlocks ?? [],
    fairValueGaps: params.fairValueGaps ?? [],
    killzone: { killzone: "LONDON_OPEN" as const, isActive: params.killzoneActive ?? true },
    regime: params.regime
      ? { state: params.regime, confidence: 0.7, reason: "test" }
      : undefined,
  };
}

function runScenario(label: string, inputs: ReturnType<typeof makeBaseInputs>) {
  const confluence = scoreConfluence(inputs);
  const setup = evaluateSetupState({
    confluence,
    trendDirection: inputs.trendDirection,
    regime: inputs.regime ?? { state: "MEAN_REVERSION", confidence: 0.5, reason: "default" },
    session: { killzone: inputs.killzone.killzone, isActive: inputs.killzone.isActive, window: { start: "", end: "" } },
    structureEvents: inputs.structureEvents.length,
    orderBlocks: inputs.orderBlocks,
    fairValueGaps: inputs.fairValueGaps,
  });
  const enforced = applySetupStateToConfluence(confluence, setup);
  return { label, confluence, setup, enforced };
}

// VALID scenario
{
  const inputs = makeBaseInputs({
    trendDirection: "BULLISH",
    structureEvents: [
      {
        type: "BOS",
        direction: "BULLISH",
        brokenLevel: 100,
        atIndex: 10,
        time: 1,
        fromSwing: { type: "SWING_LOW", index: 8, price: 98, time: 1 },
        toSwing: { type: "SWING_HIGH", index: 10, price: 102, time: 1 },
      },
    ],
    liquidityPools: [{ type: "SSL", price: 97, reason: "equal_lows", indices: [1, 2] }],
    orderBlocks: [{ type: "DEMAND", originIndex: 5, priceRange: { low: 99, high: 101 }, isMitigated: false }],
    fairValueGaps: [{ direction: "BULLISH", priceRange: { low: 100, high: 101 }, startIndex: 3, endIndex: 4, isFilled: false }],
    killzoneActive: true,
    regime: "EXPANSION",
  });

  const { setup, enforced } = runScenario("valid", inputs);
  assert.equal(setup.state, "VALID");
  assert.notEqual(enforced.primaryBias, "NO_TRADE");
}

// FORMING scenario
{
  const inputs = makeBaseInputs({
    trendDirection: "BULLISH",
    structureEvents: [
      {
        type: "CHOCH",
        direction: "BULLISH",
        brokenLevel: 100,
        atIndex: 10,
        time: 1,
        fromSwing: { type: "SWING_LOW", index: 8, price: 98, time: 1 },
        toSwing: { type: "SWING_HIGH", index: 10, price: 101, time: 1 },
      },
    ],
    orderBlocks: [{ type: "DEMAND", originIndex: 5, priceRange: { low: 99, high: 100 }, isMitigated: false }],
    fairValueGaps: [],
    liquidityPools: [],
    killzoneActive: false,
    regime: "MEAN_REVERSION",
  });

  const { setup, enforced } = runScenario("forming", inputs);
  assert.equal(setup.state, "FORMING");
  assert.equal(enforced.primaryBias, "NO_TRADE");
}

// INVALID scenario
{
  const inputs = makeBaseInputs({
    trendDirection: "BULLISH",
    structureEvents: [
      {
        type: "BOS",
        direction: "BEARISH",
        brokenLevel: 100,
        atIndex: 10,
        time: 1,
        fromSwing: { type: "SWING_HIGH", index: 8, price: 102, time: 1 },
        toSwing: { type: "SWING_LOW", index: 10, price: 99, time: 1 },
      },
    ],
    liquidityPools: [
      { type: "SSL", price: 97, reason: "equal_lows", indices: [1, 2] },
      { type: "BSL", price: 103, reason: "equal_highs", indices: [3, 4] },
    ],
    orderBlocks: [],
    fairValueGaps: [],
    killzoneActive: false,
    regime: "MEAN_REVERSION",
  });

  const { setup, enforced } = runScenario("invalid", inputs);
  assert.equal(setup.state, "INVALID");
  assert.equal(enforced.primaryBias, "NO_TRADE");
}

// Risk sizing integration
{
  const risk = computeRiskSizing({
    direction: "LONG",
    entryZone: { low: 100, high: 100 },
    stopZone: { low: 98, high: 98 },
    targetZone: { low: 106, high: 106 },
    accountBalance: 10000,
    riskPercent: 0.01,
  });

  assert.ok(risk);
  assert.equal(risk?.rMultiple.toFixed(2), "3.00");
  assert.equal(risk?.positionSize?.toFixed(2), "50.00");
}

console.log("AuraFX setup lifecycle tests passed.");
