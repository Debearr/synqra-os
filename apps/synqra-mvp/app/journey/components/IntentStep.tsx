import type { IntentType } from "@/lib/journey/templates";

type IntentStepProps = {
  options: readonly IntentType[];
  selectedIntent: IntentType | null;
  onSelect: (intent: IntentType) => void;
};

export default function IntentStep({ options, selectedIntent, onSelect }: IntentStepProps) {
  return (
    <section className="space-y-6">
      <div className="space-y-4">
        <p className="text-sm leading-copy tracking-[0.08em] text-ds-text-secondary">Step 1</p>
        <h2 className="text-2xl font-medium leading-compact">Select intent</h2>
      </div>

      <div className="space-y-4">
        {options.map((intent) => {
          const isSelected = selectedIntent === intent;
          return (
            <button
              key={intent}
              type="button"
              onClick={() => onSelect(intent)}
              className={`w-full border p-6 text-left text-sm font-medium leading-copy ${
                isSelected
                  ? "border-ds-gold bg-ds-surface text-ds-text-primary"
                  : "border-ds-text-secondary/40 bg-ds-surface text-ds-text-primary"
              }`}
            >
              {intent}
            </button>
          );
        })}
      </div>
    </section>
  );
}
