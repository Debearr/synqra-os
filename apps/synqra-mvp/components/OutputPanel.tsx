"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

type OutputPanelProps = {
  draft: string | null;
  isVisible: boolean;
  onNewRequest: () => void;
  refineTemplate?: string;
  previousDraft?: string | null;
  dimmed?: boolean;
};

const slideVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 16 },
};

const OutputPanel = ({ draft, isVisible, onNewRequest, refineTemplate, previousDraft, dimmed = false }: OutputPanelProps) => {
  const [copied, setCopied] = useState(false);
  const [flashKey, setFlashKey] = useState(0);
  const [copyPulse, setCopyPulse] = useState(0);

  const handleCopy = async () => {
    if (!draft) return;
    try {
      await navigator.clipboard.writeText(draft);
      setCopied(true);
      setFlashKey((prev) => prev + 1);
      setCopyPulse((prev) => prev + 1);
    } catch {
      setCopied(false);
      setFlashKey(0);
    }
  };

  const copyLabel = copied ? "Copied ✓" : "Copy";

  return (
    <AnimatePresence>
      {isVisible && draft && (
        <motion.section
          key="output"
          variants={slideVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ duration: 0.25, ease: "easeOut" }}
          className={`relative overflow-hidden rounded-3xl border border-white/12 bg-white/6 p-6 shadow-[0_24px_60px_rgba(10,10,10,0.65)] backdrop-blur transition-opacity duration-200 ${dimmed ? "opacity-80" : "opacity-100"}`}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg tracking-[0.22em] text-white/80">Perfect Draft</h2>
            <button
              type="button"
              onClick={handleCopy}
              className="rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-white/80 transition-colors duration-200 hover:border-indigo hover:bg-indigo/30"
            >
              <motion.span
                key={copyPulse}
                initial={{ opacity: 0.6, y: -2 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                onAnimationComplete={() => {
                  if (copied) setCopied(false);
                }}
              >
                {copyLabel}
              </motion.span>
            </button>
          </div>

          <div className="space-y-4 text-sm leading-relaxed text-white/85">
            <pre className="whitespace-pre-wrap font-sans text-[0.95rem] text-white/90">{draft}</pre>
            {previousDraft && (
              <div className="rounded-2xl border border-white/8 bg-black/25 p-4 text-xs text-white/60">
                <span className="block pb-1 font-semibold uppercase tracking-[0.24em] text-white/40">Previous Draft</span>
                <pre className="whitespace-pre-wrap font-sans text-[0.86rem] leading-relaxed text-white/55">
                  {previousDraft}
                </pre>
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <motion.button
              type="button"
              onClick={onNewRequest}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              transition={{ duration: 0.12 }}
              className="rounded-full border border-white/12 bg-white/8 px-6 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/85 transition-colors duration-200 hover:border-indigo hover:bg-indigo/20"
            >
              New Request
            </motion.button>
            {refineTemplate && (
              <p className="text-xs uppercase tracking-[0.28em] text-white/40">
                {refineTemplate}
              </p>
            )}
          </div>

          <AnimatePresence>
            {flashKey > 0 && (
              <motion.div
                key={`flash-${flashKey}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.45 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onAnimationComplete={() => setFlashKey(0)}
                className="pointer-events-none absolute inset-0 bg-indigo/60 mix-blend-screen"
              />
            )}
          </AnimatePresence>
          <a
            href="https://synqra.co"
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-4 right-4 text-[0.6rem] uppercase tracking-[0.3em] text-white/35 hover:text-white/60"
          >
            Synqra
          </a>
        </motion.section>
      )}
    </AnimatePresence>
  );
};

export default OutputPanel;
