"use client";

import { motion } from "framer-motion";
import type { CouncilVerdict } from "@/hooks/use-council-dispatch";

interface CouncilMonitorProps {
  verdict: CouncilVerdict;
}

export default function CouncilMonitor({ verdict }: CouncilMonitorProps) {
  const tone = verdict.approved ? "text-noid-gold" : "text-red-500";
  const badgeStyles = verdict.approved
    ? "border-noid-gold/30 bg-noid-gold/10 text-noid-gold"
    : "border-red-500/30 bg-red-500/10 text-red-400";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-2xl border border-white/5 bg-noid-black/70 backdrop-blur-xl"
    >
      <div className="grid gap-4 p-5 md:p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="font-mono text-[0.78rem] uppercase tracking-[0.16em] text-noid-silver/70">
            Council Verdict
          </div>
          <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${badgeStyles}`}>
            {verdict.approved ? "Approved" : "Rejected"}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/5 bg-white/5 px-4 py-3">
          <span className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-noid-silver/70">Risk</span>
          <span className={`font-mono text-xs uppercase tracking-[0.2em] ${tone}`}>{verdict.risk}</span>
        </div>

        <div className="rounded-xl border border-white/5 bg-noid-black/70 p-4 shadow-inner shadow-noid-black/40">
          <div className="mb-2 font-mono text-[0.7rem] uppercase tracking-[0.16em] text-noid-silver/70">
            Consensus
          </div>
          <p className="text-sm leading-relaxed text-white/85">{verdict.consensus || "Council silent"}</p>
        </div>
      </div>
    </motion.div>
  );
}
