"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

type TelemetryTileProps = {
  label: string;
  value: string | number;
  isPulsing?: boolean;
  isTicker?: boolean;
};

function TelemetryTile({ label, value, isPulsing = false, isTicker = false }: TelemetryTileProps) {
  const [displayValue, setDisplayValue] = useState(isTicker && typeof value === "number" ? 0 : value);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    if (isTicker && typeof value === "number") {
      const target = value;
      const duration = 2000;
      const steps = 60;
      const increment = target / steps;
      let current = 0;

      const interval = setInterval(() => {
        current += increment;
        if (current >= target) {
          setDisplayValue(target);
          clearInterval(interval);
        } else {
          setDisplayValue(Math.floor(current));
        }
      }, duration / steps);

      return () => clearInterval(interval);
    }
  }, [isTicker, value]);

  const formattedValue =
    isTicker && typeof displayValue === "number" ? displayValue.toLocaleString() : String(value);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="group relative rounded-xl border border-noid-silver/20 bg-noid-black p-6"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="mb-2 font-mono text-[0.625rem] uppercase tracking-[0.16em] text-noid-silver/70">
            {label}
          </div>
          <div className="font-mono text-base tracking-[0.08em] text-white/90">{formattedValue}</div>
        </div>
        {isPulsing && (
          <div className="relative flex h-2 w-2 items-center justify-center">
            <motion.div
              className="absolute h-2 w-2 rounded-full bg-green-500"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
            <div className="absolute h-2 w-2 rounded-full bg-green-500" />
          </div>
        )}
      </div>

      {showTooltip && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded border border-noid-silver/30 bg-noid-black px-2 py-1 font-mono text-[0.625rem] uppercase tracking-[0.12em] text-noid-silver/80"
        >
          LOCKED
        </motion.div>
      )}

      <div className="pointer-events-none absolute inset-0 cursor-not-allowed rounded-xl" />
    </motion.div>
  );
}

export default function TelemetryDeck() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-6 text-center">
        <h2 className="font-mono text-[0.72rem] uppercase tracking-[0.16em] text-noid-silver/70">
          Telemetry Deck
        </h2>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <TelemetryTile label="VOICE SYNTHESIS" value="ACTIVE" isPulsing />
        <TelemetryTile label="GLOBAL EXECUTIVES" value="128" />
        <TelemetryTile label="AUTOMATIONS" value={2841} isTicker />
      </div>
    </section>
  );
}

