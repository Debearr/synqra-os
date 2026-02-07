import { useEffect, useSyncExternalStore } from "react";
import { useDailyEarnings } from "@/hooks/useDailyEarnings";
import { useDriverHealthStream } from "@/hooks/useDriverHealthStream";
import { useOfferScoring } from "@/hooks/useOfferScoring";
import { useOfferStream } from "@/hooks/useOfferStream";
import { useShiftTimer } from "@/hooks/useShiftTimer";
import {
  OfferGrade,
  OfferScoreSummary,
  selectors,
  systemSnapshotStore,
} from "@/lib/driver-intel/systemSnapshot";
import { systemActions } from "@/lib/driver-intel/systemActions";
import {
  CompletedOffer,
  DriverHealthSnapshot,
  ShiftDay,
} from "@/lib/driver-intel/types";

const milesFromKm = (km: number) => km / 1.60934;

interface UseSystemSnapshotParams {
  day: ShiftDay;
  targetEarningsPerHour?: number;
  snapshotProvider?: () => DriverHealthSnapshot;
}

export function useSystemSnapshot(params: UseSystemSnapshotParams) {
  const { day, targetEarningsPerHour, snapshotProvider } = params;

  const { metrics } = useDailyEarnings({
    day,
    targetEarningsPerHour,
  });

  const { elapsedMs, onBreak } = useShiftTimer({
    inactivityMinutes: 15,
    healthPollSeconds: 60,
    snapshotProvider,
  });

  const { health, status: healthStatus } = useDriverHealthStream({
    pollSeconds: 60,
    snapshotProvider,
  });

  const { offers, latest } = useOfferStream(10_000);
  const { scoreOffer } = useOfferScoring();

  // ─────────────────────────────────────────────
  // Score latest offer
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!latest) return;

    const completed: CompletedOffer = {
      id: latest.id,
      serviceType: "delivery",
      payout: {
        base: latest.payout,
        bonus: 0,
        tips: 0,
        reimbursements: 0,
        adjustments: 0,
      },
      distanceMiles: parseFloat(milesFromKm(latest.distanceKm).toFixed(2)),
      durationMinutes: Math.max(10, Math.round(latest.distanceKm * 3)),
      weightLbs: parseFloat((latest.weightKg * 2.20462).toFixed(1)),
      multiStop: latest.stops > 1,
      stops: Array.from({ length: latest.stops }).map((_, idx) => ({
        id: `${latest.id}-stop-${idx + 1}`,
        sequence: idx + 1,
      })),
      acceptedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    };

    const run = async () => {
      try {
        const score = await scoreOffer(completed);

        const grade: OfferGrade =
          score.totalScore >= 75
            ? "GOOD"
            : score.totalScore >= 50
            ? "MID"
            : "BAD";

        const summary: OfferScoreSummary = {
          offerId: completed.id,
          score: score.raw,
          grade,
        };

        systemSnapshotStore.setState((prev) => ({
          ...prev,
          lastOfferScore: summary,
        }));
      } catch (error) {
        console.warn("offer scoring failed", error);
      }
    };

    run();
  }, [latest, scoreOffer]);

  // ─────────────────────────────────────────────
  // Main snapshot sync
  // ─────────────────────────────────────────────
  useEffect(() => {
    systemSnapshotStore.setState({
      shift: {
        startedAt: null,
        elapsedMs,
        onBreak,
      },
      earnings: {
        gross: metrics.gross,
        net: metrics.net,
        perMile: metrics.perMile,
        perHour: metrics.perHour,
        projection: metrics.projection,
        lastUpdated: new Date().toISOString(),
      },
      health: {
        score: health?.score ?? null,
        status: healthStatus ?? null,
        recommendations: health?.recommendations ?? [],
        raw: health ?? null,
      },
      offers,
    });
  }, [elapsedMs, onBreak, metrics, health, healthStatus, offers]);

  const snapshot = useSyncExternalStore(
    systemSnapshotStore.subscribe,
    systemSnapshotStore.getState,
    systemSnapshotStore.getState
  );

  return {
    snapshot,
    selectors,
    actions: systemActions,
  };
}
