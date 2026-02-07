"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import StatusQ from "@/components/StatusQ";
import { useCouncilDispatch } from "@/hooks/use-council-dispatch";
import CouncilMonitor from "@/components/portal/council-monitor";

type CommandCenterProps = {
  initialCode?: string;
};

export default function CommandCenter({ initialCode = "" }: CommandCenterProps) {
  void initialCode;
  const [code, setCode] = useState("");
  const [touched, setTouched] = useState(false);
  const [showSystemUnreachable, setShowSystemUnreachable] = useState(false);
  const router = useRouter();
  const { status, verdict, error, initializeProtocol, reset } = useCouncilDispatch();

  const isValid = code.trim().length > 0;

  // Show restricted access toast for any error
  useEffect(() => {
    if (status === "error" && error) {
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
      router.push("/studio");
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
        return error === "Request Access" ? "Request Access" : "Restricted";
      default:
        return "Initialize";
    }
  };

  const isProcessing = status === "governance" || status === "analysis";

  return (
    <>
      <StatusQ
        status={
          isProcessing
            ? "generating"
            : status === "done"
            ? verdict?.approved
              ? "complete"
              : "error"
            : status === "error"
            ? "error"
            : "idle"
        }
        label={
          isProcessing
            ? "Processing"
            : status === "done"
            ? verdict?.approved
              ? "Approved"
              : "Rejected"
            : status === "error"
            ? verdict?.approved === false
              ? "Rejected"
              : "Unreachable"
            : "Idle"
        }
      />

      {showSystemUnreachable && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="mb-4 rounded-lg border border-red-500/50 bg-red-500/10 p-4"
        >
          <div className="font-mono text-sm uppercase tracking-wider text-red-400">
            {error === "Request Access"
              ? "Request Access"
              : "Component restricted. Internal validation in progress."}
          </div>
        </motion.div>
      )}

      <div className="relative overflow-hidden rounded-[32px] border border-noid-silver/35 bg-noid-black/35 backdrop-blur-xl">
        <div className="relative p-8 md:p-10">
          <div className="flex items-center justify-between gap-6">
            <div>
              <div className="font-mono text-[0.72rem] uppercase tracking-[0.16em] text-noid-silver/70">
                Command Center
              </div>
              <div className="mt-2 text-sm text-white/70">Enter barcode identity.</div>
            </div>

            {verdict ? (
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className={`font-mono text-[0.72rem] uppercase tracking-[0.18em] ${
                  verdict.approved ? "text-noid-gold" : "text-red-500"
                }`}
              >
                {verdict.approved ? "APPROVED" : "REJECTED"}
              </motion.div>
            ) : null}
          </div>

          <div className="mt-10 grid gap-4">
            <label className="font-mono text-[0.72rem] uppercase tracking-[0.16em] text-noid-silver/70">
              Identity Code
            </label>

            <input
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                if (touched) reset();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isProcessing && isValid) {
                  handleInitialize();
                }
              }}
              inputMode="text"
              spellCheck={false}
              autoCapitalize="characters"
              className="w-full rounded-2xl border border-noid-silver/35 bg-noid-black/60 backdrop-blur-md px-5 py-4 font-mono text-base tracking-[0.08em] text-white outline-none focus:ring-2 focus:ring-[var(--noid-teal)]"
              placeholder="______"
              disabled={isProcessing}
            />

            <div className="flex items-center justify-between gap-4">
              <div className="text-xs text-noid-silver/70">Format: A–Z / 0–9, 6–12 chars</div>

              <motion.button
                type="button"
                onClick={handleInitialize}
                disabled={isProcessing || !isValid}
                whileHover={!isProcessing && isValid ? { scale: 1.02 } : {}}
                whileTap={!isProcessing && isValid ? { scale: 0.98 } : {}}
                className="rounded-full bg-noid-gold px-6 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-noid-black transition-opacity hover:opacity-95 active:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--noid-teal)] disabled:opacity-50"
              >
                {getButtonText()}
              </motion.button>
            </div>

            {isProcessing ? (
              <div className="mt-10 overflow-hidden rounded-2xl border border-noid-silver/20">
                <div className="relative h-[160px]">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <img
                      src="/assets/synqra-q.svg"
                      width={48}
                      height={48}
                      alt=""
                      aria-hidden="true"
                      style={{ opacity: 0.9 }}
                    />
                  </div>
                </div>
              </div>
            ) : null}

            {verdict ? (
              <CouncilMonitor verdict={verdict} />
            ) : null}

            {touched && !isProcessing && status === "idle" ? (
              <div className="mt-4 font-mono text-[0.72rem] uppercase tracking-[0.16em] text-noid-silver/70">
                {isValid ? "Format valid." : "Format invalid."}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}

