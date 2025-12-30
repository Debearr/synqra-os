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
      className="relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-full border border-noid-silver/60 bg-noid-gold px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-noid-black shadow-gold-glow outline-none transition-colors duration-200 disabled:cursor-not-allowed disabled:border-noid-silver/30 disabled:bg-white/10 disabled:text-white/70"
    >
      <motion.span
        animate={
          isProcessing
            ? {
                scale: [1, 1.025, 1],
                boxShadow: "none",
              }
            : { scale: 1, boxShadow: "none" }
        }
        transition={
          isProcessing
            ? { duration: 1.1, repeat: Infinity, ease: "easeInOut" }
            : { duration: 0.2 }
        }
        className="relative flex items-center gap-2"
      >
        <span className="text-[0.78rem] tracking-[0.28em] text-noid-black/90">
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
