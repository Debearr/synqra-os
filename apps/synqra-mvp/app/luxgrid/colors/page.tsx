/**
 * LUXGRID COLOR SYSTEM SHOWCASE
 * 
 * Internal design system page displaying the complete
 * LuxGrid color palette for NØID, SYNQRA, AuraFX, NY7 Coffee,
 * and all future theme packs.
 * 
 * Route: /luxgrid/colors
 * 
 * Design system page - Fully coded, browsable internal reference
 */

import { luxgridColors } from "@/lib/luxgrid/colors";

// Simple ColorSwatch component (TODO: move to components/luxgrid)
function ColorSwatch({ name, value }: { name: string; value: string }) {
  return (
    <div className="flex flex-col gap-3">
      <div 
        className="w-full h-32 border border-white/10"
        style={{ backgroundColor: value }}
      />
      <div className="text-white text-sm font-mono">{name}</div>
      <div className="text-neutral-500 text-xs font-mono">{value}</div>
    </div>
  );
}

export default function LuxgridColorSystem() {
  const colors = [
    { name: "primaryBlack", value: luxgridColors.primaryBlack },
    { name: "goldAccent", value: luxgridColors.goldAccent },
    { name: "emeraldAccent", value: luxgridColors.emeraldAccent },
    { name: "pureWhite", value: luxgridColors.pureWhite },
    { name: "futureAccentA", value: luxgridColors.futureAccentA },
    { name: "futureAccentB", value: luxgridColors.futureAccentB },
  ];

  return (
    <div className="min-h-screen bg-black px-20 py-20">
      <h1 className="text-4xl text-white font-bold tracking-[0.15em] mb-4">
        LUXGRID COLOR SYSTEM
      </h1>

      <div className="w-24 h-[3px] bg-[#00D9A3] mb-12" />

      <div className="grid grid-cols-3 gap-16">
        {colors.map((c) => (
          <ColorSwatch 
            name={c.name} 
            value={typeof c.value === 'string' ? c.value : (c.value?.hex || '#000000')} 
            key={c.name} 
          />
        ))}
      </div>

      <footer className="mt-20 text-neutral-600 text-xs tracking-wider text-center">
        LUXGRID SYSTEM · SYNQRA × NØID · 2025
      </footer>
    </div>
  );
}
