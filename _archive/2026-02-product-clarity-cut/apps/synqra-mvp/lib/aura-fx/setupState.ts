/**
 * Setup State Machine
 * - FORMING: conditions developing but not yet validated
 * - VALID: confluence is aligned and riskable
 * - INVALID: setup violated or not tradeable
 */

import type {
  ConfluenceBreakdown,
  FairValueGap,
  OrderBlock,
  SessionState,
  SetupEvaluation,
  TrendDirection,
  RegimeState,
} from "./types";

interface SetupInputs {
  confluence: ConfluenceBreakdown;
  trendDirection: TrendDirection;
  regime: RegimeState;
  session: SessionState;
  structureEvents: number;
  orderBlocks: OrderBlock[];
  fairValueGaps: FairValueGap[];
}

const thresholds = {
  valid: 0.68,
  forming: 0.52,
  invalid: 0.42,
};

export function evaluateSetupState(inputs: SetupInputs): SetupEvaluation {
  const { confluence, trendDirection, regime, session, structureEvents, orderBlocks, fairValueGaps } = inputs;

  const hasImbalance = fairValueGaps.length > 0 || orderBlocks.length > 0;
  const hasStructure = structureEvents > 0;

  if (confluence.overallScore <= thresholds.invalid) {
    return {
      state: "INVALID",
      confidence: 0.7,
      reason: "Confluence score below invalid threshold",
    };
  }

  if (confluence.primaryBias === "NO_TRADE") {
    return {
      state: "INVALID",
      confidence: 0.6,
      reason: "Bias resolved to NO_TRADE",
    };
  }

  if (!session.isActive && confluence.overallScore < 0.6) {
    return {
      state: "FORMING",
      confidence: 0.55,
      reason: "Outside active session; wait for timing alignment",
    };
  }

  if (regime.state === "MEAN_REVERSION" && trendDirection !== "RANGE" && confluence.overallScore < 0.72) {
    return {
      state: "FORMING",
      confidence: 0.5,
      reason: "Mean reversion regime; directional bias requires stronger confluence",
    };
  }

  if (
    confluence.overallScore >= thresholds.valid &&
    hasImbalance &&
    hasStructure
  ) {
    return {
      state: "VALID",
      confidence: clamp01(confluence.overallScore),
      reason: "Confluence, imbalance, and structure aligned",
    };
  }

  if (confluence.overallScore >= thresholds.forming) {
    return {
      state: "FORMING",
      confidence: clamp01(confluence.overallScore),
      reason: "Setup forming; awaiting stronger confluence or structure",
    };
  }

  return {
    state: "INVALID",
    confidence: 0.6,
    reason: "Insufficient alignment for a valid setup",
  };
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
