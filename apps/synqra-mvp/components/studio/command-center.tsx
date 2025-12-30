"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useCouncilDispatch } from "@/hooks/use-council-dispatch";
import CouncilMonitor from "@/components/studio/council-monitor";

type StudioCommandCenterProps = {
  onInitialized?: (requestId: string, input: string) => void;
};

export default function StudioCommandCenter({ onInitialized }: StudioCommandCenterProps) {
  const [code, setCode] = useState("");
  const [touched, setTouched] = useState(false);
  const [showSystemUnreachable, setShowSystemUnreachable] = useState(false);
  const { status, verdict, error, initializeProtocol, reset } = useCouncilDispatch();

  const isValid = code.trim().length > 0;

  // Show toast for SYSTEM_UNREACHABLE
  useEffect(() => {
    if (status === "error" && error === "SYSTEM UNREACHABLE") {
      setShowSystemUnreachable(true);
      const timer = setTimeout(() => setShowSystemUnreachable(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, status]);

  const handleInitialize = async () => {
    if (!isValid) {
      setTouched(true);
      return;
    }

    setTouched(true);
    reset();

    const result = await initializeProtocol(code.trim());

    if (result.requestId) {
      localStorage.setItem("synqra_request_id", result.requestId);
      localStorage.setItem("synqra_input", code.trim());
      onInitialized?.(result.requestId, code.trim());
    }
  };

  const getButtonText = () => {
    switch (status) {
      case "governance":
        return "ANALYZING...";
      case "analysis":
        return "CONVENING COUNCIL...";
      case "done":
        return "VERDICT RECEIVED";
      case "error":
        return error === "SYSTEM UNREACHABLE" ? "SYSTEM UNREACHABLE" : "RETRY";
      default:
        return "INITIALIZE";
    }
  };

  const isProcessing = status === "governance" || status === "analysis";

  return (
    <div className="space-y-6">
      {showSystemUnreachable && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="rounded-lg border border-red-500/50 bg-red-500/10 p-4"
        >
          <div className="font-mono text-sm uppercase tracking-wider text-red-500">SYSTEM UNREACHABLE</div>
          <div className="mt-1 text-xs text-red-400/80">{error || "Unable to reach council system"}</div>
        </motion.div>
      )}

      <div className="relative overflow-hidden rounded-xl border border-noid-silver/20 bg-noid-black/60 backdrop-blur-md">
        <div className="relative p-6">
          <div className="mb-6">
            <div className="font-mono text-[0.72rem] uppercase tracking-[0.16em] text-noid-silver/70">
              Command Center
            </div>
            <div className="mt-2 text-sm text-white/70">Enter your prompt to initialize.</div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block font-mono text-[0.72rem] uppercase tracking-[0.16em] text-noid-silver/70">
                Input
              </label>
              <textarea
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  if (touched) reset();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && !isProcessing && isValid) {
                    handleInitialize();
                  }
                }}
                spellCheck={false}
                className="w-full rounded-lg border border-noid-silver/35 bg-noid-black/60 backdrop-blur-md px-4 py-3 font-mono text-sm tracking-[0.08em] text-white outline-none focus:ring-2 focus:ring-[var(--noid-teal)]"
                placeholder="Enter your prompt here..."
                rows={4}
                disabled={isProcessing}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="text-xs text-noid-silver/70">
                {isValid ? "Ready to initialize" : "Enter a prompt"}
              </div>

              <motion.button
                type="button"
                onClick={handleInitialize}
                disabled={isProcessing || !isValid}
                whileHover={!isProcessing && isValid ? { scale: 1.02 } : {}}
                whileTap={!isProcessing && isValid ? { scale: 0.98 } : {}}
                className="rounded-full bg-noid-gold px-6 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-noid-black transition-opacity hover:opacity-95 active:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--noid-teal)] disabled:opacity-50"
              >
                {getButtonText()}
              </motion.button>
            </div>

            {isProcessing && (
              <div className="mt-4 flex items-center gap-3 text-sm text-noid-silver/70">
                <div className="h-2 w-2 animate-pulse rounded-full bg-noid-gold"></div>
                <span className="font-mono text-xs uppercase tracking-wider">
                  {status === "governance" ? "Analyzing safety..." : "Convening council..."}
                </span>
              </div>
            )}

            {verdict && (
              <div className="mt-4">
                <CouncilMonitor verdict={verdict} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

