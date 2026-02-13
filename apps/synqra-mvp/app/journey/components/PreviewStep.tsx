import type { EnergyType } from "@/lib/journey/energyRules";
import type { FormatType, IntentType } from "@/lib/journey/templates";

type PreviewStepProps = {
  intent: IntentType;
  format: FormatType;
  energy: EnergyType;
  output: string;
  errors: string[];
  confirmed: boolean;
  onConfirm: () => void;
  onEdit: () => void;
};

export default function PreviewStep({
  intent,
  format,
  energy,
  output,
  errors,
  confirmed,
  onConfirm,
  onEdit,
}: PreviewStepProps) {
  return (
    <section className="space-y-6">
      <div className="space-y-4">
        <p className="text-sm leading-copy tracking-[0.08em] text-ds-text-secondary">Step 4</p>
        <h2 className="text-2xl font-medium leading-compact">Preview</h2>
      </div>

      <div className="space-y-4 border border-ds-text-secondary/40 bg-ds-surface p-6">
        <p className="text-sm leading-copy text-ds-text-secondary">
          Intent: {intent} | Format: {format} | Energy: {energy}
        </p>
        <pre className="whitespace-pre-wrap text-sm leading-copy text-ds-text-primary">{output}</pre>
        {errors.length > 0 ? (
          <div className="space-y-2">
            {errors.map((error) => (
              <p key={error} className="text-sm leading-copy text-ds-gold">
                {error}
              </p>
            ))}
          </div>
        ) : null}
      </div>

      <div className="space-y-4">
        <button
          type="button"
          onClick={onConfirm}
          className="w-full bg-ds-gold px-4 py-2 text-sm font-medium leading-copy text-ds-bg"
        >
          Confirm
        </button>
        <button
          type="button"
          onClick={onEdit}
          className="w-full border border-ds-text-secondary/40 bg-ds-surface px-4 py-2 text-sm font-medium leading-copy text-ds-text-primary"
        >
          Edit
        </button>
      </div>

      {confirmed ? <p className="text-sm leading-copy text-ds-text-secondary">Saved to local log.</p> : null}
    </section>
  );
}
