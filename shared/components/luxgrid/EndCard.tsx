/**
 * LUXGRID ENDCARD COMPONENT
 * Full-bleed matte black end card for CapCut exports
 * Logo + Barcode + Optional Tagline
 */

"use client";

import * as React from "react";
import { LuxGridLogo } from "./Logo";
import { LuxGridBarcode } from "./Barcode";

type EndCardProps = {
  brand: "synqra" | "noid";
  tagline?: string;
  barcodeAccent?: "gold" | "emerald";
  className?: string;
};

export function LuxGridEndCard({
  brand,
  tagline,
  barcodeAccent = "emerald",
  className = "",
}: EndCardProps) {
  return (
    <div
      className={`relative flex flex-col items-center justify-center w-full h-screen bg-lux-black ${className}`}
    >
      {/* Logo - Center */}
      <div className="flex-1 flex items-center justify-center">
        <LuxGridLogo variant={brand} size="xl" color="white" />
      </div>

      {/* Tagline - Optional */}
      {tagline && (
        <div className="mb-12 text-lux-white text-lg tracking-[0.15em] uppercase opacity-60">
          {tagline}
        </div>
      )}

      {/* Barcode - Bottom */}
      <div className="mb-16">
        <LuxGridBarcode width={320} height={40} accent={barcodeAccent} />
      </div>
    </div>
  );
}

export default LuxGridEndCard;
