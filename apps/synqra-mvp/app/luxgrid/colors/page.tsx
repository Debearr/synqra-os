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

import { ColorSwatch } from "@/components/luxgrid/ColorSwatch";

export default function LuxgridColorSystem() {
  const colors = [
    "primaryBlack",
    "goldAccent",
    "emeraldAccent",
    "pureWhite",
    "futureAccentA",
    "futureAccentB",
  ];

  return (
    <div className="min-h-screen bg-black px-20 py-20">
      <h1 className="text-4xl text-white font-bold tracking-[0.15em] mb-4">
        LUXGRID COLOR SYSTEM
      </h1>

      <div className="w-24 h-[3px] bg-[#00D9A3] mb-12" />

      <div className="grid grid-cols-3 gap-16">
        {colors.map((c) => (
          <ColorSwatch name={c as any} key={c} />
        ))}
      </div>

      <footer className="mt-20 text-neutral-600 text-xs tracking-wider text-center">
        LUXGRID SYSTEM · SYNQRA × NØID · 2025
      </footer>
    </div>
  );
}
