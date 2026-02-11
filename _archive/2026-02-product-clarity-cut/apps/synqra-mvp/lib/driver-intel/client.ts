import { z } from "zod";
import {
  CompletedOffer,
  DailyEarningsResult,
  DriverHealthIndexResult,
} from "./types";

const payoutSchema = z.object({
  base: z.number(),
  bonus: z.number(),
  tips: z.number(),
  reimbursements: z.number(),
  adjustments: z.number().optional(),
});

const offerSchema = z.object({
  id: z.string(),
  serviceType: z.enum(["delivery", "rideshare", "freight", "other"]).optional(),
  payout: payoutSchema,
  distanceMiles: z.number(),
  durationMinutes: z.number(),
  weightLbs: z.number().optional(),
  multiStop: z.boolean().optional(),
  stops: z
    .array(
      z.object({
        id: z.string(),
        sequence: z.number(),
        distanceFromPrevMiles: z.number().optional(),
        eta: z.string().optional(),
        weightLbs: z.number().optional(),
        notes: z.string().optional(),
      })
    )
    .optional(),
  acceptedAt: z.string(),
  completedAt: z.string(),
  rating: z.number().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

const dailyEarningsSchema: z.ZodType<DailyEarningsResult> = z.object({
  date: z.string(),
  grossTotal: z.number(),
  netTotal: z.number(),
  expensesTotal: z.number(),
  totalAdjustments: z.number(),
  totalMiles: z.number(),
  activeMinutes: z.number(),
  earningsPerHour: z.number(),
  earningsPerMile: z.number(),
  varianceFromTargetPerHour: z.number().optional(),
  byServiceType: z.record(z.string(), z.number()),
  offers: z.array(
    z.object({
      offerId: z.string(),
      gross: z.number(),
      net: z.number(),
      mileage: z.number(),
      durationMinutes: z.number(),
      payoutBreakdown: payoutSchema,
      expenseImpact: z.array(
        z.object({
          expense: z.object({
            category: z.enum(["fuel", "maintenance", "parking", "tolls", "rentals", "insurance", "other"]),
            amount: z.number(),
            label: z.string().optional(),
            timestamp: z.string().optional(),
          }),
          appliedTo: z.string().optional(),
        })
      ),
      serviceType: z.enum(["delivery", "rideshare", "freight", "other"]).optional(),
    })
  ),
});

const driverHealthSchema: z.ZodType<DriverHealthIndexResult> = z.object({
  score: z.number(),
  fatigueRisk: z.enum(["low", "moderate", "high"]),
  hydrationStatus: z.enum(["ok", "low", "unknown"]),
  sleepDebtHours: z.number().optional(),
  cooldownMinutes: z.number().optional(),
  recommendations: z.array(z.string()),
  factors: z.record(z.string(), z.number()),
});

const offerScoreSchema = z.object({
  total: z.number(),
  normalized: z.number(),
  breakdown: z.object({
    total: z.number(),
    components: z.object({
      distance: z.number(),
      payout: z.number(),
      duration: z.number(),
      multiStop: z.number(),
      weight: z.number(),
      rating: z.number(),
      custom: z.record(z.string(), z.number()).optional(),
    }),
    reasons: z.array(z.string()),
  }),
  metadata: z.record(z.string(), z.any()).optional(),
});

type OfferScoreResult = z.infer<typeof offerScoreSchema>;

async function postJson<T>(
  action: string,
  payload: Record<string, unknown>,
  schema: z.ZodSchema<T>
): Promise<T> {
  const res = await fetch("/api/driver-intel", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...payload }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Driver Intel API error (${res.status}): ${text}`);
  }

  const json = await res.json();
  const result = json.data ?? json.result;
  const parsed = schema.safeParse(result);
  if (!parsed.success) {
    throw new Error(
      `Driver Intel parse error: ${parsed.error.message}; raw=${JSON.stringify(result)}`
    );
  }
  return parsed.data;
}

export async function scoreOffer(offerInput: CompletedOffer): Promise<OfferScoreResult> {
  // Validate input locally for better errors
  const parsedOffer = offerSchema.parse(offerInput);
  return postJson<OfferScoreResult>("scoreOffer", { offer: parsedOffer }, offerScoreSchema);
}

export async function dailyEarnings(inputs: {
  day: {
    id: string;
    date: string;
    window: { start: string; end: string; timezone?: string };
    offers: CompletedOffer[];
    breaks?: { start: string; end?: string; type?: string }[];
    expenses?: { category: string; amount: number; label?: string; timestamp?: string }[];
    vehicle?: { id: string; type: string; mpg?: number; costPerMile?: number; electric?: boolean };
  };
  vehicleCostPerMile?: number;
  targetEarningsPerHour?: number;
  extraExpenses?: { category: string; amount: number; label?: string; timestamp?: string }[];
}): Promise<DailyEarningsResult> {
  return postJson<DailyEarningsResult>("dailyEarnings", inputs, dailyEarningsSchema);
}

export async function projectShift(inputs: {
  shiftWindowMinutes: number;
  elapsedMinutes: number;
  completedOffers: CompletedOffer[];
  vehicleCostPerMile?: number;
  targetEarningsPerHour?: number;
}): Promise<{
  projectedGross: number;
  projectedNet: number;
  projectedEarningsPerHour: number;
  remainingMinutes: number;
  recommendedPacePerHour?: number;
}> {
  const schema = z.object({
    projectedGross: z.number(),
    projectedNet: z.number(),
    projectedEarningsPerHour: z.number(),
    remainingMinutes: z.number(),
    recommendedPacePerHour: z.number().optional(),
  });
  return postJson("projectShift", inputs, schema);
}

export async function driverHealth(inputs: {
  snapshot: {
    hrBpm?: number;
    hydrationOz?: number;
    steps?: number;
    sleepHours?: number;
    stressLevel?: number;
    fatigueLevel?: number;
    mood?: "great" | "ok" | "tired" | "burned-out";
    timestamp?: string;
  };
  hoursDriven?: number;
  lastBreakMinutesAgo?: number;
}): Promise<DriverHealthIndexResult> {
  return postJson<DriverHealthIndexResult>("health", inputs, driverHealthSchema);
}
