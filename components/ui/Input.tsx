import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id || React.useId();
    const describedBy = error ? `${inputId}-error` : undefined;

    return (
      <div className="w-full">
        {label ? (
          <label htmlFor={inputId} className="block text-sm mb-1">
            {label}
          </label>
        ) : null}
        <input
          id={inputId}
          ref={ref}
          className={cn(
            "w-full rounded-md bg-black/30 border border-white/10 px-3 py-2 outline-none focus:border-gold",
            className
          )}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={describedBy}
          {...props}
        />
        {error ? (
          <p id={describedBy} className="mt-1 text-xs text-red-400">
            {error}
          </p>
        ) : null}
      </div>
    );
  }
);
Input.displayName = "Input";

export default Input;
