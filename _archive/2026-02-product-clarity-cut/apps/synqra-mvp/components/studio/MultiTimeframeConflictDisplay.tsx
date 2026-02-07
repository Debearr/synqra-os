"use client";

import type { UIState } from "@/app/api/aura-fx/multi-timeframe/ui-state-mapper";
import { ScenarioDisclaimerInline } from "@/components/ScenarioDisclaimerInline";

interface MultiTimeframeConflictDisplayProps {
  uiState: UIState;
}

/**
 * Displays multi-timeframe conflict resolution results
 * Strictly follows no-synthesis protocol
 */
export function MultiTimeframeConflictDisplay({
  uiState,
}: MultiTimeframeConflictDisplayProps) {
  if (!uiState.shouldDisplay) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-900/10 p-6">
        <div className="mb-2 flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-red-500" />
          <h3 className="font-mono text-sm uppercase tracking-[0.14em] text-red-400">
            {uiState.title}
          </h3>
        </div>
        <p className="mb-4 text-sm text-noid-silver/80">{uiState.subtitle}</p>
        <p className="text-xs text-noid-silver/60">{uiState.disclaimer}</p>
      </div>
    );
  }

  const statusColors = {
    green: "border-green-500/30 bg-green-900/10",
    amber: "border-amber-500/30 bg-amber-900/10",
    red: "border-red-500/30 bg-red-900/10",
  };

  const dotColors = {
    green: "bg-green-500",
    amber: "bg-amber-500",
    red: "bg-red-500",
  };

  const textColors = {
    green: "text-green-400",
    amber: "text-amber-400",
    red: "text-red-400",
  };

  const distribution = uiState.assessments.reduce(
    (acc, assessment) => {
      // Compliance: use max per direction to avoid synthesizing across timeframes.
      switch (assessment.direction) {
        case "BULLISH":
          acc.up = Math.max(acc.up, assessment.probability);
          break;
        case "BEARISH":
          acc.down = Math.max(acc.down, assessment.probability);
          break;
        default:
          acc.neutral = Math.max(acc.neutral, assessment.probability);
      }
      return acc;
    },
    { up: 0, neutral: 0, down: 0 }
  );

  const probabilities = uiState.assessments.map((assessment) => assessment.probability);
  const minProbability = Math.min(...probabilities);
  const maxProbability = Math.max(...probabilities);

  const uncertaintyBands = [
    {
      label: "Observed range",
      range: `${minProbability}%–${maxProbability}%`,
    },
    {
      label: "Spread",
      range: `${Math.max(0, maxProbability - minProbability).toFixed(1)}%`,
    },
  ];

  return (
    <div
      className={`rounded-xl border p-6 ${statusColors[uiState.statusColor]}`}
    >
      <div className="mb-4 flex items-center gap-2">
        <div className={`h-2 w-2 rounded-full ${dotColors[uiState.statusColor]}`} />
        <h3
          className={`font-mono text-sm uppercase tracking-[0.14em] ${textColors[uiState.statusColor]}`}
        >
          {uiState.title}
        </h3>
      </div>

      <p className="mb-4 text-sm text-noid-silver/80">{uiState.subtitle}</p>

      <div className="space-y-3">
        {uiState.assessments.map((assessment, index) => (
          <div
            key={index}
            className="rounded-lg border border-noid-silver/20 bg-noid-black/40 p-4"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="font-mono text-xs uppercase tracking-[0.12em] text-noid-silver/70">
                {assessment.label}
              </span>
              <span className="font-mono text-xs text-noid-silver/60">
                {assessment.timeframe}
              </span>
            </div>

            <div className="mb-1 flex items-baseline gap-2">
              <span className="text-lg font-medium text-white">
                {assessment.direction}
              </span>
              <span className="font-mono text-sm text-noid-silver/70">
                {assessment.probability}%
              </span>
            </div>

            <div className="text-xs text-noid-silver/60">
              Historical directional probability — no synthesis performed
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <ScenarioDisclaimerInline
          title="Scenario distribution context"
          distribution={distribution}
          calibrationRange={{ min: minProbability, max: maxProbability }}
          uncertaintyBands={uncertaintyBands}
          contextNote="Directional probabilities are shown per timeframe without synthesis."
        />
      </div>

      <div className="mt-4 rounded border border-noid-silver/10 bg-noid-black/20 p-3">
        <p className="text-xs text-noid-silver/60">{uiState.disclaimer}</p>
      </div>
    </div>
  );
}
