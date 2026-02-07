import { z } from "zod";

export const payoutBreakdownSchema = z.object({
  base: z.number().nonnegative().default(0),
  bonus: z.number().nonnegative().default(0),
  tips: z.number().nonnegative().default(0),
  reimbursements: z.number().nonnegative().default(0),
  adjustments: z.number().default(0),
});

export const offerSchema = z.object({
  id: z.string(),
  serviceType: z.enum(["delivery", "rideshare", "freight", "other"]).optional(),
  payout: payoutBreakdownSchema,
  distanceMiles: z.number().nonnegative(),
  durationMinutes: z.number().nonnegative(),
  weightLbs: z.number().nonnegative().optional(),
  multiStop: z.boolean().optional(),
  stops: z
    .array(
      z.object({
        id: z.string(),
        sequence: z.number(),
        distanceFromPrevMiles: z.number().optional(),
        eta: z.string().datetime().optional(),
        weightLbs: z.number().optional(),
        notes: z.string().optional(),
      })
    )
    .optional(),
  acceptedAt: z.string().datetime(),
  completedAt: z.string().datetime(),
  rating: z.number().min(0).max(5).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export const expenseSchema = z.object({
  category: z
    .enum([
      "fuel",
      "maintenance",
      "parking",
      "tolls",
      "rentals",
      "insurance",
      "other",
    ])
    .default("other"),
  amount: z.number().nonnegative(),
  label: z.string().optional(),
  timestamp: z.string().datetime().optional(),
});

export const breakSchema = z.object({
  start: z.string().datetime(),
  end: z.string().datetime().optional(),
  type: z.enum(["meal", "rest", "refuel", "personal"]).optional(),
  flaggedBySystem: z.boolean().optional(),
});

export const shiftDaySchema = z.object({
  id: z.string(),
  date: z.string(), // YYYY-MM-DD
  window: z.object({
    start: z.string().datetime(),
    end: z.string().datetime(),
    timezone: z.string().optional(),
  }),
  offers: z.array(offerSchema),
  breaks: z.array(breakSchema).optional(),
  expenses: z.array(expenseSchema).optional(),
  vehicle: z
    .object({
      id: z.string(),
      type: z.enum(["car", "van", "bike", "scooter", "cargo"]),
      mpg: z.number().optional(),
      costPerMile: z.number().optional(),
      electric: z.boolean().optional(),
    })
    .optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export const driverHealthSnapshotSchema = z.object({
  hrBpm: z.number().optional(),
  hydrationOz: z.number().optional(),
  steps: z.number().optional(),
  sleepHours: z.number().optional(),
  stressLevel: z.number().min(0).max(10).optional(),
  fatigueLevel: z.number().min(0).max(10).optional(),
  mood: z.enum(["great", "ok", "tired", "burned-out"]).optional(),
  timestamp: z.string().datetime().optional(),
});

export type OfferInput = z.infer<typeof offerSchema>;
export type ShiftDayInput = z.infer<typeof shiftDaySchema>;
export type DriverHealthInput = z.infer<typeof driverHealthSnapshotSchema>;
