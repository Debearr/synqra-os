"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

type CountdownTimerProps = {
  /** Duration in seconds */
  seconds: number;
  onDone?: () => void;
  label?: string;
};

function format(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

function WatchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden className="text-white/60">
      <path
        fill="currentColor"
        d="M8 2h8v4h-1.3l-.4 1.8a8 8 0 0 1 3.1 6.2 8 8 0 1 1-10.5-7.6L7.3 6H8V2Zm4 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12Zm-.8 2h1.6v4.2l2.8 1.6-.8 1.4-3.6-2.1V10Z"
      />
    </svg>
  );
}

function HourglassIcon() {
  return (
    <motion.svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      aria-hidden
      className="text-white/60"
      animate={{ rotate: [0, 0, 180, 180] }}
      transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
    >
      <path
        fill="currentColor"
        d="M6 2h12v2c0 2.8-2 4.7-4.1 6 2.1 1.3 4.1 3.2 4.1 6v2H6v-2c0-2.8 2-4.7 4.1-6C8 8.7 6 6.8 6 4V2Zm2 2c0 2.1 2 3.6 4 4.6 2-1 4-2.5 4-4.6H8Zm8 16c0-2.1-2-3.6-4-4.6-2 1-4 2.5-4 4.6h8Z"
      />
    </motion.svg>
  );
}

export default function CountdownTimer({ seconds, onDone, label }: CountdownTimerProps) {
  const [remaining, setRemaining] = useState(seconds);
  const endAt = useMemo(() => Date.now() + Math.max(0, seconds) * 1000, [seconds]);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const next = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      setRemaining(next);
      if (next <= 0) {
        onDone?.();
        return;
      }
      raf = window.setTimeout(tick, 250);
    };
    tick();
    return () => window.clearTimeout(raf);
  }, [endAt, onDone]);

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
      <WatchIcon />
      <HourglassIcon />
      <span className="rounded-full bg-white/5 px-2 py-0.5 font-mono text-[0.75rem] tracking-[0.14em] text-noid-silver/70">
        {format(remaining)}
      </span>
      {label ? (
        <span className="text-[0.7rem] uppercase tracking-[0.22em] text-white/45">{label}</span>
      ) : null}
    </div>
  );
}


