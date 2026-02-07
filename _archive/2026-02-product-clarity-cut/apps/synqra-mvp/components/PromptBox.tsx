"use client";

import { AnimatePresence, motion } from "framer-motion";
import { forwardRef } from "react";
import type { DraftIntent } from "@/lib/draftEngine";

type PromptBoxProps = {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  intent: DraftIntent;
  onIntentChange: (intent: DraftIntent) => void;
  onFocusChange?: (isFocused: boolean) => void;
  onSubmitIntent?: () => void;
  onShowSampleDraft?: () => void;
  disabled?: boolean;
};

const PromptBox = forwardRef<HTMLTextAreaElement, PromptBoxProps>(
  (
    { value, placeholder, onChange, intent, onIntentChange, onFocusChange, onSubmitIntent, onShowSampleDraft, disabled = false },
    ref
  ) => {
    return (
      <div className="rounded-3xl border border-noid-silver/40 bg-white/5 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.05)]">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.32em] text-noid-silver">Command Center</p>
            <p className="text-sm text-white/70">Pick an outcome. Add a brief.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.22em] text-white/60">
            <span className="rounded-full border border-noid-silver/40 bg-noid-black/40 px-3 py-1">
              Ctrl/⌘ + Enter
            </span>
          </div>
        </div>

        {/* Outcome selector (progressive disclosure: no extra settings shown) */}
        <div className="mb-4 flex flex-wrap gap-2">
          {[
            { label: "Generate", value: "draft" as const },
            { label: "Refine", value: "rewrite" as const },
            { label: "Distill", value: "summary" as const },
            { label: "Format", value: "email" as const },
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] transition-colors ${
                intent === item.value
                  ? item.value === "draft"
                    ? "border-noid-gold bg-noid-gold text-noid-black shadow-gold-glow"
                    : "border-noid-silver/60 bg-noid-black/40 text-white"
                  : "border-noid-silver/40 bg-noid-black/30 text-white/80 hover:border-noid-silver"
              }`}
              onClick={() => onIntentChange(item.value)}
              disabled={disabled}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <textarea
            ref={ref}
            value={value}
            disabled={disabled}
            rows={6}
            spellCheck
            className="w-full resize-none rounded-2xl border border-noid-silver/40 bg-noid-black/40 px-5 py-4 text-base leading-relaxed text-white/95 outline-none transition-all duration-200 placeholder:text-white/30 focus:ring-2 focus:ring-noid-teal"
            onChange={(event) => onChange(event.target.value)}
            onInput={(event) => {
              // Some input methods (voice dictation, IME, injected tooling) may not reliably trigger React's change pipeline.
              // Keep state and DOM in sync so the Generate button and placeholder logic stay correct.
              const el = event.currentTarget as HTMLTextAreaElement;
              onChange(el.value);
            }}
            onFocus={() => onFocusChange?.(true)}
            onBlur={() => onFocusChange?.(false)}
            onKeyDown={(event) => {
              if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "enter") {
                event.preventDefault();
                onSubmitIntent?.();
              }
            }}
          />

          <AnimatePresence mode="wait">
            {!value && !disabled && (
              <motion.span
                key={placeholder}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 0.65, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="pointer-events-none absolute inset-x-0 top-0 flex h-full items-start px-5 py-4 text-base leading-relaxed text-white/60"
              >
                {placeholder}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <p className="mt-3 text-xs text-noid-silver">Audience • POV • next action.</p>

        {onShowSampleDraft && !disabled && !value && (
          <button
            type="button"
            onClick={onShowSampleDraft}
            className="mt-3 text-left text-xs font-medium text-white/55 underline decoration-white/20 underline-offset-4 transition-colors hover:text-white/75"
          >
            Not sure? See a sample draft →
          </button>
        )}
      </div>
    );
  }
);

PromptBox.displayName = "PromptBox";

export default PromptBox;
