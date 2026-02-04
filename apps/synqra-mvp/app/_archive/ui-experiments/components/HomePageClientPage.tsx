"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import PromptBox from "@/components/PromptBox";
import OutputPanel from "@/components/OutputPanel";
import GenerateButton from "@/components/GenerateButton";
import GenerationStatus, { type VerificationStep } from "@/components/GenerationStatus";
import PremiumFeatures from "@/components/PremiumFeatures";
import CountdownTimer from "@/components/CountdownTimer";
import type { DraftIntent } from "@/lib/draftEngine";

const PROMPT_SUGGESTIONS = [
  "Write a LinkedIn post about launching our new product…",
  "Draft an email announcing our Series A…",
  "Create a Twitter thread on AI ethics…",
  "Write a thoughtful take on remote work…",
] as const;

function fnv1a32(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    // FNV prime
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function makeRng(seed: number) {
  let x = seed || 1;
  return () => {
    // xorshift32
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return (x >>> 0) / 0xffffffff;
  };
}

function BarcodeHero() {
  const reduceMotion = useReducedMotion();

  // Deterministic seed: depends on build and runtime mode (no randomness).
  const seedString =
    [
      "synqra",
      process.env.NEXT_PUBLIC_BUILD_HASH,
      process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
      process.env.NODE_ENV,
      "lite",
    ]
      .filter(Boolean)
      .join("|") || "synqra|lite";

  const bars = useMemo(() => {
    const rng = makeRng(fnv1a32(seedString));
    const out: Array<{ x: number; w: number; h: number; y: number; o: number }> = [];

    // Encode a consistent "barcode" with deterministic variability.
    // Width and density are stable per build/tier seed.
    let x = 14;
    const maxX = 306;

    while (x < maxX) {
      const r = rng();
      const w = r > 0.82 ? 2 : 1;
      const gap = r > 0.92 ? 6 : r > 0.6 ? 4 : 3;
      const h = r > 0.9 ? 54 : r > 0.72 ? 46 : 40;
      const y = 8 + (56 - h);
      const o = 0.24 + rng() * 0.18; // low-contrast "platinum" variation

      out.push({ x, w, h, y, o });
      x += w + gap;
    }

    return out;
  }, [seedString]);

  return (
    <div className="mb-8 flex items-center justify-center">
      <div className="text-center">
        {/* Semantic system layer watermark (encoded + deterministic) */}
        <div className="relative mx-auto w-[320px]">
          {/* Keep layout identical: reserve the original barcode height */}
          <div className="h-16" aria-hidden />

          <svg
            width="320"
            height="112"
            viewBox="0 0 320 112"
            role="img"
            aria-label="Encoded system layer"
            className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2"
            style={{ opacity: 0.55 }}
          >
            <defs>
              <linearGradient id="platinum" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="rgba(255,255,255,0.14)" />
                <stop offset="35%" stopColor="rgba(140,140,145,0.22)" />
                <stop offset="70%" stopColor="rgba(255,255,255,0.10)" />
                <stop offset="100%" stopColor="rgba(140,140,145,0.18)" />
              </linearGradient>
              <linearGradient id="scan" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="rgba(255,255,255,0)" />
                <stop offset="50%" stopColor="rgba(255,255,255,0.08)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0)" />
              </linearGradient>
            </defs>

            <rect x="0" y="0" width="320" height="112" fill="transparent" />

            {/* Barcode field: low-contrast platinum strokes */}
            {bars.map((b, i) => (
              <rect
                key={i}
                x={b.x}
                y={b.y}
                width={b.w}
                height={b.h}
                fill="url(#platinum)"
                opacity={b.o}
              />
            ))}

            {/* Frame (infrastructure) */}
            <rect
              x="10"
              y="10"
              width="300"
              height="52"
              fill="transparent"
              stroke="rgba(140,140,145,0.14)"
            />

            {/* Ultra-slow scanline drift (disabled for reduced motion) */}
            {!reduceMotion && (
              <motion.rect
                x={-60}
                y={8}
                width={60}
                height={58}
                fill="url(#scan)"
                opacity={0.18}
                animate={{ x: [-60, 380] }}
                transition={{ duration: 90, repeat: Infinity, ease: "linear" }}
              />
            )}
          </svg>
        </div>

        {/* Wordmark remains primary; barcode sits behind as watermark */}
        <div className="relative mt-4 font-display text-3xl uppercase tracking-[0.38em] text-white">
          SYNQRA
        </div>
      </div>
    </div>
  );
}

export default function HomePageClientPage() {
  const [prompt, setPrompt] = useState("");
  const [intent, setIntent] = useState<DraftIntent>("draft");
  const [placeholderIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [verificationStep, setVerificationStep] = useState<VerificationStep>(0);
  const [currentDraft, setCurrentDraft] = useState<string | null>(null);
  const [previousDraft, setPreviousDraft] = useState<string | null>(null);
  const [generationSeconds, setGenerationSeconds] = useState<number | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState<number | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fingerprintRef = useRef<string | null>(null);

  const currentPlaceholder = PROMPT_SUGGESTIONS[placeholderIndex];
  const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

  const canGenerate = Boolean((prompt || textareaRef.current?.value || "").trim());
  const showGhosts = true; // default to Lite until product tier is wired

  const handleGenerate = useCallback(async () => {
    const effectivePrompt = (prompt || textareaRef.current?.value || "").trim();
    if (isProcessing || !effectivePrompt) return;

    setIsProcessing(true);
    setCooldownSeconds(null);
    setVerificationStep(0);
    const startTime = performance.now();

    try {
      if (prompt.trim() !== effectivePrompt) setPrompt(effectivePrompt);
      if (currentDraft) setPreviousDraft(currentDraft);

      // Step 1: intent analysis (client-side selection + prompt extraction)
      setVerificationStep(0);
      await delay(0);

      // Step 2: triangulating context (server-side work during request)
      setVerificationStep(1);

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
        if (response.status === 429) setCooldownSeconds(30);
        throw new Error((data && (data.message || data.error)) || "Draft generation failed");
      }

      // Step 3: polishing semantics (finalizing response)
      setVerificationStep(2);
      await delay(0);

      const elapsed = performance.now() - startTime;
      setGenerationSeconds(elapsed / 1000);
      setCurrentDraft((data && data.draft) || "");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Draft generation failed";
      setGenerationSeconds(null);
      setCurrentDraft(message);
    } finally {
      setIsProcessing(false);
    }
  }, [currentDraft, intent, isProcessing, prompt]);

  const handleNewRequest = useCallback(() => {
    setPrompt("");
    setIntent("draft");
    setGenerationSeconds(null);
    setCurrentDraft(null);
    setPreviousDraft(null);
    setCooldownSeconds(null);
    textareaRef.current?.focus();
  }, []);

  const SAMPLE_DRAFT = useMemo(
    () =>
      [
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
      ].join("\n"),
    []
  );

  const handleShowSampleDraft = useCallback(async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setCooldownSeconds(null);
    setVerificationStep(0);
    const startTime = performance.now();

    try {
      if (currentDraft) setPreviousDraft(currentDraft);
      setVerificationStep(2);
      await delay(250);
      setCurrentDraft(SAMPLE_DRAFT);
      setGenerationSeconds((performance.now() - startTime) / 1000);
    } finally {
      setIsProcessing(false);
    }
  }, [SAMPLE_DRAFT, currentDraft, isProcessing]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-noid-black">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-noid-gold/5 via-transparent to-transparent" />

      <div className="relative z-10 mx-auto max-w-5xl px-6 py-10 md:py-14">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <BarcodeHero />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
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
            {isProcessing ? (
              <GenerationStatus step={verificationStep} isActive />
            ) : cooldownSeconds ? (
              <div className="flex items-center justify-center">
                <CountdownTimer seconds={cooldownSeconds} label="Cooldown" onDone={() => setCooldownSeconds(null)} />
              </div>
            ) : null}

            <GenerateButton
              label="Generate"
              onClick={handleGenerate}
              disabled={isProcessing || !canGenerate || Boolean(cooldownSeconds)}
              isProcessing={isProcessing}
            />
          </div>
        </motion.div>

        <PremiumFeatures enabled={!showGhosts} />

        {currentDraft && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mt-8">
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


