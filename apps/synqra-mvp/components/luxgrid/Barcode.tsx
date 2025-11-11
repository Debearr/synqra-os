/**
 * LUXGRID BARCODE COMPONENT
 * Signature barcode motif for SYNQRA × NØID ecosystem
 * Programmatic SVG generation with LuxGrid color system
 */

"use client";

import * as React from "react";
import { luxgridColors } from "@/lib/luxgrid/colors";

type BarcodeProps = {
  width?: number;
  height?: number;
  accent?: "gold" | "emerald";
  className?: string;
};

export function LuxGridBarcode({
  width = 240,
  height = 32,
  accent = "emerald",
  className = "",
}: BarcodeProps) {
  const bars = 32;
  const barWidth = width / bars;
  
  const accentColor = accent === "gold" 
    ? luxgridColors.goldAccent.hex 
    : luxgridColors.emeraldAccent.hex;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      aria-label="LuxGrid barcode signature"
    >
      {Array.from({ length: bars }).map((_, i) => {
        const isAccent = i % 7 === 0;
        const fill = isAccent ? accentColor : luxgridColors.pureWhite.hex;
        const x = i * barWidth;
        const w = isAccent ? barWidth * 0.9 : barWidth * (0.3 + (i % 4) * 0.12);
        const opacity = isAccent ? 1 : 0.4;

        return (
          <rect
            key={i}
            x={x}
            y={0}
            width={w}
            height={height}
            rx={0.5}
            fill={fill}
            opacity={opacity}
          />
        );
      })}
    </svg>
  );
}

export default LuxGridBarcode;
