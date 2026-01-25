"use client";

import { useEffect, useMemo } from "react";
import { motion, useAnimationControls, useMotionValue } from "framer-motion";
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

const TEXTURE_HEIGHT = 64; // used for deterministic looping / snap-to-rest

export function StatusQ({
  status,
  label,
  className,
  fixed = true,
  placement = "bottom-right",
  size = 24,
}: StatusQProps) {
  // Motion values for the texture translateY (only moving layer)
  const y = useMotionValue(0);
  const controls = useAnimationControls();

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
      "rounded-2xl border border-noid-silver/20 bg-noid-black/80 backdrop-blur",
      "px-3 py-2 flex items-center gap-3 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]",
      pos,
      className
    );
  }, [placement, fixed, className]);

  // Interruptible motion: stop any in-flight animation whenever status changes
  useEffect(() => {
    controls.stop();

    // Determine target motion based on status
    if (status === "idle") {
      controls.start({
        y: [0, -4, 0],
        transition: {
          // slow drift; "spring" feel without timers; interruptible via controls.stop()
          duration: 8,
          ease: "easeInOut",
          repeat: Infinity,
        },
      });
    } else if (status === "generating") {
      // Continuous vertical motion, seamless by looping over texture height
      controls.start({
        y: [0, -TEXTURE_HEIGHT],
        transition: {
          duration: 2,
          ease: "linear",
          repeat: Infinity,
          repeatType: "loop",
        },
      });
    } else if (status === "complete") {
      // Snap to nearest rest position and freeze
      const current = y.get();
      const snapped = Math.round(current / TEXTURE_HEIGHT) * TEXTURE_HEIGHT;
      controls.start({
        y: snapped,
        transition: { type: "spring", stiffness: 420, damping: 38, mass: 0.7 },
      });
    } else if (status === "error") {
      // Snap with subtle negative offset then freeze
      const current = y.get();
      const snapped = Math.round(current / TEXTURE_HEIGHT) * TEXTURE_HEIGHT - 4;
      controls.start({
        y: snapped,
        transition: { type: "spring", stiffness: 420, damping: 40, mass: 0.75 },
      });
    }
  }, [status, controls, y]);

  return (
    <div className={containerClasses} aria-live="polite">
      <div className="relative h-10 w-10 shrink-0">
        {/* Texture layer: always mounted to avoid flicker; animated via translateY */}
        <motion.div
          className="absolute inset-0 overflow-hidden"
          animate={controls}
          style={{ y }}
        >
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
        </motion.div>

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
          <span className="text-[11px] font-mono uppercase tracking-[0.18em] text-noid-silver/70">
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

