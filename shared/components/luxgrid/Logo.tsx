/**
 * LUXGRID LOGO COMPONENT
 * Tesla-grade minimalism | Tom Ford precision
 * Pure typography-based logo system
 */

"use client";

import * as React from "react";
import { luxgridColors } from "@/lib/luxgrid/colors";

type LogoVariant = "synqra" | "noid" | "luxgrid";

type LogoProps = {
  variant: LogoVariant;
  size?: "sm" | "md" | "lg" | "xl";
  color?: "white" | "gold" | "emerald" | "black";
  className?: string;
};

const sizeMap = {
  sm: "text-2xl tracking-[0.15em]",
  md: "text-4xl tracking-[0.15em]",
  lg: "text-6xl tracking-[0.15em]",
  xl: "text-8xl tracking-[0.15em]",
};

const colorMap = {
  white: "text-lux-white",
  gold: "text-lux-gold",
  emerald: "text-lux-emerald",
  black: "text-lux-black",
};

const logoText = {
  synqra: "SYNQRA",
  noid: "NØID",
  luxgrid: "LUXGRID",
};

export function LuxGridLogo({
  variant,
  size = "md",
  color = "white",
  className = "",
}: LogoProps) {
  return (
    <div
      className={`font-sans font-bold uppercase ${sizeMap[size]} ${colorMap[color]} ${className}`}
      style={{ letterSpacing: "0.15em" }}
    >
      {logoText[variant]}
    </div>
  );
}

export default LuxGridLogo;
