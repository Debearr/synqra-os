"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@supabase/supabase-js";

type CalibrationModalProps = {
  isOpen: boolean;
  onComplete: () => void;
};

const INDUSTRIES = ["Finance", "Real Estate", "SaaS", "Agency", "Strategy"];

export default function CalibrationModal({ isOpen, onComplete }: CalibrationModalProps) {
  const [industry, setIndustry] = useState("");
  const [role, setRole] = useState("");
  const [goal, setGoal] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!industry || !role.trim() || !goal.trim()) {
      setError("All fields are required");
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
          industry,
          role: role.trim(),
          goal: goal.trim(),
        },
      });

      if (updateError) {
        throw updateError;
      }

      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save calibration");
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
              Pilot Calibration
            </h2>

            {error && (
              <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3">
                <p className="font-mono text-xs text-red-400">{error}</p>
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label className="mb-2 block font-mono text-xs uppercase tracking-[0.16em] text-noid-silver/70">
                  Industry
                </label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full rounded-xl border border-noid-silver/35 bg-noid-black/60 px-4 py-3 font-mono text-sm text-white outline-none focus:ring-2 focus:ring-[var(--noid-teal)]"
                  disabled={isSubmitting}
                >
                  <option value="">Select industry</option>
                  {INDUSTRIES.map((ind) => (
                    <option key={ind} value={ind}>
                      {ind}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block font-mono text-xs uppercase tracking-[0.16em] text-noid-silver/70">
                  Role
                </label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full rounded-xl border border-noid-silver/35 bg-noid-black/60 px-4 py-3 font-mono text-sm text-white outline-none focus:ring-2 focus:ring-[var(--noid-teal)]"
                  placeholder="e.g., CEO, VP Marketing"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="mb-2 block font-mono text-xs uppercase tracking-[0.16em] text-noid-silver/70">
                  Primary Goal
                </label>
                <input
                  type="text"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="w-full rounded-xl border border-noid-silver/35 bg-noid-black/60 px-4 py-3 font-mono text-sm text-white outline-none focus:ring-2 focus:ring-[var(--noid-teal)]"
                  placeholder="e.g., Scale revenue, Improve retention"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="mt-8 flex gap-4">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 rounded-full bg-noid-gold px-6 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-noid-black transition-opacity hover:opacity-95 disabled:opacity-50"
              >
                {isSubmitting ? "Saving..." : "Complete"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

