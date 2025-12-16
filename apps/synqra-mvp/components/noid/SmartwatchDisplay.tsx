"use client";

import { useEffect, useMemo, useState } from "react";
import { ShiftDay, DriverHealthSnapshot } from "@/lib/driver-intel/types";
import { useShiftTimer } from "@/hooks/useShiftTimer";
import { useDailyEarnings } from "@/hooks/useDailyEarnings";

interface SmartwatchDisplayProps {
  day: ShiftDay;
  targetEarningsPerHour?: number;
  snapshotProvider?: () => DriverHealthSnapshot;
}

const formatDuration = (ms: number) => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600)
    .toString()
    .padStart(2, "0");
  const minutes = Math.floor((totalSeconds % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const seconds = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
};

export default function SmartwatchDisplay({
  day,
  targetEarningsPerHour,
  snapshotProvider,
}: SmartwatchDisplayProps) {
  const { metrics, loading } = useDailyEarnings({
    day,
    targetEarningsPerHour,
  });

  const {
    elapsedMs,
    onBreak,
    health,
    startShift,
    stopShift,
    reset,
  } = useShiftTimer({
    snapshotProvider,
    inactivityMinutes: 15,
    healthPollSeconds: 60,
  });

  const [ringProgress, setRingProgress] = useState(0);

  useEffect(() => {
    // Start shift timer when the component mounts
    startShift();
    return () => stopShift();
  }, [startShift, stopShift]);

  useEffect(() => {
    // Animate earnings ring on value updates
    const target = Math.min(
      1,
      metrics.perHour && targetEarningsPerHour
        ? metrics.perHour / targetEarningsPerHour
        : metrics.net > 0
        ? 0.6 + Math.min(metrics.net / 500, 0.4)
        : 0
    );
    setRingProgress(target);
  }, [metrics.net, metrics.perHour, targetEarningsPerHour]);

  const ringStyle = useMemo(() => {
    const angle = Math.max(5, Math.min(360, ringProgress * 360));
    const color =
      metrics.net > 0
        ? "rgba(16, 185, 129, 0.8)"
        : "rgba(107, 114, 128, 0.6)";
    return {
      background: `conic-gradient(${color} 0deg ${angle}deg, rgba(55, 65, 81, 0.3) ${angle}deg 360deg)`,
      transition: "background 0.8s ease",
    };
  }, [ringProgress, metrics.net]);

  const healthColor = useMemo(() => {
    if (!health) return "text-gray-400";
    if (health.score >= 70) return "text-emerald-400";
    if (health.score >= 40) return "text-amber-400";
    return "text-rose-400";
  }, [health]);

  return (
    <div className="w-full rounded-2xl bg-neutral-900 text-white p-8 shadow-lg border border-neutral-800 space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-xs uppercase tracking-wide text-neutral-400">Shift</p>
          <p
            className={`text-2xl font-semibold ${
              onBreak ? "text-amber-300" : "text-white"
            } ${elapsedMs ? "animate-pulse" : ""}`}
          >
            {formatDuration(elapsedMs)}
          </p>
          {onBreak && (
            <p className="text-xs text-amber-300">Auto-break detected</p>
          )}
        </div>
        <button
          className="text-xs text-neutral-300 underline hover:text-white"
          onClick={reset}
          type="button"
        >
          Reset
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 items-center">
        <div
          className="relative h-28 w-28 rounded-full flex items-center justify-center"
          style={ringStyle}
        >
          <div className="absolute inset-3 rounded-full bg-neutral-900 flex flex-col items-center justify-center">
            <p className="text-[10px] uppercase tracking-wide text-neutral-400">
              Net
            </p>
            <p className="text-lg font-semibold">
              {loading ? "…" : `$${metrics.net.toFixed(2)}`}
            </p>
            <p className="text-[10px] text-neutral-400">
              ${metrics.perHour.toFixed(2)}/hr
            </p>
          </div>
        </div>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-neutral-400">Gross</span>
            <span>${metrics.gross.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-400">Per Mile</span>
            <span>${metrics.perMile.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-400">Projection</span>
            <span>${metrics.projection.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-neutral-400">Health</p>
          <p className={`text-xl font-semibold ${healthColor}`}>
            {health ? `${health.score}` : "…"}
          </p>
          {health?.fatigueRisk && (
            <p className="text-xs text-neutral-400">
              Fatigue: {health.fatigueRisk}
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-xs text-neutral-400">Hydration</p>
          <p className="text-sm">{health?.hydrationStatus ?? "…"}</p>
          <p className="text-xs text-neutral-400 mt-1">
            Recommendations: {health?.recommendations?.[0] ?? "Monitoring…"}
          </p>
        </div>
      </div>
    </div>
  );
}
