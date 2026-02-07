/**
 * Core Types
 * 
 * TODO: Define complete core type system
 * - Constraint definitions
 * - Trade-off structures
 * - Option sets
 * - Decision step tracking
 */

export interface Constraint {
  id: string;
  type: string;
  description: string;
  [key: string]: unknown;
}

export interface TradeOff {
  id: string;
  optionA: string;
  optionB: string;
  tradeoff: string;
  [key: string]: unknown;
}

export interface Option {
  id: string;
  label: string;
  value: unknown;
  [key: string]: unknown;
}

export interface DecisionStep {
  id: string;
  step: number;
  description: string;
  [key: string]: unknown;
}
