"use client";

import { motion } from "framer-motion";

export type VerificationStep = 0 | 1 | 2;

type GenerationStatusProps = {
  step: VerificationStep;
  isActive: boolean;
};

const STEPS = ["Analyzing Intent…", "Triangulating Context…", "Polishing Semantics…"] as const;

export default function GenerationStatus({ step, isActive }: GenerationStatusProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {STEPS.map((_, idx) => {
            const active = isActive && idx === step;
            const done = isActive && idx < step;
            return (
              <div
                key={idx}
                className={`h-1.5 w-10 rounded-full ${
                  done ? "bg-noid-gold/70" : active ? "bg-noid-silver/35" : "bg-white/10"
                }`}
                aria-hidden
              />
            );
          })}
        </div>
        <motion.div
          initial={false}
          animate={{ opacity: isActive ? 1 : 0.55 }}
          transition={{ duration: 0.15 }}
          className="truncate font-mono text-[0.72rem] tracking-[0.14em] text-noid-silver/70"
        >
          {STEPS[step]}
        </motion.div>
      </div>
    </div>
  );
}


