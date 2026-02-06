"use client";

import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import type { CouncilVerdict } from "@/hooks/use-council-dispatch";

interface CouncilMonitorProps {
  verdict: CouncilVerdict | null;
  // Support for raw API response structure
  response?: {
    success?: boolean;
    data?: unknown;
    message?: string;
    meta?: {
      discipline?: string;
    };
  } | null;
}

export default function CouncilMonitor({ verdict, response }: CouncilMonitorProps) {
  // Check for discipline state in raw response first
  if (response?.success === true && response?.data === null && response?.meta?.discipline === "active") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-amber-500/30 bg-amber-900/10 p-6"
        style={{ animation: "pulse-slow 3s ease-in-out infinite" }}
      >
        <div className="flex items-start gap-4">
          <ShieldCheck className="w-8 h-8 text-amber-400 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="text-amber-100 font-mono tracking-widest text-sm mb-2">
              PROTOCOL ACTIVE
            </h3>
            <p className="text-amber-400/80 mt-2 text-lg">
              {response.message || "MARKET SCAN COMPLETE. PRESERVING CAPITAL."}
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  if (!verdict) return null;

  // DISCIPLINE STATUS — NO ASSESSMENT / PRESERVE CAPITAL (legacy check)
  if ("message" in verdict && !("data" in verdict)) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-amber-500/30 bg-amber-900/10 p-6"
        style={{ animation: "pulse-slow 3s ease-in-out infinite" }}
      >
        <div className="flex items-start gap-4">
          <ShieldCheck className="w-8 h-8 text-amber-400 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="text-amber-100 font-mono tracking-widest text-sm mb-2">
              PROTOCOL ACTIVE
            </h3>
            <p className="text-amber-400/80 mt-2 text-lg">
              {String(verdict.message)}
            </p>
          </div>
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
