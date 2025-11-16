/**
 * LUXGRID CTA BUTTON COMPONENT
 * Premium call-to-action button
 * No gradients, no shadows - pure matte precision
 */

"use client";

import * as React from "react";

type CTAButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  disabled?: boolean;
  className?: string;
};

const variantMap = {
  primary: "bg-lux-emerald text-lux-black hover:bg-lux-gold transition-colors duration-300",
  secondary: "bg-lux-gold text-lux-black hover:bg-lux-emerald transition-colors duration-300",
  ghost: "bg-transparent text-lux-white border-2 border-lux-white hover:bg-lux-white hover:text-lux-black transition-all duration-300",
};

const sizeMap = {
  sm: "px-6 py-2 text-sm",
  md: "px-8 py-3 text-base",
  lg: "px-12 py-4 text-lg",
};

export function LuxGridCTAButton({
  children,
  onClick,
  variant = "primary",
  size = "md",
  fullWidth = false,
  disabled = false,
  className = "",
}: CTAButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        font-sans font-bold tracking-[0.12em] uppercase
        ${variantMap[variant]}
        ${sizeMap[size]}
        ${fullWidth ? "w-full" : ""}
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        ${className}
      `}
      style={{ letterSpacing: "0.12em" }}
    >
      {children}
    </button>
  );
}

export default LuxGridCTAButton;
