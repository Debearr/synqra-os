import * as React from "react";
import { cn } from "@/lib/utils";

export type SpinnerProps = React.HTMLAttributes<HTMLDivElement> & {
  size?: number;
};

export function Spinner({ className, size = 18, ...props }: SpinnerProps) {
  const dimension = `${size}px`;
  return (
    <div
      className={cn("inline-block animate-spin", className)}
      style={{ width: dimension, height: dimension }}
      role="status"
      aria-label="Loading"
      {...props}
    >
      <svg viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.2" strokeWidth="4" />
        <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="4" />
      </svg>
    </div>
  );
}

export default Spinner;
