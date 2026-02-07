"use client";

import { AlertTriangle } from "lucide-react";
import { getDisclaimerContent } from "@/lib/compliance/disclaimer-manager";

interface ProbabilityDistribution {
  up: number;
  neutral: number;
  down: number;
}

interface CalibrationRange {
  min: number;
  max: number;
}

interface UncertaintyBand {
  label: string;
  range: string;
}

interface ScenarioDisclaimerInlineProps {
  title?: string;
  distribution: ProbabilityDistribution;
  calibrationRange: CalibrationRange;
  uncertaintyBands: UncertaintyBand[];
  contextNote?: string;
}

/**
 * Inline disclaimer tied directly to scenario output.
 * Ensures probabilistic, descriptive framing for regulatory safety.
 */
export function ScenarioDisclaimerInline({
  title = "Scenario context",
  distribution,
  calibrationRange,
  uncertaintyBands,
  contextNote,
}: ScenarioDisclaimerInlineProps) {
  const disclaimer = getDisclaimerContent("scenario");

  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-900/10 p-4 space-y-3">
      <div className="flex items-start gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
        <div className="space-y-1">
          <p className="text-xs font-medium text-amber-400">{title}</p>
          <p className="text-xs text-noid-silver/80">{disclaimer.inline}</p>
          {contextNote && (
            <p className="text-xs text-noid-silver/70">{contextNote}</p>
          )}
        </div>
      </div>

      <div className="grid gap-3 text-xs text-noid-silver/80 md:grid-cols-3">
        <div className="rounded-lg border border-amber-500/20 bg-amber-900/5 p-3">
          <p className="text-amber-400/90 font-medium">Probability distribution</p>
          <p className="mt-1">Up: {distribution.up}%</p>
          <p>Neutral: {distribution.neutral}%</p>
          <p>Down: {distribution.down}%</p>
        </div>

        <div className="rounded-lg border border-amber-500/20 bg-amber-900/5 p-3">
          <p className="text-amber-400/90 font-medium">Calibration context</p>
          <p className="mt-1">
            Historical alignment: {calibrationRange.min}%–{calibrationRange.max}%
          </p>
        </div>

        <div className="rounded-lg border border-amber-500/20 bg-amber-900/5 p-3">
          <p className="text-amber-400/90 font-medium">Uncertainty bands</p>
          <div className="mt-1 space-y-1">
            {uncertaintyBands.map((band) => (
              <div key={band.label} className="flex items-center justify-between">
                <span>{band.label}</span>
                <span>{band.range}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
