"use client";

import { motion } from "framer-motion";

type GenerateButtonProps = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  isProcessing?: boolean;
};

const hoverTransition = { duration: 0.15, ease: "easeOut" };

const GenerateButton = ({ label, onClick, disabled = false, isProcessing = false }: GenerateButtonProps) => {
  return (
    <motion.button
      type="button"
      whileHover={!disabled ? { translateY: -2, scale: 1.01 } : undefined}
      whileTap={!disabled ? { scale: 0.99 } : undefined}
      transition={hoverTransition}
      onClick={onClick}
      disabled={disabled}
      className="relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-full border border-white/15 bg-indigo/90 px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white shadow-[0_12px_40px_rgba(75,82,255,0.35)] outline-none transition-colors duration-200 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/10"
    >
      <motion.span
        animate={
          isProcessing
            ? {
                scale: [1, 1.025, 1],
                boxShadow: [
                  "0 0 0 rgba(75,82,255,0)",
                  "0 0 30px rgba(75,82,255,0.6)",
                  "0 0 0 rgba(75,82,255,0)",
                ],
              }
            : { scale: 1, boxShadow: "0 0 0 rgba(75,82,255,0)" }
        }
        transition={
          isProcessing
            ? { duration: 1.1, repeat: Infinity, ease: "easeInOut" }
            : { duration: 0.2 }
        }
        className="relative flex items-center gap-2"
      >
        <span className="text-[0.78rem] tracking-[0.28em] text-white/90">
          {isProcessing ? "Crafting" : label}
        </span>
        {isProcessing && (
          <span className="h-2 w-2 animate-ping rounded-full bg-white/80" aria-hidden />
        )}
      </motion.span>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-white/5 opacity-60" />
    </motion.button>
  );
};

export default GenerateButton;
