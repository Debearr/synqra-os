/**
 * LUXGRID PAGE HEADER COMPONENT
 * Consistent page header with title, optional subtitle, and divider
 * Tom Ford precision spacing
 */

"use client";

import * as React from "react";
import { LuxGridDivider } from "./Divider";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  dividerColor?: "gold" | "emerald" | "white" | "black";
  textColor?: "white" | "gold" | "emerald" | "black";
  className?: string;
};

const textColorMap = {
  white: "text-lux-white",
  gold: "text-lux-gold",
  emerald: "text-lux-emerald",
  black: "text-lux-black",
};

export function LuxGridPageHeader({
  title,
  subtitle,
  dividerColor = "emerald",
  textColor = "white",
  className = "",
}: PageHeaderProps) {
  return (
    <div className={`flex flex-col gap-6 ${className}`}>
      {/* Title */}
      <h1
        className={`text-4xl md:text-5xl lg:text-6xl font-bold tracking-[0.15em] uppercase ${textColorMap[textColor]}`}
      >
        {title}
      </h1>

      {/* Divider */}
      <LuxGridDivider color={dividerColor} thickness="medium" width="lg" />

      {/* Subtitle */}
      {subtitle && (
        <p className={`text-lg md:text-xl tracking-[0.08em] opacity-70 ${textColorMap[textColor]}`}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

export default LuxGridPageHeader;
