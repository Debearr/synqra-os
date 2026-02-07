import {
  CompletedOffer,
  DistanceFilterResult,
  MultiStopEfficiencyResult,
  PayoutFilterResult,
  WeightFilterResult,
} from "./types";

const round2 = (value: number) => Math.round(value * 100) / 100;

const totalPayout = (offer: CompletedOffer) =>
  offer.payout.base +
  offer.payout.bonus +
  offer.payout.tips +
  offer.payout.reimbursements +
  (offer.payout.adjustments ?? 0);

export function evaluateDistanceFilter(
  offer: CompletedOffer,
  config: { maxDistanceMiles: number; preferredRangeMiles?: [number, number] }
): DistanceFilterResult {
  const distance = offer.distanceMiles;
  const preferred = config.preferredRangeMiles ?? [0, config.maxDistanceMiles];
  const withinMax = distance <= config.maxDistanceMiles;
  const inPreferred = distance >= preferred[0] && distance <= preferred[1];

  const baseScore = withinMax ? 70 : 0;
  const bonus = inPreferred ? 30 : distance < preferred[0] ? 15 : 0;
  const score = Math.min(100, baseScore + bonus);

  return {
    score,
    passes: withinMax,
    rationale: withinMax
      ? `Distance ${distance}mi within max ${config.maxDistanceMiles}mi${
          inPreferred ? " and in preferred range" : ""
        }`
      : `Distance ${distance}mi exceeds max ${config.maxDistanceMiles}mi`,
  };
}

export function evaluatePayoutFilter(
  offer: CompletedOffer,
  config: { minRatePerMile: number; minRatePerMinute?: number }
): PayoutFilterResult {
  const payout = totalPayout(offer);
  const ratePerMile =
    offer.distanceMiles > 0 ? payout / offer.distanceMiles : payout;
  const ratePerMinute =
    offer.durationMinutes > 0 ? payout / offer.durationMinutes : payout;

  const milePass = ratePerMile >= config.minRatePerMile;
  const minutePass =
    config.minRatePerMinute === undefined
      ? true
      : ratePerMinute >= config.minRatePerMinute;

  const passes = milePass && minutePass;
  const score = Math.min(
    100,
    (milePass ? 60 : 20) +
      (minutePass ? 40 : config.minRatePerMinute ? 0 : 20) +
      Math.max(0, Math.min(20, (ratePerMile - config.minRatePerMile) * 10))
  );

  return {
    score,
    passes,
    ratePerMile: round2(ratePerMile),
    ratePerMinute: round2(ratePerMinute),
    rationale: passes
      ? `Rates meet thresholds (${round2(ratePerMile)} $/mi, ${round2(
          ratePerMinute
        )} $/min)`
      : `Rates below thresholds (${round2(ratePerMile)} $/mi vs ${
          config.minRatePerMile
        } $/mi min${config.minRatePerMinute ? `, ${round2(ratePerMinute)} $/min vs ${config.minRatePerMinute} $/min min` : ""})`,
  };
}

export function evaluateWeightFilter(
  offer: CompletedOffer,
  config: { maxWeightLbs: number }
): WeightFilterResult {
  const weight = offer.weightLbs;
  if (weight === undefined) {
    return {
      score: 60,
      passes: true,
      rationale: "Weight not provided; default pass with neutral score",
    };
  }

  const passes = weight <= config.maxWeightLbs;
  const score = Math.max(0, 100 - (weight / config.maxWeightLbs) * 40);

  return {
    score,
    passes,
    rationale: passes
      ? `Weight ${weight}lbs within max ${config.maxWeightLbs}lbs`
      : `Weight ${weight}lbs exceeds max ${config.maxWeightLbs}lbs`,
  };
}

export function evaluateMultiStopEfficiency(
  offer: CompletedOffer,
  config: { maxStops?: number; maxExtraMilesPerStop?: number }
): MultiStopEfficiencyResult {
  const stops = offer.stops ?? [];
  const stopCount = stops.length;
  const maxStops = config.maxStops ?? 5;
  const extraMilesPerStop =
    stopCount > 1 && offer.distanceMiles > 0
      ? (offer.distanceMiles - (stops[0]?.distanceFromPrevMiles ?? 0)) /
        stopCount
      : 0;

  const passesStops = stopCount <= maxStops;
  const passesMiles =
    config.maxExtraMilesPerStop === undefined
      ? true
      : extraMilesPerStop <= config.maxExtraMilesPerStop;

  const passes = passesStops && passesMiles;
  const baseScore = passesStops ? 60 : 20;
  const efficiencyBonus = passesMiles ? 30 : 10;
  const densityBonus = stopCount > 1 ? 10 : 0;
  const score = Math.min(100, baseScore + efficiencyBonus + densityBonus);

  return {
    score,
    passes,
    rationale: passes
      ? `Multi-stop efficiency acceptable (${stopCount} stops, ~${round2(
          extraMilesPerStop
        )} extra mi/stop)`
      : `Multi-stop inefficiency (${stopCount} stops, ~${round2(
          extraMilesPerStop
        )} extra mi/stop)`,
  };
}
