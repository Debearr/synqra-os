"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useCouncilDispatch } from "@/hooks/use-council-dispatch";

type BrowserSpeechRecognition = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type BrowserSpeechRecognitionCtor = new () => BrowserSpeechRecognition;

declare global {
  interface Window {
    SpeechRecognition?: BrowserSpeechRecognitionCtor;
    webkitSpeechRecognition?: BrowserSpeechRecognitionCtor;
  }
}

type StudioCommandCenterProps = {
  onInitialized?: (payload: { requestId: string | null; input: string; content: string }) => void;
  onStatusChange?: (status: "ready" | "processing" | "complete" | "adjust") => void;
};

export default function StudioCommandCenter({ onInitialized, onStatusChange }: StudioCommandCenterProps) {
  const [goal, setGoal] = useState("");
  const [platform, setPlatform] = useState("");
  const [voice, setVoice] = useState("");
  const [touched, setTouched] = useState(false);
  const [showError, setShowError] = useState(false);
  const [analysisStage, setAnalysisStage] = useState(0);
  const [commandText, setCommandText] = useState("");
  const [commandRunning, setCommandRunning] = useState(false);
  const [commandResult, setCommandResult] = useState<string | null>(null);
  const [commandError, setCommandError] = useState<string | null>(null);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const { status, error, initializeProtocol, reset } = useCouncilDispatch();

  const isValid = goal.trim().length > 0 && platform.length > 0 && voice.length > 0;

  // Show restricted access toast for any error
  useEffect(() => {
    if (status === "error" && error) {
      setShowError(true);
      const timer = setTimeout(() => setShowError(false), 5000);
      return () => clearTimeout(timer);
    } else {
      setShowError(false);
    }
  }, [error, status]);

  useEffect(() => {
    if (status !== "analysis") {
      setAnalysisStage(0);
      return;
    }

    const stageTwo = setTimeout(() => setAnalysisStage(1), 4000);
    const stageThree = setTimeout(() => setAnalysisStage(2), 8000);
    return () => {
      clearTimeout(stageTwo);
      clearTimeout(stageThree);
    };
  }, [status]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
    setVoiceSupported(Boolean(ctor));
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    if (!onStatusChange) return;
    if (status === "analysis") {
      onStatusChange("processing");
      return;
    }
    if (status === "done") {
      onStatusChange("complete");
      return;
    }
    if (status === "error") {
      onStatusChange("adjust");
      return;
    }
    onStatusChange("ready");
  }, [status, onStatusChange]);

  const buildInput = () =>
    [
      `Goal: ${goal.trim()}`,
      `Platform: ${platform}`,
      `Voice: ${voice}`,
      "Task: Create one polished draft for immediate use.",
    ].join("\n");

  const clearMalformedSupabaseSession = (supabaseUrl: string) => {
    if (typeof window === "undefined") return;

    try {
      const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
      const storageKey = `sb-${projectRef}-auth-token`;
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return;

      if (raw === "fake-token") {
        window.localStorage.removeItem(storageKey);
        return;
      }

      const parsed = JSON.parse(raw) as unknown;
      if (typeof parsed === "string") {
        window.localStorage.removeItem(storageKey);
      }
    } catch {
      // Ignore malformed storage values and URL parse failures.
    }
  };

  const getAuthHeader = async (): Promise<Record<string, string>> => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) return {};

    try {
      clearMalformedSupabaseSession(supabaseUrl);
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.access_token) {
        return { Authorization: `Bearer ${session.access_token}` };
      }
    } catch (sessionError) {
      console.warn("Unable to resolve auth session for command execution:", sessionError);
    }

    return {};
  };

  const executeCommand = async (inputMode: "text" | "voice") => {
    const normalized = commandText.trim();
    if (!normalized) {
      setCommandError("Enter a command first.");
      setCommandResult(null);
      return;
    }

    setCommandRunning(true);
    setCommandError(null);
    setCommandResult(null);

    try {
      const authHeaders = await getAuthHeader();
      const response = await fetch("/api/v1/commands", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify({
          command: normalized,
          input_mode: inputMode,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | {
            ok?: boolean;
            error?: string;
            details?: string;
            gmail_draft_id?: string;
            queue_id?: string;
          }
        | null;

      if (!response.ok) {
        const errorMessage = payload?.error || payload?.details || "Command failed";
        setCommandError(errorMessage);
        return;
      }

      setCommandResult(
        payload?.gmail_draft_id
          ? `Draft created in Gmail (${payload.gmail_draft_id}).`
          : payload?.queue_id
          ? `Digest queued (${payload.queue_id}).`
          : "Command completed."
      );
    } catch (err) {
      setCommandError(err instanceof Error ? err.message : "Command failed");
    } finally {
      setCommandRunning(false);
    }
  };

  const startVoiceCapture = () => {
    if (typeof window === "undefined") return;
    const SpeechCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechCtor) {
      setCommandError("Voice input is not supported in this browser.");
      return;
    }

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    setCommandError(null);
    const recognition = new SpeechCtor();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const first = event.results?.[0]?.[0]?.transcript || "";
      const transcript = first.trim();
      if (transcript) {
        setCommandText(transcript);
      }
    };
    recognition.onerror = (event) => {
      setCommandError(event.error ? `Voice input error: ${event.error}` : "Voice input error");
    };
    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    setIsListening(true);
    recognition.start();
  };

  const handleInitialize = async () => {
    if (!isValid) {
      setTouched(true);
      return;
    }

    setTouched(true);
    reset();

    try {
      const input = buildInput();
      const result = await initializeProtocol(input);

      if (result.error) {
        // Error is already handled and displayed by the hook's error state
        console.error("Protocol initialization error:", result.error);
        return;
      }

      if (result.status === "done") {
        if (result.requestId) {
          localStorage.setItem("synqra_request_id", result.requestId);
        }
        localStorage.setItem("synqra_input", input);
        onInitialized?.({
          requestId: result.requestId || null,
          input,
          content: result.verdict?.consensus || "",
        });
      }
    } catch (err) {
      // Explicit error handling - no silent failures
      console.error("Failed to initialize protocol:", err);
      // Error state is managed by the hook, but we log it explicitly
    }
  };

  const getButtonText = () => {
    switch (status) {
      case "analysis":
        return "CREATE";
      case "done":
        return "COMPLETE";
      case "error":
        return "ADJUST";
      default:
        return "CREATE";
    }
  };

  const isProcessing = status === "analysis";
  const reviewCopy =
    analysisStage === 0
      ? "Your request is under review."
      : analysisStage === 1
      ? "Analyzing channel trade-offs..."
      : "Final creation pass in progress.";
  const isError = status === "error";
  const headline = isError ? "Let's adjust this." : "Your creation engine is ready.";
  const subhead = isError
    ? "Tighten the brief to one clear outcome, then create again."
    : "Goal, platform, and voice. Create one focused asset.";

  return (
    <div className="space-y-6">
      {showError && error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="rounded-lg border border-noid-silver/30 bg-noid-black/70 p-4"
        >
          <div className="font-mono text-sm uppercase tracking-wider text-noid-silver">
            Let&apos;s adjust this.
          </div>
          <div className="mt-2 text-sm text-white/75">
            Refocus the brief and create again.
          </div>
        </motion.div>
      )}

      <div className="relative overflow-hidden rounded-xl border border-noid-silver/20 bg-noid-black/60 backdrop-blur-md">
        <div className="relative p-6">
          <div className="mb-6">
            <div className="font-mono text-[0.72rem] uppercase tracking-[0.16em] text-noid-silver/70">
              Synqra Frame
            </div>
            <h2 className="mt-2 font-display text-2xl tracking-[0.08em] text-white">{headline}</h2>
            <div className="mt-2 text-sm text-white/70">{subhead}</div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block font-mono text-[0.72rem] uppercase tracking-[0.16em] text-noid-silver/70">
                Goal
              </label>
              <textarea
                value={goal}
                onChange={(e) => {
                  setGoal(e.target.value);
                  if (touched) reset();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && !isProcessing && isValid) {
                    handleInitialize();
                  }
                }}
                spellCheck={false}
                className={`w-full rounded-lg border border-noid-silver/35 bg-noid-black/60 backdrop-blur-md px-4 py-3 font-mono text-sm tracking-[0.08em] text-white outline-none focus:ring-2 focus:ring-[var(--noid-teal)] ${
                  isProcessing ? "opacity-60" : ""
                }`}
                placeholder='e.g. "Launch our first paid pilot in 30 days."'
                rows={3}
                disabled={isProcessing}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block font-mono text-[0.72rem] uppercase tracking-[0.16em] text-noid-silver/70">
                  Platform
                </label>
                <select
                  value={platform}
                  onChange={(e) => {
                    setPlatform(e.target.value);
                    if (touched) reset();
                  }}
                  disabled={isProcessing}
                  className={`w-full rounded-lg border border-noid-silver/35 bg-noid-black/60 px-4 py-3 font-mono text-sm text-white outline-none focus:ring-2 focus:ring-[var(--noid-teal)] ${
                    isProcessing ? "opacity-60" : ""
                  }`}
                >
                  <option value="" className="bg-noid-black text-noid-silver">
                    Select platform
                  </option>
                  <option value="LinkedIn" className="bg-noid-black text-white">
                    LinkedIn
                  </option>
                  <option value="TikTok" className="bg-noid-black text-white">
                    TikTok
                  </option>
                  <option value="Google Ads" className="bg-noid-black text-white">
                    Google Ads
                  </option>
                </select>
              </div>
              <div>
                <label className="mb-2 block font-mono text-[0.72rem] uppercase tracking-[0.16em] text-noid-silver/70">
                  Voice
                </label>
                <select
                  value={voice}
                  onChange={(e) => {
                    setVoice(e.target.value);
                    if (touched) reset();
                  }}
                  disabled={isProcessing}
                  className={`w-full rounded-lg border border-noid-silver/35 bg-noid-black/60 px-4 py-3 font-mono text-sm text-white outline-none focus:ring-2 focus:ring-[var(--noid-teal)] ${
                    isProcessing ? "opacity-60" : ""
                  }`}
                >
                  <option value="" className="bg-noid-black text-noid-silver">
                    Select voice
                  </option>
                  <option value="Direct" className="bg-noid-black text-white">
                    Direct
                  </option>
                  <option value="Premium" className="bg-noid-black text-white">
                    Premium
                  </option>
                  <option value="Playful" className="bg-noid-black text-white">
                    Playful
                  </option>
                </select>
              </div>
            </div>

            <div className="rounded-lg border border-noid-silver/20 bg-noid-black/50 p-4">
              <label className="mb-2 block font-mono text-[0.72rem] uppercase tracking-[0.16em] text-noid-silver/70">
                Quick Command
              </label>
              <input
                value={commandText}
                onChange={(e) => setCommandText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !commandRunning) {
                    executeCommand("text");
                  }
                }}
                placeholder='Try: "Draft a reply to Alex" or "Summarize today&apos;s emails"'
                className="w-full rounded-lg border border-noid-silver/35 bg-noid-black/60 px-4 py-3 font-mono text-sm text-white outline-none focus:ring-2 focus:ring-[var(--noid-teal)]"
                disabled={commandRunning}
              />
              <div className="mt-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => executeCommand("text")}
                  disabled={commandRunning || commandText.trim().length === 0}
                  className="rounded-full border border-noid-silver/35 px-4 py-2 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-noid-silver transition-opacity hover:opacity-100 disabled:opacity-50"
                >
                  {commandRunning ? "Running" : "Run command"}
                </button>
                <button
                  type="button"
                  onClick={startVoiceCapture}
                  disabled={!voiceSupported || commandRunning}
                  className="rounded-full border border-noid-silver/35 px-4 py-2 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-noid-silver transition-opacity hover:opacity-100 disabled:opacity-50"
                >
                  {isListening ? "Stop voice" : "Voice input"}
                </button>
                <div className="text-xs text-noid-silver/70">
                  {voiceSupported ? "Browser voice supported." : "Voice unavailable in this browser."}
                </div>
              </div>
              {commandResult ? <div className="mt-3 text-xs text-white/85">{commandResult}</div> : null}
              {commandError ? <div className="mt-3 text-xs text-white/75">{commandError}</div> : null}
            </div>

            <div className="flex items-center justify-between">
              <div className="text-xs text-noid-silver/70">
                {isValid
                  ? "Ready when you are."
                  : "Set goal, platform, and voice."}
              </div>

              <button
                type="button"
                onClick={handleInitialize}
                disabled={isProcessing || !isValid}
                className="rounded-full bg-noid-gold px-6 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-noid-black transition-opacity hover:opacity-95 active:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--noid-teal)] disabled:opacity-50"
              >
                {getButtonText()}
              </button>
            </div>

            {isProcessing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mt-4 text-sm text-noid-silver/80"
              >
                {reviewCopy}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

