/**
 * LUXGRID TAG COMPONENT
 * Minimal tag/label component for categories, status, metadata
 * Pure matte design
 */

"use client";

import * as React from "react";

type TagProps = {
  children: React.ReactNode;
  variant?: "gold" | "emerald" | "white" | "black";
  size?: "sm" | "md";
  className?: string;
};

const variantMap = {
  gold: "bg-lux-gold text-lux-black",
  emerald: "bg-lux-emerald text-lux-black",
  white: "bg-lux-white text-lux-black",
  black: "bg-lux-black text-lux-white border border-lux-white",
};

const sizeMap = {
  sm: "px-3 py-1 text-xs",
  md: "px-4 py-1.5 text-sm",
};

export function LuxGridTag({
  children,
  variant = "emerald",
  size = "sm",
  className = "",
}: TagProps) {
  return (
    <span
      className={`
        inline-block font-sans font-medium tracking-[0.08em] uppercase
        ${variantMap[variant]}
        ${sizeMap[size]}
        ${className}
      `}
      style={{ letterSpacing: "0.08em" }}
    >
      {children}
    </span>
  );
}

export default LuxGridTag;
