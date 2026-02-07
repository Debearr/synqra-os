"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";

type Feature = {
  key: string;
  label: string;
  detail: string;
};

type PremiumFeaturesProps = {
  /** When true, hide ghost features entirely (no regressions for premium). */
  enabled: boolean;
};

export default function PremiumFeatures({ enabled }: PremiumFeaturesProps) {
  const [openKey, setOpenKey] = useState<string | null>(null);

  const features = useMemo<Feature[]>(
    () => [
      { key: "voice", label: "Voice Lock", detail: "Use your saved voice profile." },
      { key: "grounding", label: "Grounding", detail: "Triangulated context sources." },
      { key: "verification", label: "Verification", detail: "Export a step-by-step proof log." },
    ],
    []
  );

  if (enabled) return null;

  const active = features.find((f) => f.key === openKey) || null;

  return (
    <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.02] p-5">
      <div className="flex flex-wrap gap-2">
        {features.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setOpenKey(f.key)}
            className="group inline-flex items-center gap-2 rounded-full border border-white/12 bg-black/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/65 transition-colors hover:border-noid-silver/60 hover:text-white/80"
          >
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/10 bg-white/[0.02] text-[0.65rem] text-white/50">
              ⊘
            </span>
            {f.label}
          </button>
        ))}
      </div>

      <AnimatePresence>
        {active && (
          <motion.div
            key="modal"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="mt-4 rounded-2xl border border-white/10 bg-black/40 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-[0.32em] text-noid-silver">{active.label}</div>
                <div className="mt-2 text-sm text-white/75">{active.detail}</div>
                <div className="mt-2 font-mono text-[0.72rem] tracking-[0.14em] text-white/45">
                  Premium only.
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <a
                  href="/waitlist"
                  className="rounded-full border border-noid-silver/50 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/75 transition-colors hover:border-noid-silver"
                >
                  Request Access
                </a>
                <button
                  type="button"
                  onClick={() => setOpenKey(null)}
                  className="rounded-full border border-white/10 bg-white/[0.02] px-3 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/55 transition-colors hover:text-white/75"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


