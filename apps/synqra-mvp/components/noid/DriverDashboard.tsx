"use client";

import { useEffect, useMemo } from "react";
import { ShiftDay, CompletedOffer, DriverHealthSnapshot } from "@/lib/driver-intel/types";
import { useDailyEarnings } from "@/hooks/useDailyEarnings";
import { useShiftTimer } from "@/hooks/useShiftTimer";
import { useDriverHealthStream } from "@/hooks/useDriverHealthStream";
import { useOfferScoring } from "@/hooks/useOfferScoring";

interface DriverDashboardProps {
  day: ShiftDay;
  targetEarningsPerHour?: number;
  snapshotProvider?: () => DriverHealthSnapshot;
}

const milesToKm = (miles: number) => miles * 1.60934;

export default function DriverDashboard({
  day,
  targetEarningsPerHour,
  snapshotProvider,
}: DriverDashboardProps) {
  const { metrics, loading: earningsLoading } = useDailyEarnings({
    day,
    targetEarningsPerHour,
  });

  const { elapsedMs, onBreak, startShift, stopShift } = useShiftTimer({
    inactivityMinutes: 15,
    healthPollSeconds: 60,
    snapshotProvider,
  });

  const { health, status: healthStatus } = useDriverHealthStream({
    pollSeconds: 60,
    snapshotProvider,
  });

  const { preview, scoreOffer, loading: scoringLoading } = useOfferScoring();

  useEffect(() => {
    startShift();
    return () => stopShift();
  }, [startShift, stopShift]);

  const kmDriven = useMemo(
    () =>
      milesToKm(
        day.offers.reduce((sum, offer) => sum + (offer.distanceMiles ?? 0), 0)
      ),
    [day.offers]
  );

  const shiftDurationLabel = useMemo(() => {
    const totalSeconds = Math.max(0, Math.floor(elapsedMs / 1000));
    const hours = Math.floor(totalSeconds / 3600)
      .toString()
      .padStart(2, "0");
    const minutes = Math.floor((totalSeconds % 3600) / 60)
      .toString()
      .padStart(2, "0");
    return `${hours}:${minutes}`;
  }, [elapsedMs]);

  const healthColor = useMemo(() => {
    switch (healthStatus) {
      case "optimal":
        return "text-emerald-400";
      case "caution":
        return "text-amber-400";
      case "fatigued":
        return "text-rose-400";
      default:
        return "text-neutral-400";
    }
  }, [healthStatus]);

  const chartHeight = useMemo(() => {
    const base = 32;
    const scaled = Math.min(120, base + metrics.net * 0.05);
    return `${scaled}px`;
  }, [metrics.net]);

  const systemGauge = useMemo(() => {
    if (!health) return "System check pending…";
    if (healthStatus === "optimal") return "System optimal";
    if (healthStatus === "caution") return "System in caution";
    return "System fatigued";
  }, [health, healthStatus]);

  const sampleOffer: CompletedOffer =
    day.offers[0] ??
    ({
      id: "sample-offer",
      payout: {
        base: 8,
        bonus: 2,
        tips: 3,
        reimbursements: 0,
      },
      distanceMiles: 5,
      durationMinutes: 24,
      acceptedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      weightLbs: 15,
      multiStop: false,
    } satisfies CompletedOffer);

  const handleScorePreview = async () => {
    await scoreOffer(sampleOffer);
  };

  return (
    <div className="mb-16 rounded-2xl border border-neutral-800 bg-neutral-900/80 p-8 text-white shadow-xl space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-xs uppercase tracking-wide text-neutral-400">Shift</p>
          <p className={`text-3xl font-semibold ${onBreak ? "text-amber-300" : "text-white"}`}>
            {shiftDurationLabel}
          </p>
          {onBreak && <p className="text-xs text-amber-300">Auto-break detected</p>}
        </div>
        <div className="text-right">
          <p className="text-xs text-neutral-400">Health</p>
          <p className={`text-xl font-semibold ${healthColor}`}>
            {health?.score ?? "…"}
          </p>
          <p className="text-xs text-neutral-400">{systemGauge}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 text-sm">
        <div className="rounded-xl border border-neutral-800 bg-neutral-800/60 p-6 space-y-1">
          <p className="text-neutral-400 text-xs uppercase">Net Earnings</p>
          <p className="text-2xl font-semibold">${metrics.net.toFixed(2)}</p>
          <p className="text-xs text-neutral-500">${metrics.perHour.toFixed(2)} / hr</p>
        </div>
        <div className="rounded-xl border border-neutral-800 bg-neutral-800/60 p-6 space-y-1">
          <p className="text-neutral-400 text-xs uppercase">Km Driven</p>
          <p className="text-2xl font-semibold">{kmDriven.toFixed(1)} km</p>
          <p className="text-xs text-neutral-500">{day.offers.length} offers</p>
        </div>
        <div className="rounded-xl border border-neutral-800 bg-neutral-800/60 p-6 space-y-1">
          <p className="text-neutral-400 text-xs uppercase">Projection</p>
          <p className="text-2xl font-semibold">${metrics.projection.toFixed(2)}</p>
          <p className="text-xs text-neutral-500">Target: {targetEarningsPerHour ?? "—"} / hr</p>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs uppercase tracking-wide text-neutral-400">Earnings Trend</p>
        <div className="mt-3 h-32 rounded-xl border border-neutral-800 bg-gradient-to-b from-neutral-800 to-neutral-900 relative overflow-hidden">
          <div
            className="absolute bottom-0 left-0 right-0 bg-emerald-500/60 transition-all duration-700 ease-out"
            style={{ height: chartHeight, opacity: earningsLoading ? 0.6 : 1 }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-transparent to-transparent pointer-events-none" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-neutral-800 bg-neutral-800/70 p-8 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-neutral-400">System Status</p>
              <p className={`text-lg font-semibold ${healthColor}`}>
                {health ? `${health.score} / 100` : "Monitoring…"}
              </p>
            </div>
            <div className="h-14 w-14 rounded-full border-2 border-neutral-700 flex items-center justify-center">
              <span className={`text-sm font-semibold ${healthColor}`}>
                {healthStatus ?? "—"}
              </span>
            </div>
          </div>
          <ul className="text-xs text-neutral-300 space-y-1 list-disc list-inside">
            {(health?.recommendations ?? ["Rest status pending…"]).slice(0, 3).map((rec) => (
              <li key={rec}>{rec}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-800/70 p-8 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-neutral-400">Offer Scoring Preview</p>
              <p className="text-sm text-neutral-300">
                Score a sample offer to see fit
              </p>
            </div>
            <button
              type="button"
              onClick={handleScorePreview}
              className="rounded-lg bg-emerald-500 px-3 py-1 text-sm font-semibold text-neutral-900 hover:bg-emerald-400 transition"
              disabled={scoringLoading}
            >
              {scoringLoading ? "Scoring…" : "Score"}
            </button>
          </div>
          {preview ? (
            <div className="grid grid-cols-2 gap-2 text-sm">
              <ScorePill label="Distance" value={preview.distanceScore} />
              <ScorePill label="Payout" value={preview.payoutScore} />
              <ScorePill label="Time" value={preview.timeScore} />
              <ScorePill label="Weight" value={preview.weightScore} />
              <ScorePill label="Total" value={preview.totalScore} highlight />
            </div>
          ) : (
            <p className="text-sm text-neutral-500">Run a preview to populate scores.</p>
          )}
          {preview?.rationale?.length ? (
            <ul className="mt-3 text-xs text-neutral-300 space-y-1 list-disc list-inside">
              {preview.rationale.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ScorePill({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-lg px-3 py-2 border ${
        highlight ? "border-emerald-400 bg-emerald-500/10" : "border-neutral-700 bg-neutral-800/60"
      }`}
    >
      <p className="text-[11px] uppercase tracking-wide text-neutral-400">{label}</p>
      <p className="text-base font-semibold">{value.toFixed(1)}</p>
    </div>
  );
}
