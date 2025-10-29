"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
};

const sizeClasses: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-base",
  lg: "px-6 py-3 text-lg",
};

const base =
  "inline-flex items-center justify-center rounded-md transition-transform duration-300 active:scale-95 disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "bg-gradient-to-br from-[var(--noid-gold)] to-[var(--noid-rose-gold)] text-black hover:glow-gold",
  secondary:
    "bg-deep-charcoal text-silver-mist border border-[var(--noid-teal-neon)]/50 hover:glow-teal",
  ghost: "bg-transparent text-silver-mist hover:bg-white/5",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading = false, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizeClasses[size], className)}
        aria-busy={loading || undefined}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export default Button;
