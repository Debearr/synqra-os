import * as React from "react";
import { cn } from "@/lib/utils";

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "success" | "warning" | "danger";
};

const variants: Record<NonNullable<BadgeProps["variant"]>, string> = {
  default: "bg-deep-charcoal text-silver-mist border border-white/10",
  success: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
  warning: "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30",
  danger: "bg-red-500/20 text-red-300 border border-red-500/30",
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

export default Badge;
