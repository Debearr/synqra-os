/**
 * LUXGRID SIGNATURE COMPONENT
 * "De Bear" signature mark
 * Virgil Abloh-inspired quotation marks + minimal signature
 */

"use client";

import * as React from "react";

type SignatureProps = {
  color?: "white" | "gold" | "emerald" | "black";
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeMap = {
  sm: "text-sm tracking-[0.12em]",
  md: "text-base tracking-[0.12em]",
  lg: "text-lg tracking-[0.12em]",
};

const colorMap = {
  white: "text-lux-white",
  gold: "text-lux-gold",
  emerald: "text-lux-emerald",
  black: "text-lux-black",
};

export function LuxGridSignature({
  color = "white",
  size = "md",
  className = "",
}: SignatureProps) {
  return (
    <div
      className={`font-sans italic ${sizeMap[size]} ${colorMap[color]} ${className}`}
      style={{ opacity: 0.75 }}
    >
      "DE BEAR"
    </div>
  );
}

export default LuxGridSignature;
