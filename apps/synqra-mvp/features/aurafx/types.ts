/**
 * AuraFX Signal System - Type Definitions
 * Phase 1: Signal System Validation
 */

export interface AuraSignal {
  id: string;
  symbol: string;
  timestamp: number;

  // Core Intelligence Data
  type: 'MOMENTUM' | 'VOLATILITY' | 'MEAN_REVERSION' | 'FLOW';
  direction: 'UP' | 'DOWN' | 'NEUTRAL';
  confidence: number; // 0.0 to 0.99. NEVER 1.0.

  // Context & Explanation
  context: string; // "Why" this signal exists. No "Buy"/"Sell" language.
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';

  // Time & Lifecycle
  validityPeriod: {
    start: number;
    end: number;
  };

  // Internal/Private Data (NOT for UI display, used for validation/debugging)
  // These fields are intentionally excluded from public consumption
  // to prevent "trading advice" interpretation.
  _meta?: {
    source: string;
    rawScore: number;
    decayRate?: number; // per minute
  };
}

export enum SignalState {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  DECAYING = 'DECAYING',
  EXPIRED = 'EXPIRED',
  INVALID = 'INVALID',
  NO_DATA = 'NO_DATA',
  PARTIAL_DATA = 'PARTIAL_DATA'
}

export interface SignalValidationResult {
  isValid: boolean;
  reasons: string[];
}
