"use client";

import { useEffect, useMemo, useState } from "react";
import DriverDashboard from "@/components/noid/DriverDashboard";
import SmartwatchDisplay from "@/components/noid/SmartwatchDisplay";
import OfferLiveFeed from "@/components/noid/OfferLiveFeed";
import HQEnvironment from "@/components/noid/HQEnvironment";
import { useDailyEarnings } from "@/hooks/useDailyEarnings";
import { useShiftTimer } from "@/hooks/useShiftTimer";
import { useDriverHealthStream } from "@/hooks/useDriverHealthStream";
import { useOfferStream, OfferStreamItem } from "@/hooks/useOfferStream";
import {
  CompletedOffer,
  DriverHealthSnapshot,
  ShiftDay,
} from "@/lib/driver-intel/types";

const milesFromKm = (km: number) => km / 1.60934;

export default function NoidIntelPage() {
  const todayIso = new Date().toISOString();
  const [day, setDay] = useState<ShiftDay>({
    id: "day-" + todayIso.slice(0, 10),
    date: todayIso.slice(0, 10),
    window: {
      start: new Date(new Date().setHours(8, 0, 0, 0)).toISOString(),
      end: new Date(new Date().setHours(20, 0, 0, 0)).toISOString(),
    },
    offers: [],
    breaks: [],
  });

  const { offers, latest } = useOfferStream(10_000);
  const { metrics } = useDailyEarnings({ day });
  const shift = useShiftTimer({ healthPollSeconds: 60 });
  const healthStream = useDriverHealthStream();

  const [lastScored, setLastScored] = useState<{
    offer: OfferStreamItem;
    score: number;
  } | null>(null);

  // Start shift on mount
  useEffect(() => {
    shift.startShift();
    return () => shift.stopShift();
  }, [shift.startShift, shift.stopShift]);

  // Sync new offers into day offers for earnings engine
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
    setDay((prev) => ({
      ...prev,
      offers: [...prev.offers, completed].slice(-25),
    }));
  }, [latest]);

  const snapshot: DriverHealthSnapshot | undefined = useMemo(
    () => ({
      hrBpm: 72,
      hydrationOz: 60,
      steps: 5200,
      sleepHours: 7,
      stressLevel: 3,
      fatigueLevel: 3,
      timestamp: new Date().toISOString(),
    }),
    []
  );

  const systemRecommendation = useMemo(() => {
    if (!lastScored) return "CAUTION";
    if (healthStream.status === "fatigued") return "DECLINE";
    if (lastScored.score >= 75) return "ACCEPT";
    if (lastScored.score < 50) return "DECLINE";
    return "CAUTION";
  }, [lastScored, healthStream.status]);

  const lastOffer = lastScored?.offer ?? latest ?? null;

  return (
    <HQEnvironment>
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DriverDashboard
            day={day}
            targetEarningsPerHour={25}
            snapshotProvider={() => snapshot}
          />
          <SmartwatchDisplay
            day={day}
            targetEarningsPerHour={25}
            snapshotProvider={() => snapshot}
          />
        </div>

        <OfferLiveFeed
          offers={offers.slice(-5)}
          onScore={(entry) => {
            setLastScored({ offer: entry.offer, score: entry.score.normalized });
          }}
        />

        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-4 shadow-[0_0_18px_rgba(16,185,129,0.18)]">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-neutral-400">System Snapshot</p>
              <p className="text-sm text-neutral-300">Live intelligence summary</p>
            </div>
            <span
              className={`text-[11px] px-3 py-1 rounded-full border shadow-[0_0_10px_rgba(255,255,255,0.08)] ${
                systemRecommendation === "ACCEPT"
                  ? "bg-emerald-500/15 border-emerald-400/50 text-emerald-200"
                  : systemRecommendation === "DECLINE"
                  ? "bg-rose-500/15 border-rose-400/50 text-rose-200"
                  : "bg-amber-500/15 border-amber-400/50 text-amber-200"
              }`}
            >
              {systemRecommendation}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <SnapshotItem label="Shift" value={formatDuration(shift.elapsedMs)} />
            <SnapshotItem label="Earnings" value={`$${metrics.net.toFixed(2)}`} />
            <SnapshotItem
              label="Health"
              value={healthStream.score ? `${healthStream.score}` : "…"}
              sub={healthStream.status ?? "pending"}
            />
            <SnapshotItem
              label="Last Offer"
              value={
                lastOffer
                  ? `${lastOffer.service ?? "Offer"} ${lastOffer.distanceKm ?? 0} km`
                  : "—"
              }
              sub={lastOffer ? `$${lastOffer.payout?.toFixed?.(2) ?? lastOffer.payout}` : ""}
            />
            <SnapshotItem
              label="Offer Score"
              value={lastScored ? lastScored.score.toFixed(1) : "—"}
              sub={systemRecommendation}
            />
          </div>
        </div>
      </div>
    </HQEnvironment>
  );
}

function SnapshotItem({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-800/60 p-3">
      <p className="text-[11px] uppercase tracking-wide text-neutral-400">{label}</p>
      <p className="text-lg font-semibold text-white">{value}</p>
      {sub ? <p className="text-xs text-neutral-500">{sub}</p> : null}
    </div>
  );
}

function formatDuration(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600)
    .toString()
    .padStart(2, "0");
  const minutes = Math.floor((totalSeconds % 3600) / 60)
    .toString()
    .padStart(2, "0");
  return `${hours}:${minutes}`;
}
