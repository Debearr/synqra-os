import type { FormatType } from "@/lib/journey/templates";

type FormatStepProps = {
  options: readonly FormatType[];
  selectedFormat: FormatType | null;
  onSelect: (format: FormatType) => void;
};

export default function FormatStep({ options, selectedFormat, onSelect }: FormatStepProps) {
  return (
    <section className="space-y-6">
      <div className="space-y-4">
        <p className="text-sm leading-copy tracking-[0.08em] text-ds-text-secondary">Step 2</p>
        <h2 className="text-2xl font-medium leading-compact">Select format</h2>
      </div>

      <div className="space-y-4">
        {options.map((format) => {
          const isSelected = selectedFormat === format;
          return (
            <button
              key={format}
              type="button"
              onClick={() => onSelect(format)}
              className={`w-full border p-6 text-left text-sm font-medium leading-copy ${
                isSelected
                  ? "border-ds-gold bg-ds-surface text-ds-text-primary"
                  : "border-ds-text-secondary/40 bg-ds-surface text-ds-text-primary"
              }`}
            >
              {format}
            </button>
          );
        })}
      </div>
    </section>
  );
}
