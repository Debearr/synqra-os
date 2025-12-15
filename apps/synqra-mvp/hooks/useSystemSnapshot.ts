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

  const { metrics, lastUpdated, refresh } = useDailyEarnings({
    day,
    targetEarningsPerHour,
  });
  const shift = useShiftTimer({
    snapshotProvider,
  });
  const health = useDriverHealthStream({
    snapshotProvider,
    hoursDriven: shift.elapsedMs / (1000 * 60 * 60),
    lastBreakMinutesAgo: shift.onBreak ? 0 : undefined,
  });
  const { offers, latest } = useOfferStream(10_000);
  const { scoreOffer } = useOfferScoring();

  useEffect(() => {
    systemSnapshotStore.setState((prev) => ({
      ...prev,
      controllers: {
        ...prev.controllers,
        startShift: shift.startShift,
        stopShift: shift.stopShift,
        refreshSnapshot: refresh,
      },
    }));
  }, [shift.startShift, shift.stopShift, refresh]);

  useEffect(() => {
    systemSnapshotStore.setState((prev) => ({
      ...prev,
      shift: {
        startedAt: shift.startedAt,
        elapsedMs: shift.elapsedMs,
        onBreak: shift.onBreak,
      },
    }));
  }, [shift.startedAt, shift.elapsedMs, shift.onBreak]);

  useEffect(() => {
    systemSnapshotStore.setState((prev) => ({
      ...prev,
      earnings: {
        gross: metrics.gross,
        net: metrics.net,
        perMile: metrics.perMile,
        perHour: metrics.perHour,
        projection: metrics.projection,
        lastUpdated: lastUpdated ?? null,
      },
    }));
  }, [metrics.gross, metrics.net, metrics.perMile, metrics.perHour, metrics.projection, lastUpdated]);

  useEffect(() => {
    systemSnapshotStore.setState((prev) => ({
      ...prev,
      health: {
        score: health.score ?? null,
        status: health.status ?? null,
        recommendations: health.recommendations,
        raw: health.health,
      },
    }));
  }, [health.score, health.status, health.recommendations, health.health]);

  useEffect(() => {
    systemSnapshotStore.setState((prev) => ({
      ...prev,
      offers: offers.slice(-5),
    }));
  }, [offers]);

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
        const grade: OfferGrade = score.normalized >= 75 ? "GOOD" : score.normalized >= 50 ? "MID" : "BAD";
        const summary: OfferScoreSummary = {
          offerId: completed.id,
          score,
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

  const state = useSyncExternalStore(
    systemSnapshotStore.subscribe,
    systemSnapshotStore.getState,
    systemSnapshotStore.getState
  );

  return {
    state,
    selectors,
    actions: systemActions,
  };
}
