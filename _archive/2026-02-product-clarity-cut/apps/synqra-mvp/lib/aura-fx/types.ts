/**
 * AuraFX Types
 * - Framework-agnostic domain types for Smart Money Concepts (SMC) analytics.
 * - Used by market structure, liquidity, and killzone engines to produce a compact MarketContext
 *   that downstream confluence scorers will consume.
 */

export type Timeframe =
  | "M1"
  | "M5"
  | "M15"
  | "M30"
  | "H1"
  | "H4"
  | "D1";

export interface Candle {
  time: number; // unix ms
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
  timeframe?: Timeframe;
}

export type TrendDirection = "BULLISH" | "BEARISH" | "RANGE";

export type StructurePointType = "SWING_HIGH" | "SWING_LOW";

export interface StructurePoint {
  type: StructurePointType;
  index: number;
  price: number;
  time: number;
}

export type StructureEventType = "BOS" | "CHOCH";

export interface StructureEvent {
  type: StructureEventType;
  direction: TrendDirection;
  brokenLevel: number;
  atIndex: number;
  time: number;
  fromSwing: StructurePoint;
  toSwing: StructurePoint;
}

export type LiquidityPoolType = "BSL" | "SSL"; // buy-side / sell-side liquidity

export interface LiquidityPool {
  type: LiquidityPoolType;
  price: number;
  reason: "equal_highs" | "equal_lows" | "stop_cluster_high" | "stop_cluster_low";
  indices: number[];
}

export type OrderBlockType = "DEMAND" | "SUPPLY";

export interface PriceRange {
  low: number;
  high: number;
}

export interface OrderBlock {
  type: OrderBlockType;
  timeframe?: Timeframe;
  originIndex: number;
  priceRange: PriceRange;
  isMitigated: boolean;
}

export interface FairValueGap {
  direction: TrendDirection;
  priceRange: PriceRange;
  startIndex: number;
  endIndex: number;
  isFilled: boolean;
}

export type RegimeStateType = "EXPANSION" | "MEAN_REVERSION";

export interface RegimeState {
  state: RegimeStateType;
  confidence: number; // 0-1
  reason: string;
  metrics?: {
    slopePct?: number;
    avgRange?: number;
    lastRange?: number;
    volatilityRatio?: number;
  };
}

export type Bias = "LONG" | "SHORT" | "NO_TRADE";

export type SetupState = "FORMING" | "VALID" | "INVALID";

export interface SetupEvaluation {
  state: SetupState;
  confidence: number; // 0-1
  reason: string;
}

export interface ConfluenceBreakdown {
  trendScore: number;
  liquidityScore: number;
  structureScore: number;
  regimeScore: number;
  timeScore: number;
  overallScore: number; // 0-1
  primaryBias: Bias;
  notes: string[];
}

export interface AuraFxEngineResult extends MarketContext {
  orderBlocks: OrderBlock[];
  fairValueGaps: FairValueGap[];
  confluence: ConfluenceBreakdown;
  setup: SetupEvaluation;
}

export interface AuraFxSignalPayload {
  id: string;
  symbol: string;
  timeframe: Timeframe | string;
  direction: Bias;
  confidence: number; // 0-1
  entryZone: PriceRange | string;
  stopZone: PriceRange | string;
  targetZone: PriceRange | string;
  killzone: Killzone | "NONE";
  risk?: {
    rMultiple: number;
    riskAmount?: number;
    positionSize?: number;
    stopDistance: number;
    entryPrice: number;
    stopPrice: number;
    targetPrice: number;
  };
  rationaleShort: string;
  educationBlocks: {
    what: string;
    why: string;
    how: string;
  };
  generatedAt: string; // ISO
}

export interface PublicSignal {
  id: string;
  symbol: string;
  timeframe: Timeframe | string;
  direction: Bias;
  confidence: number;
  entryZone: PriceRange | string;
  stopZone: PriceRange | string;
  targetZone: PriceRange | string;
  killzone: Killzone | "NONE";
  risk?: AuraFxSignalPayload["risk"];
  rationaleShort: string;
  educationBlocks: AuraFxSignalPayload["educationBlocks"];
  generatedAt: string;
}

export type Killzone =
  | "LONDON_OPEN"
  | "NY_OPEN"
  | "ASIA_RANGE"
  | "NONE";

export interface SessionState {
  killzone: Killzone;
  isActive: boolean;
  window: { start: string; end: string }; // ISO strings
}

export interface MarketContext {
  trend: { direction: TrendDirection; reason: string };
  regime: RegimeState;
  structurePoints: StructurePoint[];
  structureEvents: StructureEvent[];
  liquidityPools: LiquidityPool[];
  session: SessionState;
}
