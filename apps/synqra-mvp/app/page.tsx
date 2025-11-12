"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import GenerateButton from "../components/GenerateButton";
import OutputPanel from "../components/OutputPanel";
import PromptBox from "../components/PromptBox";
import { generatePerfectDraft } from "../lib/draftEngine";

const PROMPT_SUGGESTIONS = [
  "Write a clear message explaining my idea…",
  "Summarize this text with better clarity…",
  "Turn this rough note into a clean post…",
  "Rewrite this professionally…",
  "Enhance this ad copy…",
];

const REFINEMENT_TEMPLATES = [
  "persuasive and high-converting",
  "concise without losing nuance",
  "warm while staying executive",
];

const ANTI_VAGUE_APPEND = "Please rewrite this text clearly, concisely, and professionally.";

const vagueIndicators = [
  "fix this",
  "make better",
  "help",
  "improve",
  "idk",
  "???",
  "polish it",
  "do it",
  "rewrite this",
];

const isPromptVague = (prompt: string) => {
  const trimmed = prompt.trim().toLowerCase();
  if (!trimmed) return true;
  if (trimmed.split(" ").length <= 3) return true;
  return vagueIndicators.some((fragment) => trimmed === fragment || trimmed.endsWith(fragment));
};

const determineButtonLabel = (prompt: string) => {
  const lower = prompt.toLowerCase();
  if (lower.includes("email")) return "Draft Email Now";
  if (lower.includes("summarize")) return "Summarize Now";
  if (lower.includes("rewrite")) return "Rewrite Now";
  return "Generate Perfect Draft";
};

const HomePage = () => {
  const [prompt, setPrompt] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentDraft, setCurrentDraft] = useState<string | null>(null);
  const [previousDraft, setPreviousDraft] = useState<string | null>(null);
  const [isRefinementMode, setIsRefinementMode] = useState(false);
  const [refineIndex, setRefineIndex] = useState(0);
  const [refineCaption, setRefineCaption] = useState<string | null>(null);
  const [antiPromptApplied, setAntiPromptApplied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const rotation = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % PROMPT_SUGGESTIONS.length);
    }, 10000);
    return () => clearInterval(rotation);
  }, []);

  const currentPlaceholder = PROMPT_SUGGESTIONS[placeholderIndex];

  const buttonLabel = useMemo(() => determineButtonLabel(prompt), [prompt]);

  const preparedPrompt = useCallback(
    (raw: string) => {
      const trimmed = raw.trim();
      if (!trimmed) {
        return { prompt: `${currentPlaceholder} ${ANTI_VAGUE_APPEND}`, augmented: true };
      }
      if (isPromptVague(trimmed)) {
        const appended = trimmed.endsWith(".") ? trimmed : `${trimmed}.`;
        return { prompt: `${appended} ${ANTI_VAGUE_APPEND}`, augmented: true };
      }
      return { prompt: trimmed, augmented: false };
    },
    [currentPlaceholder]
  );

  const runEngine = useCallback(async (input: string) => {
    let output = await generatePerfectDraft(input);
    if (output.replace(/\s+/g, "").length < 20) {
      output = await generatePerfectDraft(`${input} Please expand with structured detail and tangible guidance.`);
    }
    return output;
  }, []);

  const handleGenerate = useCallback(async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setAntiPromptApplied(false);

    const { prompt: resolvedPrompt, augmented } = preparedPrompt(prompt);
    if (augmented) {
      setAntiPromptApplied(true);
    }

    try {
      if (currentDraft) {
        setPreviousDraft(currentDraft);
      }
      const draft = await runEngine(resolvedPrompt);
      setCurrentDraft(draft);
      setIsRefinementMode(false);
      setRefineCaption(null);
    } finally {
      setIsProcessing(false);
    }
  }, [currentDraft, isProcessing, preparedPrompt, prompt, runEngine]);

  const handleNewRequest = useCallback(() => {
    if (!currentDraft) return;
    setIsRefinementMode(true);
    const template = REFINEMENT_TEMPLATES[refineIndex % REFINEMENT_TEMPLATES.length];
    setRefineCaption(`Refinement template: more ${template}`);
    const refinementPrompt = `Refine the last result by making it more ${template}.`;
    setPrompt(refinementPrompt);
    setRefineIndex((prev) => (prev + 1) % REFINEMENT_TEMPLATES.length);
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(refinementPrompt.length, refinementPrompt.length);
    });
  }, [currentDraft, refineIndex]);

  const subtlePrevious = !currentDraft && previousDraft;

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-14">
      <div className="relative w-full max-w-[700px] space-y-8">
        <div className="rounded-[32px] border border-white/8 bg-black/40 p-8 backdrop-blur-xl shadow-[0_16px_80px_rgba(11,11,11,0.85)]">
          <header className="mb-8 text-center">
            <span className="pt-6 text-xs uppercase tracking-[0.5em] text-white/35 hover:[text-shadow:0_0_6px_rgba(0,255,198,0.25)] transition-all duration-300">Synqra</span>
            <h1 className="mt-6 font-display text-[clamp(2rem,2.5vw,2.5rem)] tracking-[0.15em] text-white pb-3">
              Perfect Draft Engine
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-white/60">
              Drop a single prompt. Receive a premium, production-ready draft instantly.
            </p>
          </header>

          <PromptBox
            ref={textareaRef}
            value={prompt}
            onChange={setPrompt}
            onSubmitIntent={handleGenerate}
            placeholder={currentPlaceholder}
            disabled={isProcessing}
          />

          <div className="mt-6 space-y-4">
            <GenerateButton
              label={buttonLabel}
              onClick={handleGenerate}
              disabled={isProcessing || !prompt.trim()}
              isProcessing={isProcessing}
            />
            <div className="flex items-center justify-between text-[0.7rem] uppercase tracking-[0.3em] text-white/35">
              <span>Zero-step onboarding</span>
              {antiPromptApplied && <span className="text-indigo">Prompt optimized automatically</span>}
            </div>
          </div>
        </div>

        {subtlePrevious && (
          <div className="rounded-3xl border border-white/6 bg-white/[0.04] p-6 text-xs leading-relaxed text-white/45">
            <span className="mb-2 block font-semibold uppercase tracking-[0.24em] text-white/30">Previous Draft Snapshot</span>
            <pre className="whitespace-pre-wrap font-sans text-[0.9rem] text-white/45">{previousDraft}</pre>
          </div>
        )}

        <OutputPanel
          draft={currentDraft}
          isVisible={Boolean(currentDraft)}
          onNewRequest={handleNewRequest}
          refineTemplate={refineCaption ?? undefined}
          previousDraft={previousDraft}
          dimmed={isRefinementMode}
        />
      </div>
    </main>
  );
};

export default HomePage;
