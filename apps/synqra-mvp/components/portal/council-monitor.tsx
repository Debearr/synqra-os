"use client";

import { motion } from "framer-motion";
import type { CouncilVerdict } from "@/hooks/use-council-dispatch";

interface CouncilMonitorProps {
  verdict: CouncilVerdict;
}

export default function CouncilMonitor({ verdict }: CouncilMonitorProps) {
  const verdictTone = verdict.approved ? "text-noid-gold" : "text-red-500";
  const riskTone = verdict.approved ? "text-noid-gold" : "text-yellow-400";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6 overflow-hidden rounded-2xl border border-noid-silver/20 bg-noid-black/60 backdrop-blur-md"
    >
      <div className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="font-mono text-[0.72rem] uppercase tracking-[0.16em] text-noid-silver/70">
            Council Verdict
          </div>
          <div className={`font-mono text-[0.72rem] uppercase tracking-[0.18em] ${verdictTone}`}>
            {verdict.approved ? "APPROVED" : "REJECTED"}
          </div>
        </div>

        <div className="mb-4 flex items-center gap-4">
          <div className="font-mono text-[0.72rem] uppercase tracking-[0.16em] text-noid-silver/70">Risk Level:</div>
          <div className={`font-mono text-xs uppercase tracking-[0.18em] ${riskTone}`}>{verdict.risk}</div>
        </div>

        <div className="rounded-lg border border-noid-silver/10 bg-noid-black/40 p-4">
          <div className="mb-2 font-mono text-[0.72rem] uppercase tracking-[0.16em] text-noid-silver/70">
            Consensus
          </div>
          <div className="text-sm leading-relaxed text-white/90">{verdict.consensus}</div>
        </div>
      </div>
    </motion.div>
  );
}
