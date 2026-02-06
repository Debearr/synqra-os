"use client";

import { useMemo } from "react";
import clsx from "clsx";

type Status = "idle" | "generating" | "complete" | "error";
type Placement = "bottom-right" | "bottom-left" | "top-right" | "top-left";

type StatusQProps = {
  status: Status;
  label?: string;
  className?: string;
  fixed?: boolean;
  placement?: Placement;
  size?: 16 | 20 | 24 | 28 | 32;
};

export function StatusQ({
  status,
  label,
  className,
  fixed = true,
  placement = "bottom-right",
  size = 24,
}: StatusQProps) {
  void status;
  const containerClasses = useMemo(() => {
    const pos = fixed
      ? {
          "bottom-right": "fixed bottom-6 right-6",
          "bottom-left": "fixed bottom-6 left-6",
          "top-right": "fixed top-6 right-6",
          "top-left": "fixed top-6 left-6",
        }[placement]
      : "";
    return clsx(
      "pointer-events-none select-none",
      "rounded-2xl border border-white/10 bg-noid-black",
      "px-3 py-2 flex items-center gap-3",
      pos,
      className
    );
  }, [placement, fixed, className]);

  return (
    <div className={containerClasses} aria-live="polite">
      <div className="relative h-10 w-10 shrink-0">
        {/* Texture layer: always mounted to avoid flicker; animated via translateY */}
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="h-[200%] w-full"
            style={{
              backgroundImage:
                // low-contrast texture: dark grey on black (no bg-position animation; translateY only)
                "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.015) 50%, rgba(255,255,255,0.06) 100%)",
              backgroundSize: "100% 64px",
              maskImage: "url(/assets/synqra-q.svg)",
              WebkitMaskImage: "url(/assets/synqra-q.svg)",
              maskRepeat: "no-repeat",
              WebkitMaskRepeat: "no-repeat",
              maskSize: "contain",
              WebkitMaskSize: "contain",
              maskPosition: "center",
              WebkitMaskPosition: "center",
              backgroundColor: "#0a0a0a",
            }}
          />
        </div>

        {/* Fixed Q silhouette */}
        <div className="absolute inset-0 flex items-center justify-center">
          <img
            src="/assets/synqra-q.svg"
            width={size}
            height={size}
            alt=""
            aria-hidden
            className="opacity-95"
            style={{ color: "#FFFFFF" }}
          />
        </div>
      </div>

      {label ? (
        <div className="flex flex-col leading-tight">
          <span className="text-xs font-mono uppercase tracking-[0.12em] text-noid-silver/70">
            Status
          </span>
          <span className="text-sm font-mono uppercase tracking-[0.12em] text-white">
            {label}
          </span>
        </div>
      ) : null}
    </div>
  );
}

export default StatusQ;

