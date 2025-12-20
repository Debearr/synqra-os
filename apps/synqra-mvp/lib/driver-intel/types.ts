export type Currency = number;

export interface PayoutBreakdown {
  base: Currency;
  bonus: Currency;
  tips: Currency;
  reimbursements: Currency;
  adjustments?: Currency;
}

export interface Expense {
  category:
    | "fuel"
    | "maintenance"
    | "parking"
    | "tolls"
    | "rentals"
    | "insurance"
    | "other";
  amount: Currency;
  label?: string;
  timestamp?: string; // ISO string
}

export interface OfferStop {
  id: string;
  sequence: number;
  distanceFromPrevMiles?: number;
  eta?: string; // ISO string
  weightLbs?: number;
  notes?: string;
}

export interface CompletedOffer {
  id: string;
  serviceType?: "delivery" | "rideshare" | "freight" | "other";
  payout: PayoutBreakdown;
  distanceMiles: number;
  durationMinutes: number;
  weightLbs?: number;
  multiStop?: boolean;
  stops?: OfferStop[];
  acceptedAt: string; // ISO string
  completedAt: string; // ISO string
  rating?: number; // 0-5 optional customer rating
  metadata?: Record<string, unknown>;
}

export interface ShiftWindow {
  start: string; // ISO string
  end: string; // ISO string
  timezone?: string;
}

export interface BreakPeriod {
  start: string; // ISO string
  end?: string; // ISO string
  type?: "meal" | "rest" | "refuel" | "personal";
  flaggedBySystem?: boolean;
}

export interface VehicleProfile {
  id: string;
  type: "car" | "van" | "bike" | "scooter" | "cargo";
  mpg?: number;
  costPerMile?: number;
  electric?: boolean;
}

export interface ShiftDay {
  id: string;
  date: string; // YYYY-MM-DD
  window: ShiftWindow;
  offers: CompletedOffer[];
  breaks?: BreakPeriod[];
  expenses?: Expense[];
  vehicle?: VehicleProfile;
  metadata?: Record<string, unknown>;
}

export interface ExpenseImpact {
  expense: Expense;
  appliedTo?: string; // offer id if applicable
}

export interface OfferEarnings {
  offerId: string;
  gross: Currency;
  net: Currency;
  mileage: number;
  durationMinutes: number;
  payoutBreakdown: PayoutBreakdown;
  expenseImpact: ExpenseImpact[];
  serviceType?: CompletedOffer["serviceType"];
}

export interface DailyEarningsResult {
  date: string;
  grossTotal: Currency;
  netTotal: Currency;
  expensesTotal: Currency;
  totalAdjustments: Currency;
  totalMiles: number;
  activeMinutes: number;
  earningsPerHour: number;
  earningsPerMile: number;
  varianceFromTargetPerHour?: number;
  byServiceType: Record<string, Currency>;
  offers: OfferEarnings[];
}

export interface DailyEarningsOptions {
  vehicleCostPerMile?: number;
  targetEarningsPerHour?: number;
  extraExpenses?: Expense[];
}

export interface OfferScoreWeights {
  distance: number;
  payout: number;
  duration: number;
  multiStop: number;
  weight: number;
  rating: number;
  custom?: Record<string, number>;
}

export interface OfferScoreBreakdown {
  total: number;
  components: {
    distance: number;
    payout: number;
    duration: number;
    multiStop: number;
    weight: number;
    rating: number;
    custom?: Record<string, number>;
  };
  reasons: string[];
}

export interface DriverHealthSnapshot {
  hrBpm?: number;
  hydrationOz?: number;
  steps?: number;
  sleepHours?: number;
  stressLevel?: number; // 0-10
  fatigueLevel?: number; // 0-10
  mood?: "great" | "ok" | "tired" | "burned-out";
  timestamp?: string; // ISO string
}

export interface DriverHealthIndexResult {
  score: number; // 0-100
  fatigueRisk: "low" | "moderate" | "high";
  hydrationStatus: "ok" | "low" | "unknown";
  sleepDebtHours?: number;
  cooldownMinutes?: number;
  recommendations: string[];
  factors: Record<string, number>;
}

export interface DistanceFilterResult {
  score: number;
  passes: boolean;
  rationale: string;
}

export interface PayoutFilterResult {
  score: number;
  passes: boolean;
  ratePerMile: number;
  ratePerMinute: number;
  rationale: string;
}

export interface WeightFilterResult {
  score: number;
  passes: boolean;
  rationale: string;
}

export interface MultiStopEfficiencyResult {
  score: number;
  passes: boolean;
  rationale: string;
}

export interface OfferScoreInput {
  distanceScore: number;
  payoutScore: number;
  durationScore: number;
  weightScore: number;
  multiStopScore: number;
  driverRatingScore?: number;
  customScores?: Record<string, number>;
}

export interface OfferScoreResult {
  total: number;
  normalized: number;
  breakdown: OfferScoreBreakdown;
  metadata?: Record<string, unknown>;
}

export interface ShiftState {
  shiftId: string;
  start: string; // ISO string
  end?: string; // ISO string
  breaks: BreakPeriod[];
}

export interface ShiftDurationResult {
  activeMinutes: number;
  breakMinutes: number;
  totalMinutes: number;
  isActive: boolean;
  currentlyOnBreak: boolean;
}
