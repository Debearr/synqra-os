"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

type OutputPanelProps = {
  draft: string | null;
  isVisible: boolean;
  onNewRequest: () => void;
  generationSeconds?: number | null;
  refineTemplate?: string;
  previousDraft?: string | null;
  dimmed?: boolean;
};

const slideVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 16 },
};

const OutputPanel = ({
  draft,
  isVisible,
  onNewRequest,
  generationSeconds = null,
  refineTemplate,
  previousDraft,
  dimmed = false,
}: OutputPanelProps) => {
  const [copied, setCopied] = useState(false);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 600);
    return () => clearTimeout(timer);
  }, [copied]);

  useEffect(() => {
    if (!flash) return;
    const timer = setTimeout(() => setFlash(false), 220);
    return () => clearTimeout(timer);
  }, [flash]);

  const handleCopy = async () => {
    if (!draft) return;
    try {
      await navigator.clipboard.writeText(draft);
      setCopied(true);
      setFlash(true);
    } catch {
      setCopied(false);
      setFlash(false);
    }
  };

  const copyLabel = copied ? "Copied ✓" : "Copy";
  const generationLabel =
    typeof generationSeconds === "number" && Number.isFinite(generationSeconds)
      ? `${generationSeconds.toFixed(1)}s`
      : "—";

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
              className="rounded-full border border-noid-silver/60 bg-white/10 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-white/80 transition-colors duration-200 hover:border-noid-silver hover:shadow-[0_0_0_1px_rgba(255,255,255,0.06)]"
            >
              {copyLabel}
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
              className="rounded-full border border-noid-silver/60 bg-white/8 px-6 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/85 transition-colors duration-200 hover:border-noid-silver hover:shadow-[0_0_0_1px_rgba(255,255,255,0.06)]"
            >
              New Request
            </motion.button>
            {refineTemplate && (
              <p className="text-xs uppercase tracking-[0.28em] text-white/40">
                {refineTemplate}
              </p>
            )}
          </div>

          {/* Trust Bar */}
          <div className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-black/30">
            <div className="h-[2px] w-full bg-noid-gold/40" aria-hidden />
            <div className="px-4 py-3 font-mono text-[0.72rem] tracking-[0.14em] text-noid-silver/50">
              ✓ Ready to publish • Matched to your voice • Generated in {generationLabel}
            </div>
          </div>

          {/* Output-only Synqra watermark (no third-party attribution) */}
          <a
            href="/"
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-4 py-2 font-mono text-[0.72rem] uppercase tracking-[0.18em] text-noid-silver/70 hover:border-noid-silver/30 hover:text-white/75"
            aria-label="SYNQRA"
          >
            <img src="/assets/synqra-q.svg" width={14} height={14} alt="" aria-hidden className="opacity-85" />
            SYNQRA
          </a>

          <AnimatePresence>
            {flash && (
              <motion.div
                key="flash"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.22 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="pointer-events-none absolute inset-0 bg-noid-gold/30 mix-blend-screen"
              />
            )}
          </AnimatePresence>
        </motion.section>
      )}
    </AnimatePresence>
  );
};

export default OutputPanel;
