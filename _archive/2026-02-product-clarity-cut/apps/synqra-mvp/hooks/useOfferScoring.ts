import { useCallback, useState } from "react";
import { scoreOffer as scoreOfferApi } from "@/lib/driver-intel/client";
import { CompletedOffer, OfferScoreResult } from "@/lib/driver-intel/types";

export interface OfferScorePreview {
  distanceScore: number;
  payoutScore: number;
  timeScore: number;
  weightScore: number;
  totalScore: number;
  rationale: string[];
  raw: OfferScoreResult;
}

export function useOfferScoring() {
  const [preview, setPreview] = useState<OfferScorePreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scoreOffer = useCallback(async (offer: CompletedOffer) => {
    setLoading(true);
    setError(null);
    try {
      const result = await scoreOfferApi(offer);
      const breakdown = result.breakdown;
      const comps = breakdown.components ?? {
        distance: 0,
        payout: 0,
        duration: 0,
        weight: 0,
        multiStop: 0,
        rating: 0,
      };

      const mapped: OfferScorePreview = {
        distanceScore: comps.distance ?? 0,
        payoutScore: comps.payout ?? 0,
        timeScore: comps.duration ?? 0,
        weightScore: comps.weight ?? 0,
        totalScore: result.normalized,
        rationale: breakdown.reasons ?? [],
        raw: result,
      };
      setPreview(mapped);
      return mapped;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { preview, scoreOffer, loading, error };
}
