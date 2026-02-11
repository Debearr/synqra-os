"use client";

import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import GenerateButton from "../../components/GenerateButton";
import OutputPanel from "../../components/OutputPanel";
import PromptBox from "../../components/PromptBox";
import { generatePerfectDraft } from "../../lib/draftEngine";

const PROMPT_SUGGESTIONS = [
  "Write a LinkedIn post about launching our new product…",
  "Draft an email announcing our Series A…",
  "Create a Twitter thread on AI ethics…",
  "Write a thoughtful take on remote work…",
];

export default function HomePage() {
  const [prompt, setPrompt] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentDraft, setCurrentDraft] = useState<string | null>(null);
  const [previousDraft, setPreviousDraft] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Placeholder rotation disabled per Design Constitution (no autoplay loops)

  const currentPlaceholder = PROMPT_SUGGESTIONS[placeholderIndex];

  const handleGenerate = useCallback(async () => {
    if (isProcessing || !prompt.trim()) return;
    setIsProcessing(true);
    setError(null);

    try {
      if (currentDraft) {
        setPreviousDraft(currentDraft);
      }
      const draft = await generatePerfectDraft(prompt.trim());
      setCurrentDraft(draft);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "We could not generate a draft right now. Please try again."
      );
    } finally {
      setIsProcessing(false);
    }
  }, [currentDraft, isProcessing, prompt]);

  const handleNewRequest = useCallback(() => {
    setPrompt("");
    setError(null);
    textareaRef.current?.focus();
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden bg-noir">
      {/* Background Gradient */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-indigo/5 via-transparent to-transparent" />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-5xl px-6 py-16 md:py-24">
        {/* Hero Section */}
        <div className="mb-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-xs uppercase tracking-[0.5em] text-white/40">
              Synqra
            </span>
            <h1 className="mt-4 font-display text-5xl tracking-tight text-white md:text-6xl lg:text-7xl">
              Your executive voice.
              <br />
              <span className="text-indigo">90 seconds.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/65">
              Type one line. Get publish-ready content that sounds exactly like you.
              <br />
              LinkedIn, Twitter, newsletters—written, polished, and on-brand.
            </p>
          </motion.div>

        </div>

        {/* Perfect Draft Engine */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7 }}
          className="rounded-[32px] border border-white/8 bg-black/40 p-8 shadow-[0_24px_80px_rgba(75,82,255,0.15)] backdrop-blur-xl md:p-10"
        >
          <header className="mb-6">
            <h2 className="text-xs uppercase tracking-[0.4em] text-white/40">
              Perfect Draft Engine
            </h2>
          </header>

          <PromptBox
            ref={textareaRef}
            value={prompt}
            onChange={setPrompt}
            onSubmitIntent={handleGenerate}
            placeholder={currentPlaceholder}
            ariaLabel="Content request prompt"
            disabled={isProcessing}
          />

          <div className="mt-6 space-y-4">
            <GenerateButton
              label="Generate executive-grade content"
              onClick={handleGenerate}
              disabled={isProcessing || !prompt.trim()}
              isProcessing={isProcessing}
            />
            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            )}
            <div className="flex items-center justify-between text-[0.65rem] uppercase tracking-[0.3em] text-white/30">
              <span>No signup required</span>
              <span>Voice learning enabled</span>
            </div>
          </div>
        </motion.div>

        {/* Output Panel */}
        {currentDraft && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mt-8"
          >
            <OutputPanel
              draft={currentDraft}
              isVisible={Boolean(currentDraft)}
              onNewRequest={handleNewRequest}
              previousDraft={previousDraft}
              dimmed={false}
            />
          </motion.div>
        )}

        {/* Feature Highlights */}
        {!currentDraft && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mt-16 grid gap-6 md:grid-cols-3"
          >
            {[
              {
                title: "Learns Your Voice",
                description: "Analyzes your past 50 posts to replicate tone, word choice, and style.",
              },
              {
                title: "Cross-Platform",
                description: "One prompt → LinkedIn post, Twitter thread, newsletter draft.",
              },
              {
                title: "Time-Saving",
                description: "2 hours/week → 15 minutes. Focus on leading, not posting.",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 backdrop-blur"
              >
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-white">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-white/55">
                  {feature.description}
                </p>
              </div>
            ))}
          </motion.div>
        )}

        {/* CTA Section */}
        {!currentDraft && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="mt-12 text-center"
          >
            
            {/* Primary CTA - Pilot */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a
                href="/pilot/apply"
                className="inline-flex items-center rounded-lg bg-gold-cta px-8 py-4 min-h-12 text-sm font-bold uppercase tracking-wider text-noir-deep transition-all duration-200 hover:opacity-90 hover:scale-105"
              >
                Apply for Founder Pilot
              </a>
              
              {/* Secondary CTA - Subscription (Disabled) */}
              <button
                disabled
                className="inline-flex items-center rounded-lg border border-ivory-warm/10 bg-ivory-warm/5 px-8 py-4 min-h-12 text-sm font-bold uppercase tracking-wider text-ivory-warm/30 cursor-not-allowed"
              >
                Join Subscription Waitlist
              </button>
            </div>
            
            <p className="mt-4 text-xs text-white/35">
              Pilot: First 50 founders • Subscription: Coming soon
            </p>
          </motion.div>
        )}
      </div>
    </main>
  );
}
