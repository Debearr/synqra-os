"use client";

import { useEffect, useMemo, useState } from "react";
import { OfferStreamItem } from "@/hooks/useOfferStream";
import { scoreOffer as scoreOfferApi } from "@/lib/driver-intel/client";
import { CompletedOffer, OfferScoreResult } from "@/lib/driver-intel/types";

type OfferGrade = "GOOD" | "MID" | "BAD";

interface OfferLiveFeedProps {
  offers: OfferStreamItem[];
  onScore?: (entry: ScoredOffer) => void;
}

interface ScoredOffer {
  offer: OfferStreamItem;
  completed: CompletedOffer;
  score: OfferScoreResult;
  grade: OfferGrade;
}

const kmToMiles = (km: number) => km / 1.60934;
const kgToLbs = (kg: number) => kg * 2.20462;

export function OfferLiveFeed({ offers, onScore }: OfferLiveFeedProps) {
  const [scored, setScored] = useState<ScoredOffer[]>([]);

  useEffect(() => {
    const latest = offers[offers.length - 1];
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
      distanceMiles: parseFloat(kmToMiles(latest.distanceKm).toFixed(2)),
      durationMinutes: Math.max(10, Math.round(latest.distanceKm * 3)), // rough ETA
      weightLbs: parseFloat(kgToLbs(latest.weightKg).toFixed(1)),
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
        const score = await scoreOfferApi(completed);
        const grade: OfferGrade =
          score.normalized >= 75 ? "GOOD" : score.normalized >= 50 ? "MID" : "BAD";
        const entry: ScoredOffer = {
          offer: latest,
          completed,
          score,
          grade,
        };
        setScored((prev) => {
          const next = [entry, ...prev];
          return next.slice(0, 5);
        });
        onScore?.(entry);
      } catch (error) {
        console.warn("Offer scoring failed", error);
      }
    };

    run();
  }, [offers, onScore]);

  return (
    <div className="rounded-2xl border border-emerald-500/20 bg-neutral-900/70 p-8 shadow-[0_0_22px_rgba(16,185,129,0.2)] backdrop-blur space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-xs uppercase tracking-wide text-neutral-400">Offer Live Feed</p>
          <p className="text-sm text-neutral-300">Last 5 incoming offers</p>
        </div>
        <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.35)]">
          Live
        </span>
      </div>
      <div className="space-y-6">
        {scored.map((entry) => (
          <OfferRow key={entry.offer.id} entry={entry} />
        ))}
        {!scored.length && <p className="text-sm text-neutral-500">Waiting for offers…</p>}
      </div>
    </div>
  );
}

function OfferRow({ entry }: { entry: ScoredOffer }) {
  const { offer, score, grade } = entry;

  const gradeStyle = useMemo(() => {
    switch (grade) {
      case "GOOD":
        return "bg-emerald-500/10 text-emerald-300 border-emerald-500/30";
      case "MID":
        return "bg-amber-500/10 text-amber-300 border-amber-500/30";
      case "BAD":
      default:
        return "bg-rose-500/10 text-rose-300 border-rose-500/30";
    }
  }, [grade]);

  const comps = score.breakdown.components ?? {};

  return (
    <div className="rounded-xl border border-neutral-800/70 bg-neutral-900/50 p-6 shadow-[0_0_12px_rgba(255,255,255,0.04)] backdrop-blur-sm space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm">
          <p className="font-semibold">{offer.service}</p>
          <p className="text-neutral-400 text-xs">
            {offer.distanceKm} km • ${offer.payout.toFixed(2)} • {offer.stops} stops
          </p>
        </div>
        <span className={`text-[11px] px-2 py-1 rounded-full border ${gradeStyle}`}>
          {grade}
        </span>
      </div>
      <div className="mt-2 grid grid-cols-5 gap-2 text-xs text-neutral-300">
        <Bucket label="Distance" value={comps.distance} />
        <Bucket label="Payout" value={comps.payout} />
        <Bucket label="Time" value={comps.duration} />
        <Bucket label="Weight" value={comps.weight} />
        <Bucket label="Total" value={score.normalized} highlight />
      </div>
      {score.breakdown.reasons?.length ? (
        <ul className="mt-2 text-[11px] text-neutral-400 space-y-1 list-disc list-inside">
          {score.breakdown.reasons.slice(0, 3).map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function Bucket({
  label,
  value,
  highlight,
}: {
  label: string;
  value?: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border px-2 py-1 text-center ${
        highlight
          ? "border-emerald-400/60 bg-emerald-500/10 text-emerald-200"
          : "border-neutral-700 bg-neutral-900/50 text-neutral-200"
      }`}
    >
      <p className="text-[10px] uppercase tracking-wide text-neutral-400">{label}</p>
      <p className="text-sm font-semibold">{(value ?? 0).toFixed(1)}</p>
    </div>
  );
}

export default OfferLiveFeed;
