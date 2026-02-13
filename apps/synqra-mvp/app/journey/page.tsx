"use client";

import { useMemo, useState } from "react";
import EnergyStep from "@/app/journey/components/EnergyStep";
import FormatStep from "@/app/journey/components/FormatStep";
import IntentStep from "@/app/journey/components/IntentStep";
import PreviewStep from "@/app/journey/components/PreviewStep";
import { assembleJourney, JourneyAssemblyError, type JourneyFields } from "@/lib/journey/assemble";
import { energies, type EnergyType } from "@/lib/journey/energyRules";
import { formats, intents, type FormatType, type IntentType } from "@/lib/journey/templates";

type Step = 1 | 2 | 3 | 4;
type JourneyLogEntry = {
  intent: IntentType;
  format: FormatType;
  energy: EnergyType;
  generatedText: string;
  timestamp: string;
};

const JOURNEY_LOG_KEY = "journey_v1_logs";

const defaultFields: JourneyFields = {
  destination: "Amalfi",
  suite_type: "SignatureSuite",
  timing_window: "JuneWindow",
  partner_status: "PartnerConfirmed",
  experience_marker: "SeaTransferSet",
  cta_deadline: "May30",
  access_type: "PriorityAccess",
  service_tier: "TierOne",
  timing_qualifier: "Early",
  trip_duration: "6Nights",
};

function resolveEditStep(errors: string[]): Step {
  const message = errors.join(" ").toLowerCase();
  if (message.includes("panel")) return 2;
  if (
    message.includes("word count") ||
    message.includes("banned") ||
    message.includes("emoji") ||
    message.includes("exclamation")
  ) {
    return 3;
  }
  return 1;
}

export default function JourneyPage() {
  const [step, setStep] = useState<Step>(1);
  const [intent, setIntent] = useState<IntentType | null>(null);
  const [format, setFormat] = useState<FormatType | null>(null);
  const [energy, setEnergy] = useState<EnergyType | null>(null);
  const [output, setOutput] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [confirmed, setConfirmed] = useState(false);

  const progress = useMemo(() => [1, 2, 3, 4] as const, []);

  const onIntentSelect = (nextIntent: IntentType) => {
    setIntent(nextIntent);
    setConfirmed(false);
    setStep(2);
  };

  const onFormatSelect = (nextFormat: FormatType) => {
    setFormat(nextFormat);
    setConfirmed(false);
    setStep(3);
  };

  const onEnergySelect = (nextEnergy: EnergyType) => {
    if (!intent || !format) return;
    setEnergy(nextEnergy);
    setConfirmed(false);

    try {
      const assembled = assembleJourney({
        intent,
        format,
        energy: nextEnergy,
        fields: defaultFields,
      });
      setOutput(assembled);
      setErrors([]);
    } catch (error) {
      if (error instanceof JourneyAssemblyError && error.code === "VALIDATION_FAILED") {
        const nextErrors = Array.isArray(error.details.errors)
          ? (error.details.errors as string[])
          : ["Validation failed."];
        setOutput("");
        setErrors(nextErrors);
      } else if (error instanceof JourneyAssemblyError) {
        setOutput("");
        setErrors([error.message]);
      } else {
        setOutput("");
        setErrors(["Unknown assembly failure."]);
      }
    }

    setStep(4);
  };

  const onConfirm = () => {
    if (!intent || !format || !energy || !output || errors.length > 0) return;

    const entry: JourneyLogEntry = {
      intent,
      format,
      energy,
      generatedText: output,
      timestamp: new Date().toISOString(),
    };

    const existingRaw = localStorage.getItem(JOURNEY_LOG_KEY);
    const existing = existingRaw ? (JSON.parse(existingRaw) as JourneyLogEntry[]) : [];
    existing.push(entry);
    localStorage.setItem(JOURNEY_LOG_KEY, JSON.stringify(existing));
    setConfirmed(true);
  };

  const onEdit = () => {
    if (errors.length > 0) {
      setStep(resolveEditStep(errors));
      return;
    }
    setStep(3);
  };

  return (
    <main className="min-h-screen bg-ds-bg text-ds-text-primary">
      <div className="mx-auto w-full max-w-journey space-y-6 px-6 py-12">
        <header className="space-y-4">
          <p className="text-sm leading-copy text-ds-text-secondary">Journey V1</p>
          <h1 className="text-2xl font-medium leading-compact">Deterministic flow</h1>
        </header>

        <div className="flex items-center gap-2" aria-hidden>
          {progress.map((dotStep) => (
            <span
              key={dotStep}
              className={`block h-2 w-2 ${dotStep <= step ? "bg-ds-gold" : "bg-ds-text-secondary/40"}`}
            />
          ))}
        </div>

        <div>
          {step === 1 ? <IntentStep options={intents} selectedIntent={intent} onSelect={onIntentSelect} /> : null}
          {step === 2 ? <FormatStep options={formats} selectedFormat={format} onSelect={onFormatSelect} /> : null}
          {step === 3 ? <EnergyStep options={energies} selectedEnergy={energy} onSelect={onEnergySelect} /> : null}
          {step === 4 && intent && format && energy ? (
            <PreviewStep
              intent={intent}
              format={format}
              energy={energy}
              output={output}
              errors={errors}
              confirmed={confirmed}
              onConfirm={onConfirm}
              onEdit={onEdit}
            />
          ) : null}
        </div>
      </div>
    </main>
  );
}
