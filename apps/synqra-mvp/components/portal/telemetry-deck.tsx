"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

type TelemetryTileProps = {
  label: string;
  value: string | number;
};

function TelemetryTile({ label, value }: TelemetryTileProps) {
  const formattedValue = typeof value === "number" ? value.toLocaleString() : String(value);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="rounded-xl border border-noid-silver/20 bg-noid-black p-6"
    >
      <div className="mb-2 font-mono text-[0.625rem] uppercase tracking-[0.16em] text-noid-silver/70">
        {label}
      </div>
      <div className="font-mono text-base tracking-[0.08em] text-white/90">{formattedValue}</div>
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
        <TelemetryTile label="VOICE SYNTHESIS" value="ACTIVE" />
        <TelemetryTile label="GLOBAL EXECUTIVES" value={128} />
        <TelemetryTile label="AUTOMATIONS" value={2841} />
      </div>
    </section>
  );
}

