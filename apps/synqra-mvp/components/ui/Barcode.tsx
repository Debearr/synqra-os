/* eslint-disable react/no-array-index-key */
"use client";

import * as React from "react";

type BarcodeProps = {
  width?: number;
  height?: number;
  accent?: string;
  tone?: string;
};

export default function Barcode({
  width = 160,
  height = 24,
  accent = "var(--brand-teal)",
  tone = "var(--brand-gold)",
}: BarcodeProps) {
  const bars = 24;
  const w = width / bars;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-label="NØID barcode motif"
    >
      {Array.from({ length: bars }).map((_, i) => {
        const isAccent = i % 7 === 0;
        const fill = isAccent ? accent : tone;
        const x = i * w;
        const barWidth = isAccent ? w * 0.8 : w * (0.35 + (i % 3) * 0.1);

        return (
          <rect
            key={i}
            x={x}
            y={0}
            width={barWidth}
            height={height}
            rx={1}
            fill={fill}
            opacity={isAccent ? 0.85 : 0.35}
          />
        );
      })}
    </svg>
  );
}
