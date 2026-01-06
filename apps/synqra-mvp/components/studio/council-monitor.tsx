"use client";

import { motion } from "framer-motion";
import type { CouncilVerdict } from "@/hooks/use-council-dispatch";

interface CouncilMonitorProps {
  verdict: CouncilVerdict | null;
}

export default function CouncilMonitor({ verdict }: CouncilMonitorProps) {
  if (!verdict) return null;

  // DISCIPLINE STATUS — NO TRADE / PRESERVE CAPITAL
if ("message" in verdict && !("data" in verdict)) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-900/30 to-black p-6 shadow-xl"
      >
        <div className="flex items-center gap-3">
          <div className="h-3 w-3 rounded-full bg-amber-400 animate-pulse" />
          <h3 className="text-amber-300 font-semibold tracking-wide">
            DISCIPLINE MODE ACTIVE
          </h3>
        </div>

        <p className="mt-4 text-amber-200 text-lg">
          {String(verdict.message)}
        </p>

        <div className="mt-4 text-xs uppercase tracking-widest text-amber-500">
          Capital preserved · No action required
        </div>
      </motion.div>
    );
  }

  // FALLBACK — EXISTING RENDER PATH
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/10 bg-black/70 p-6"
    >
      <pre className="text-sm text-gray-300 whitespace-pre-wrap">
        {JSON.stringify(verdict, null, 2)}
      </pre>
    </motion.div>
  );
}
