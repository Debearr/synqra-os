/**
 * LUXGRID DIVIDER COMPONENT
 * Minimal horizontal divider with accent color options
 * Virgil Abloh spacing rules
 */

"use client";

import * as React from "react";

type DividerProps = {
  color?: "gold" | "emerald" | "white" | "black";
  thickness?: "thin" | "medium" | "thick";
  width?: "sm" | "md" | "lg" | "full";
  className?: string;
};

const colorMap = {
  gold: "bg-lux-gold",
  emerald: "bg-lux-emerald",
  white: "bg-lux-white",
  black: "bg-lux-black",
};

const thicknessMap = {
  thin: "h-[1px]",
  medium: "h-[2px]",
  thick: "h-1",
};

const widthMap = {
  sm: "w-16",
  md: "w-24",
  lg: "w-32",
  full: "w-full",
};

export function LuxGridDivider({
  color = "emerald",
  thickness = "medium",
  width = "md",
  className = "",
}: DividerProps) {
  return (
    <div
      className={`${colorMap[color]} ${thicknessMap[thickness]} ${widthMap[width]} ${className}`}
      role="separator"
    />
  );
}

export default LuxGridDivider;
