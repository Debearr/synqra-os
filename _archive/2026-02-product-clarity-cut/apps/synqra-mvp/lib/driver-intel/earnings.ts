import {
  CompletedOffer,
  DailyEarningsOptions,
  DailyEarningsResult,
  PayoutBreakdown,
  ShiftDay,
} from "./types";
import { aggregateDailyEarnings } from "./earningsEngine";

export interface ShiftEarningsProjection {
  projectedGross: number;
  projectedNet: number;
  projectedEarningsPerHour: number;
  remainingMinutes: number;
  recommendedPacePerHour?: number;
}

export function parseOfferPayout(input: Partial<PayoutBreakdown>): PayoutBreakdown {
  return {
    base: input.base ?? 0,
    bonus: input.bonus ?? 0,
    tips: input.tips ?? 0,
    reimbursements: input.reimbursements ?? 0,
    adjustments: input.adjustments ?? 0,
  };
}

export function calculateDailyEarnings(
  day: ShiftDay,
  options?: DailyEarningsOptions
): DailyEarningsResult {
  return aggregateDailyEarnings(day.offers, day.date, {
    vehicleCostPerMile: day.vehicle?.costPerMile ?? options?.vehicleCostPerMile,
    targetEarningsPerHour: options?.targetEarningsPerHour,
    extraExpenses: day.expenses ?? options?.extraExpenses,
  });
}

export function projectShiftEarnings(params: {
  shiftWindowMinutes: number;
  elapsedMinutes: number;
  completedOffers: CompletedOffer[];
  options?: DailyEarningsOptions;
}): ShiftEarningsProjection {
  const { shiftWindowMinutes, elapsedMinutes, completedOffers, options } = params;
  const earningsResult = aggregateDailyEarnings(
    completedOffers,
    new Date().toISOString().slice(0, 10),
    options
  );

  const currentEarningsPerHour =
    elapsedMinutes > 0 ? earningsResult.netTotal / (elapsedMinutes / 60) : 0;
  const remainingMinutes = Math.max(shiftWindowMinutes - elapsedMinutes, 0);
  const projectedNet =
    earningsResult.netTotal +
    currentEarningsPerHour * (remainingMinutes / 60);
  const projectedGross =
    earningsResult.grossTotal +
    (earningsResult.grossTotal / Math.max(elapsedMinutes, 1)) *
      (remainingMinutes / 60) *
      60; // simple linear projection

  return {
    projectedGross: Math.round(projectedGross * 100) / 100,
    projectedNet: Math.round(projectedNet * 100) / 100,
    projectedEarningsPerHour: Math.round(currentEarningsPerHour * 100) / 100,
    remainingMinutes,
    recommendedPacePerHour: options?.targetEarningsPerHour,
  };
}
