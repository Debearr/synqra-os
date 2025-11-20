import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "warning" | "secondary";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide",
        {
          "bg-brand-teal/20 text-brand-teal": variant === "default",
          "bg-green-500/20 text-green-400": variant === "success",
          "bg-brand-gold/20 text-brand-gold": variant === "warning",
          "bg-white/10 text-brand-fg": variant === "secondary",
        },
        className
      )}
      {...props}
    />
  );
}

export { Badge };
