import type { EnergyType } from "@/lib/journey/energyRules";
import { energyRules } from "@/lib/journey/energyRules";

type EnergyStepProps = {
  options: readonly EnergyType[];
  selectedEnergy: EnergyType | null;
  onSelect: (energy: EnergyType) => void;
};

export default function EnergyStep({ options, selectedEnergy, onSelect }: EnergyStepProps) {
  return (
    <section className="space-y-6">
      <div className="space-y-4">
        <p className="text-sm leading-copy tracking-[0.08em] text-ds-text-secondary">Step 3</p>
        <h2 className="text-2xl font-medium leading-compact">Select energy</h2>
      </div>

      <div className="space-y-4">
        {options.map((energy) => {
          const isSelected = selectedEnergy === energy;
          return (
            <button
              key={energy}
              type="button"
              onClick={() => onSelect(energy)}
              className={`w-full border p-6 text-left ${
                isSelected
                  ? "border-ds-gold bg-ds-surface text-ds-text-primary"
                  : "border-ds-text-secondary/40 bg-ds-surface text-ds-text-primary"
              }`}
            >
              <div className="space-y-2">
                <p className="text-base font-medium leading-compact">{energy}</p>
                <p className="text-sm leading-copy text-ds-text-secondary">
                  Max words: {energyRules[energy].maxWords}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
