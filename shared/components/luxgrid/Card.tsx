/**
 * LUXGRID CARD COMPONENT
 * Minimal content card with optional header, body, and footer
 * No shadows, no gradients - pure matte container
 */

"use client";

import * as React from "react";

type CardProps = {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  variant?: "dark" | "light" | "outlined";
  padding?: "sm" | "md" | "lg";
  className?: string;
};

const variantMap = {
  dark: "bg-lux-black text-lux-white border border-lux-white/20",
  light: "bg-lux-white text-lux-black border border-lux-black/20",
  outlined: "bg-transparent text-lux-white border-2 border-lux-white",
};

const paddingMap = {
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export function LuxGridCard({
  children,
  header,
  footer,
  variant = "dark",
  padding = "md",
  className = "",
}: CardProps) {
  return (
    <div className={`flex flex-col ${variantMap[variant]} ${paddingMap[padding]} ${className}`}>
      {/* Header */}
      {header && (
        <div className="mb-4 pb-4 border-b border-current/20">
          {header}
        </div>
      )}

      {/* Body */}
      <div className="flex-1">
        {children}
      </div>

      {/* Footer */}
      {footer && (
        <div className="mt-4 pt-4 border-t border-current/20">
          {footer}
        </div>
      )}
    </div>
  );
}

export default LuxGridCard;
