/**
 * NØID Core Types
 * 
 * TODO: Define complete type system for NØID core functionality
 */

export interface TradeSignal {
  symbol?: string;
  direction: "LONG" | "SHORT";
  entry?: number;
  stop?: number;
  stopLoss?: number;
  target?: number;
  entryZone?: { low: number; high: number };
  targetZones?: number[];
  indicationIndex?: number;
  continuationIndex?: number;
  [key: string]: unknown;
}
