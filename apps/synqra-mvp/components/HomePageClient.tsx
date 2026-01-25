"use client";

import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import GenerateButton from "./GenerateButton";
import OutputPanel from "./OutputPanel";
import PromptBox from "./PromptBox";
import type { DraftIntent } from "../lib/draftEngine";

const PROMPT_SUGGESTIONS = [
  "Write a LinkedIn post about launching our new product…",
  "Draft an email announcing our Series A…",
  "Create a Twitter thread on AI ethics…",
  "Write a thoughtful take on remote work…",
];

export default function HomePageClient() {
  const [prompt, setPrompt] = useState("");
  const [intent, setIntent] = useState<DraftIntent>("draft");
  const [placeholderIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingHint, setProcessingHint] = useState<string | null>(null);
  const [currentDraft, setCurrentDraft] = useState<string | null>(null);
  const [previousDraft, setPreviousDraft] = useState<string | null>(null);
  const [generationSeconds, setGenerationSeconds] = useState<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fingerprintRef = useRef<string | null>(null);

  const currentPlaceholder = PROMPT_SUGGESTIONS[placeholderIndex];
  const MIN_PERCEPTION_TIME = 800; // ms

  const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

  const SAMPLE_DRAFT = [
    "Perfect Draft (first pass):",
    "",
    "Strategic focus isn’t saying “no” to distractions.",
    "It’s saying “yes” to the few decisions that compound.",
    "",
    "In every scaling phase, the constraint shifts:",
    "- Early: clarity (what are we actually building?)",
    "- Mid: priority (what matters this quarter?)",
    "- Late: consistency (what do we do every week, no matter what?)",
    "",
    "A simple operating rule I’ve learned to trust:",
    "If it doesn’t move the core metric, protect the team’s attention and decline it.",
    "",
    "Focus is a leadership behavior — not a productivity hack.",
    "It’s how you earn momentum.",
    "",
    "If you’re refining priorities right now: what’s the one initiative you’re willing to stop to speed everything else up?",
    "",
    "Review for accuracy, then publish with confidence.",
  ].join("\n");

  const handleGenerate = useCallback(async () => {
    const effectivePrompt = (prompt || textareaRef.current?.value || "").trim();
    if (isProcessing || !effectivePrompt) return;
    setIsProcessing(true);
    setProcessingHint("Calibrating voice profile…");
    const startTime = performance.now();

    try {
      if (prompt.trim() !== effectivePrompt) {
        setPrompt(effectivePrompt);
      }
      if (currentDraft) {
        setPreviousDraft(currentDraft);
      }

      if (!fingerprintRef.current) {
        const FingerprintJS = await import("@fingerprintjs/fingerprintjs");
        const fp = await FingerprintJS.load();
        const result = await fp.get();
        fingerprintRef.current = result.visitorId;
      }

      const response = await fetch("/api/draft", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-synqra-fp": fingerprintRef.current || "",
        },
        body: JSON.stringify({ prompt: effectivePrompt, intent }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error((data && (data.message || data.error)) || "Draft generation failed");
      }

      const elapsed = performance.now() - startTime;
      if (elapsed < MIN_PERCEPTION_TIME) {
        await delay(MIN_PERCEPTION_TIME - elapsed);
      }
      setGenerationSeconds(Math.max(MIN_PERCEPTION_TIME, elapsed) / 1000);
      setCurrentDraft((data && data.draft) || "");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Draft generation failed";
      setGenerationSeconds(null);
      setCurrentDraft(message);
    } finally {
      setIsProcessing(false);
      setProcessingHint(null);
    }
  }, [currentDraft, intent, isProcessing, prompt]);

  const handleNewRequest = useCallback(() => {
    setPrompt("");
    setIntent("draft");
    setGenerationSeconds(null);
    setCurrentDraft(null);
    setPreviousDraft(null);
    textareaRef.current?.focus();
  }, []);

  const handleShowSampleDraft = useCallback(async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setProcessingHint("Calibrating voice profile…");
    const startTime = performance.now();

    try {
      if (currentDraft) {
        setPreviousDraft(currentDraft);
      }
      await delay(MIN_PERCEPTION_TIME);
      setCurrentDraft(SAMPLE_DRAFT);
      setGenerationSeconds((performance.now() - startTime) / 1000);
    } finally {
      setIsProcessing(false);
      setProcessingHint(null);
    }
  }, [currentDraft, isProcessing]);

  const canGenerate = Boolean((prompt || textareaRef.current?.value || "").trim());

  return (
    <main className="relative min-h-screen overflow-hidden bg-noid-black">
      {/* Background Gradient */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-noid-gold/5 via-transparent to-transparent" />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-5xl px-6 py-10 md:py-14">
        {/* Brand Mark (Primary Anchor) */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 text-center"
        >
          <div className="font-display text-4xl uppercase tracking-[0.38em] text-white md:text-5xl">
            SYNQRA
          </div>
        </motion.div>

        {/* Perfect Draft Engine */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.6 }}
          className="rounded-[32px] border border-noid-silver/40 bg-noid-black/40 p-8 backdrop-blur-xl md:p-10"
        >
          <PromptBox
            ref={textareaRef}
            value={prompt}
            onChange={setPrompt}
            intent={intent}
            onIntentChange={setIntent}
            onSubmitIntent={handleGenerate}
            onShowSampleDraft={handleShowSampleDraft}
            placeholder={currentPlaceholder}
            disabled={isProcessing}
          />

          <div className="mt-6 space-y-4">
            <GenerateButton
              label="Generate executive-grade content"
              onClick={handleGenerate}
              disabled={isProcessing || !canGenerate}
              isProcessing={isProcessing}
            />
            {isProcessing && processingHint && (
              <div className="text-center font-mono text-[0.72rem] tracking-[0.16em] text-noid-silver/50">
                {processingHint}
              </div>
            )}
          </div>
        </motion.div>

        {/* Output Panel */}
        {currentDraft && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mt-8">
            <OutputPanel
              draft={currentDraft}
              isVisible={Boolean(currentDraft)}
              onNewRequest={handleNewRequest}
              previousDraft={previousDraft}
              generationSeconds={generationSeconds}
              dimmed={false}
            />
          </motion.div>
        )}
      </div>
    </main>
  );
}


