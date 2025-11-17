/**
 * LUXGRID COLOR SWATCH COMPONENT
 * 
 * Displays a single color from the LuxGrid color system
 * with matte black aesthetic and Apple-tier spacing.
 * 
 * Design principles:
 * - Minimal, clean interface
 * - No barcode language
 * - Follows LuxGrid spacing + UI rhythm
 */

import { luxgridColors, LuxgridColorKey } from "@noid/ui";

export function ColorSwatch({ name }: { name: LuxgridColorKey }) {
  const c = luxgridColors[name];

  return (
    <div className="flex flex-col items-center gap-3 p-6 bg-black rounded-xl border border-neutral-800">
      <div
        className="w-32 h-32 rounded-md border border-neutral-700"
        style={{ backgroundColor: c.hex ?? "transparent" }}
      />
      <p className="text-white text-lg font-semibold tracking-wide">{name}</p>

      <p className="text-neutral-400 text-xs">
        HEX: {c.hex ?? "—"}
      </p>
      <p className="text-neutral-400 text-xs">
        RGB: {c.rgb ?? "—"}
      </p>
    </div>
  );
}
