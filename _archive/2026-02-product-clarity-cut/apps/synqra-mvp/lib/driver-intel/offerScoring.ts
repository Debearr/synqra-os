import {
  OfferScoreBreakdown,
  OfferScoreInput,
  OfferScoreResult,
  OfferScoreWeights,
} from "./types";

const defaultWeights: OfferScoreWeights = {
  distance: 0.25,
  payout: 0.35,
  duration: 0.1,
  multiStop: 0.1,
  weight: 0.05,
  rating: 0.1,
};

export function aggregateScores(
  input: OfferScoreInput,
  weights: OfferScoreWeights = defaultWeights
): OfferScoreBreakdown {
  const distance = (input.distanceScore ?? 0) * (weights.distance ?? 0);
  const payout = (input.payoutScore ?? 0) * (weights.payout ?? 0);
  const duration = (input.durationScore ?? 0) * (weights.duration ?? 0);
  const multiStop = (input.multiStopScore ?? 0) * (weights.multiStop ?? 0);
  const weight = (input.weightScore ?? 0) * (weights.weight ?? 0);
  const rating = (input.driverRatingScore ?? 80) * (weights.rating ?? 0);

  const custom: Record<string, number> = Object.entries(input.customScores ?? {}).reduce<Record<string, number>>(
    (acc, [key, value]) => {
      const customWeight = weights.custom?.[key] ?? 0;
      acc[key] = (value ?? 0) * customWeight;
      return acc;
    },
    {}
  );

  const customTotal = Object.values(custom).reduce((sum, v) => sum + (v ?? 0), 0);
  const total = distance + payout + duration + multiStop + weight + rating + customTotal;

  const reasons: string[] = [];
  if ((input.payoutScore ?? 0) >= 80) reasons.push("Strong payout");
  if ((input.distanceScore ?? 0) >= 70) reasons.push("Route within preferred range");
  if ((input.multiStopScore ?? 0) < 40) reasons.push("Multi-stop efficiency risk");
  if ((input.weightScore ?? 0) < 50) reasons.push("Heavy load consideration");

  return {
    total,
    components: {
      distance,
      payout,
      duration,
      multiStop,
      weight,
      rating,
      custom,
    },
    reasons,
  };
}

export function normalizeScores(total: number): number {
  // Normalize to 0-100
  return Math.max(0, Math.min(100, total));
}

export function toOfferScoreResult(
  input: OfferScoreInput,
  weights?: OfferScoreWeights
): OfferScoreResult {
  const breakdown = aggregateScores(input, weights);
  const normalized = normalizeScores(breakdown.total);

  return {
    total: breakdown.total,
    normalized,
    breakdown,
    metadata: {
      weightPreset: weights ? "custom" : "default",
    },
  };
}
