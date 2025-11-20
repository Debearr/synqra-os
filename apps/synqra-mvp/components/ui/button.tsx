import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
          {
            // Variants
            "bg-brand-teal text-noir hover:bg-brand-teal/90 shadow-lg hover:shadow-xl":
              variant === "primary",
            "bg-brand-gold text-noir hover:bg-brand-gold/90":
              variant === "secondary",
            "bg-white/5 text-brand-fg hover:bg-white/10 border border-white/10":
              variant === "outline",
            "bg-transparent text-brand-fg hover:bg-white/5":
              variant === "ghost",
            // Sizes
            "px-4 py-2 text-sm": size === "sm",
            "px-6 py-3 text-base": size === "md",
            "px-8 py-4 text-lg": size === "lg",
          },
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
