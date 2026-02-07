"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@supabase/supabase-js";

type TradingMode = "personal" | "prop_firm";
type Phase = "evaluation" | "funded";
type RiskProfile = 0.5 | 1.0;

interface PilotOnboardingProps {
  isOpen: boolean;
  onComplete: () => void;
}

export default function PilotOnboarding({ isOpen, onComplete }: PilotOnboardingProps) {
  const [tradingMode, setTradingMode] = useState<TradingMode | "">("");
  const [phase, setPhase] = useState<Phase | "">("");
  const [accountSize, setAccountSize] = useState("");
  const [riskProfile, setRiskProfile] = useState<RiskProfile | 0>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!tradingMode || !phase || !accountSize || !riskProfile) {
      setError("All fields are required");
      return;
    }

    const accountSizeNum = parseFloat(accountSize);
    if (isNaN(accountSizeNum) || accountSizeNum <= 0) {
      setError("Account size must be a positive number");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!supabaseUrl || !supabaseKey) {
        throw new Error("Supabase not configured");
      }

      const supabase = createClient(supabaseUrl, supabaseKey);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          ...user.user_metadata,
          trading_mode: tradingMode,
          phase,
          account_size: accountSizeNum,
          risk_profile: riskProfile,
          pilot_status: "active",
        },
      });

      if (updateError) {
        throw updateError;
      }

      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save configuration");
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-noid-black/90 backdrop-blur-sm"
        >
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="relative mx-4 w-full max-w-md rounded-[32px] border border-noid-silver/35 bg-noid-black p-8 backdrop-blur-xl"
          >
            <h2 className="mb-6 font-mono text-lg uppercase tracking-[0.16em] text-white">
              Pilot Configuration
            </h2>

            {error && (
              <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3">
                <p className="font-mono text-xs text-red-400">{error}</p>
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label className="mb-2 block font-mono text-xs uppercase tracking-[0.16em] text-noid-silver/70">
                  Trading Mode
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTradingMode("personal")}
                    className={`rounded-xl border px-4 py-3 font-mono text-xs uppercase tracking-[0.12em] transition-colors ${
                      tradingMode === "personal"
                        ? "border-noid-gold bg-noid-gold/20 text-noid-gold"
                        : "border-noid-silver/30 bg-noid-black/60 text-noid-silver/70 hover:border-noid-silver/50"
                    }`}
                    disabled={isSubmitting}
                  >
                    Personal
                  </button>
                  <button
                    type="button"
                    onClick={() => setTradingMode("prop_firm")}
                    className={`rounded-xl border px-4 py-3 font-mono text-xs uppercase tracking-[0.12em] transition-colors ${
                      tradingMode === "prop_firm"
                        ? "border-noid-gold bg-noid-gold/20 text-noid-gold"
                        : "border-noid-silver/30 bg-noid-black/60 text-noid-silver/70 hover:border-noid-silver/50"
                    }`}
                    disabled={isSubmitting}
                  >
                    Prop Firm
                  </button>
                </div>
              </div>

              {tradingMode === "prop_firm" && (
                <div>
                  <label className="mb-2 block font-mono text-xs uppercase tracking-[0.16em] text-noid-silver/70">
                    Phase
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPhase("evaluation")}
                      className={`rounded-xl border px-4 py-3 font-mono text-xs uppercase tracking-[0.12em] transition-colors ${
                        phase === "evaluation"
                          ? "border-noid-gold bg-noid-gold/20 text-noid-gold"
                          : "border-noid-silver/30 bg-noid-black/60 text-noid-silver/70 hover:border-noid-silver/50"
                      }`}
                      disabled={isSubmitting}
                    >
                      Evaluation
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhase("funded")}
                      className={`rounded-xl border px-4 py-3 font-mono text-xs uppercase tracking-[0.12em] transition-colors ${
                        phase === "funded"
                          ? "border-noid-gold bg-noid-gold/20 text-noid-gold"
                          : "border-noid-silver/30 bg-noid-black/60 text-noid-silver/70 hover:border-noid-silver/50"
                      }`}
                      disabled={isSubmitting}
                    >
                      Funded
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="mb-2 block font-mono text-xs uppercase tracking-[0.16em] text-noid-silver/70">
                  Account Size
                </label>
                <input
                  type="number"
                  value={accountSize}
                  onChange={(e) => setAccountSize(e.target.value)}
                  className="w-full rounded-xl border border-noid-silver/35 bg-noid-black/60 px-4 py-3 font-mono text-sm text-white outline-none focus:ring-2 focus:ring-[var(--noid-teal)]"
                  placeholder="e.g., 10000"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="mb-2 block font-mono text-xs uppercase tracking-[0.16em] text-noid-silver/70">
                  Risk Profile
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRiskProfile(0.5)}
                    className={`rounded-xl border px-4 py-3 font-mono text-xs uppercase tracking-[0.12em] transition-colors ${
                      riskProfile === 0.5
                        ? "border-noid-gold bg-noid-gold/20 text-noid-gold"
                        : "border-noid-silver/30 bg-noid-black/60 text-noid-silver/70 hover:border-noid-silver/50"
                    }`}
                    disabled={isSubmitting}
                  >
                    0.5%
                  </button>
                  <button
                    type="button"
                    onClick={() => setRiskProfile(1.0)}
                    className={`rounded-xl border px-4 py-3 font-mono text-xs uppercase tracking-[0.12em] transition-colors ${
                      riskProfile === 1.0
                        ? "border-noid-gold bg-noid-gold/20 text-noid-gold"
                        : "border-noid-silver/30 bg-noid-black/60 text-noid-silver/70 hover:border-noid-silver/50"
                    }`}
                    disabled={isSubmitting}
                  >
                    1.0%
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full rounded-full bg-noid-gold px-6 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-noid-black transition-opacity hover:opacity-95 disabled:opacity-50"
              >
                {isSubmitting ? "Saving..." : "Complete Setup"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

