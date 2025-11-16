"use client";

import { AnimatePresence, motion } from "framer-motion";
import { forwardRef } from "react";

type PromptBoxProps = {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  onFocusChange?: (isFocused: boolean) => void;
  onSubmitIntent?: () => void;
  disabled?: boolean;
};

const PromptBox = forwardRef<HTMLTextAreaElement, PromptBoxProps>(
  ({ value, placeholder, onChange, onFocusChange, onSubmitIntent, disabled = false }, ref) => {
    return (
      <div className="relative">
        <textarea
          ref={ref}
          value={value}
          disabled={disabled}
          rows={6}
          spellCheck
          className="w-full resize-none rounded-3xl border border-white/10 bg-white/5 px-6 py-5 text-base leading-relaxed text-white/95 shadow-[0_0_0_1px_rgba(255,255,255,0.05)] outline-none transition-all duration-200 placeholder:text-white/30 focus:border-indigo focus:shadow-glow focus:ring-0"
          onChange={(event) => onChange(event.target.value)}
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
              className="pointer-events-none absolute inset-x-0 top-0 flex h-full items-start px-6 py-5 text-base leading-relaxed text-white/60"
            >
              {placeholder}
            </motion.span>
          )}
        </AnimatePresence>

        <div className="pointer-events-none absolute inset-0 rounded-3xl border border-white/[0.05] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]" />
      </div>
    );
  }
);

PromptBox.displayName = "PromptBox";

export default PromptBox;
