"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { quickReviewStudioDraft, type StudioVertical } from "@/lib/council/studio-quality-gate";
import { useCouncilDispatch } from "@/hooks/use-council-dispatch";

type StudioCommandCenterProps = {
  onInitialized?: (payload: {
    requestId: string | null;
    input: string;
    content: string;
    vertical: StudioVertical;
    platform: string;
    voice: string;
    contentState: "success";
    nextActions?: string[];
    notes?: string | null;
    compliance?: {
      status: "ok" | "adjusted";
      issues?: string[];
    } | null;
    replies?: string[];
    comments?: string[];
    followUp?: string | null;
    provider?: string | null;
    model?: string | null;
    generationTier?: string | null;
  }) => void;
  onStatusChange?: (status: "empty" | "loading" | "success" | "failure") => void;
};

type StudioDraft = {
  vertical: StudioVertical | "";
  goal: string;
  platform: string;
  voice: string;
};

// Explicit product rule for Block B: keep Studio vertical sticky per browser until deliberately changed.
const STORAGE_KEY = "synqra_studio_draft_v2";

const VERTICAL_DEFAULTS: Record<
  StudioVertical,
  {
    title: string;
    description: string;
    goalPlaceholder: string;
    voiceHelper: string;
    loadingCopy: string;
  }
> = {
  realtor: {
    title: "Trust-first, local, and ready to act",
    description: "Bias toward market authority, grounded confidence, and one clear next step.",
    goalPlaceholder:
      "Highlight local market knowledge, explain why a neighborhood matters now, or write a listing note that moves a qualified buyer to respond.",
    voiceHelper: "Direct is the safest default for realtor work. Premium works when the message needs more polish without losing trust.",
    loadingCopy: "Generating a trust-first draft with local authority and a clear next step.",
  },
  travel_advisor: {
    title: "Curated, discerning, and experience-led",
    description: "Bias toward curation, access, and composed confidence instead of loud luxury language.",
    goalPlaceholder:
      "Position a curated itinerary, explain why a destination requires expert planning, or write a note that makes discretion and access feel tangible.",
    voiceHelper: "Premium is the safest default for travel advisor work. Direct works when the message needs sharper commercial clarity.",
    loadingCopy: "Generating a curated draft with calm aspiration and credible detail.",
  },
};

const STARTER_BRIEFS: Record<StudioVertical, Array<{ label: string; goal: string; platform: string; voice: string }>> = {
  realtor: [
    {
      label: "Instagram local signal",
      goal: "Write an Instagram post that proves local market awareness in one specific neighborhood and ends with a clear next step.",
      platform: "Instagram",
      voice: "Direct",
    },
    {
      label: "LinkedIn authority note",
      goal: "Turn one market observation into a LinkedIn post that sounds credible, local, and useful to serious buyers or sellers.",
      platform: "LinkedIn",
      voice: "Direct",
    },
    {
      label: "Email seller follow-up",
      goal: "Write an email that reassures a seller with calm market authority and asks for one clear next conversation.",
      platform: "Email",
      voice: "Premium",
    },
  ],
  travel_advisor: [
    {
      label: "Instagram itinerary angle",
      goal: "Write an Instagram post that makes a curated itinerary feel specific, discreet, and experience-led without sounding overexcited.",
      platform: "Instagram",
      voice: "Premium",
    },
    {
      label: "LinkedIn planning case",
      goal: "Write a LinkedIn post that positions a travel advisor as the best choice for complex premium travel planning.",
      platform: "LinkedIn",
      voice: "Premium",
    },
    {
      label: "Email private follow-up",
      goal: "Write an email that introduces a curated travel planning approach with calm authority and one easy next step.",
      platform: "Email",
      voice: "Premium",
    },
  ],
};

function loadStoredDraft(): StudioDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StudioDraft>;
    const vertical = parsed.vertical === "realtor" || parsed.vertical === "travel_advisor" ? parsed.vertical : "";
    return {
      vertical,
      goal: typeof parsed.goal === "string" ? parsed.goal : "",
      platform: typeof parsed.platform === "string" ? parsed.platform : "",
      voice: typeof parsed.voice === "string" ? parsed.voice : "",
    };
  } catch {
    return null;
  }
}

export default function StudioCommandCenter({ onInitialized, onStatusChange }: StudioCommandCenterProps) {
  const [vertical, setVertical] = useState<StudioVertical | "">("");
  const [goal, setGoal] = useState("");
  const [platform, setPlatform] = useState("");
  const [voice, setVoice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitLockRef = useRef(false);
  const [touched, setTouched] = useState(false);
  const [hasLoadedDraft, setHasLoadedDraft] = useState(false);
  const [qualityFailure, setQualityFailure] = useState<string | null>(null);
  const { status, error, initializeProtocol, reset } = useCouncilDispatch();

  const isProcessing = status === "analysis";
  const submissionLocked = isSubmitting || isProcessing;
  const selectedVertical = vertical === "realtor" || vertical === "travel_advisor" ? vertical : null;
  const verticalDefaults = selectedVertical ? VERTICAL_DEFAULTS[selectedVertical] : null;
  const starterBriefs = selectedVertical ? STARTER_BRIEFS[selectedVertical] : [];
  const isValid = Boolean(selectedVertical && goal.trim().length > 0 && platform.length > 0 && voice.length > 0);

  useEffect(() => {
    const storedDraft = loadStoredDraft();
    if (!storedDraft) return;

    setVertical(storedDraft.vertical);
    setGoal(storedDraft.goal);
    setPlatform(storedDraft.platform);
    setVoice(storedDraft.voice);
    setHasLoadedDraft(Boolean(storedDraft.vertical || storedDraft.goal || storedDraft.platform || storedDraft.voice));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setHasLoadedDraft(Boolean(vertical || goal || platform || voice));
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        vertical,
        goal,
        platform,
        voice,
      })
    );
  }, [goal, platform, vertical, voice]);

  useEffect(() => {
    if (!selectedVertical) return;
    if (!voice) {
      setVoice(selectedVertical === "realtor" ? "Direct" : "Premium");
    }
  }, [selectedVertical, voice]);

  useEffect(() => {
    if (selectedVertical || goal || platform || voice || qualityFailure || error || isProcessing) {
      return;
    }
    onStatusChange?.("empty");
  }, [error, goal, isProcessing, onStatusChange, platform, qualityFailure, selectedVertical, voice]);

  const guidanceMessage = useMemo(() => {
    if (!touched) return null;
    if (!selectedVertical) {
      return "Select a vertical so Synqra can shape the draft for the right client context.";
    }
    if (!goal.trim() || !platform || !voice) {
      return "Complete the brief, platform, and voice before generation.";
    }
    return null;
  }, [goal, platform, selectedVertical, touched, voice]);

  const buildInput = () =>
    [
      `Vertical: ${selectedVertical}`,
      `Goal: ${goal.trim()}`,
      `Platform: ${platform}`,
      `Voice: ${voice}`,
      "Task: Create one polished draft for immediate use.",
    ].join("\n");

  const resetTransientState = () => {
    if (touched) {
      reset();
    }
    setQualityFailure(null);
    setTouched(false);
    onStatusChange?.("empty");
  };

  const handleSubmit = async () => {
    setTouched(true);

    if (!isValid || !selectedVertical) {
      return;
    }

    if (submitLockRef.current || submissionLocked) {
      return;
    }

    submitLockRef.current = true;
    setIsSubmitting(true);
    reset();
    setQualityFailure(null);
    onStatusChange?.("loading");

    try {
      const input = buildInput();
      const result = await initializeProtocol({
        vertical: selectedVertical,
        goal,
        platform,
        voice,
      });

      if (result.error) {
        setQualityFailure(result.error);
        onStatusChange?.("failure");
        return;
      }

      if (result.status === "done") {
        const content = result.draft || result.verdict?.consensus || "";
        const review = quickReviewStudioDraft({
          vertical: selectedVertical,
          platform,
          draft: content,
        });

        if (!review.passed) {
          console.warn(
            JSON.stringify({
              level: "warn",
              message: "studio.quality_gate.blocked",
              requestId: result.requestId || null,
              vertical: selectedVertical,
              platform,
              voice,
              reasonCodes: review.reasonCodes,
            })
          );
          setQualityFailure(review.message);
          onStatusChange?.("failure");
          return;
        }

        onStatusChange?.("success");
        onInitialized?.({
          requestId: result.requestId || null,
          input,
          content,
          vertical: selectedVertical,
          platform,
          voice,
          contentState: "success",
          nextActions: result.nextActions,
          notes: result.notes ?? null,
          compliance: result.compliance ?? null,
          replies: result.replies ?? [],
          comments: result.comments ?? [],
          followUp: result.followUp ?? null,
          provider: result.provider ?? null,
          model: result.model ?? null,
          generationTier: result.generationTier ?? null,
        });
        return;
      }

      onStatusChange?.("empty");
    } catch {
      setQualityFailure("Synqra could not complete the draft cleanly. Keep the ask tighter and try again.");
      onStatusChange?.("failure");
    } finally {
      submitLockRef.current = false;
      setIsSubmitting(false);
    }
  };

  const applyStarter = (starter: (typeof starterBriefs)[number]) => {
    setGoal(starter.goal);
    setPlatform(starter.platform);
    setVoice(starter.voice);
    setTouched(false);
    setQualityFailure(null);
    reset();
    onStatusChange?.("empty");
  };

  const restoreStoredDraft = () => {
    const storedDraft = loadStoredDraft();
    if (!storedDraft) return;
    setVertical(storedDraft.vertical);
    setGoal(storedDraft.goal);
    setPlatform(storedDraft.platform);
    setVoice(storedDraft.voice);
    setTouched(false);
    setQualityFailure(null);
    reset();
    onStatusChange?.("empty");
  };

  return (
    <section className="space-y-6 border border-ds-text-secondary/40 bg-ds-surface p-6">
      <div className="space-y-4">
        <h2 className="text-2xl font-medium leading-compact">{qualityFailure || error ? "Adjust request" : "Create draft"}</h2>
        <p className="max-w-2xl text-sm leading-copy text-ds-text-secondary">
          Choose the client context first, then generate one draft that feels credible, platform-aware, and ready to refine.
        </p>
      </div>

      <div className="space-y-3 border border-ds-text-secondary/20 bg-ds-bg/40 p-4">
        <p className="text-xs uppercase tracking-[0.14em] text-ds-text-secondary">Vertical</p>
        <div className="grid gap-3 md:grid-cols-2">
          <button
            type="button"
            onClick={() => {
              setVertical("realtor");
              setVoice("Direct");
              setQualityFailure(null);
              if (touched) reset();
              onStatusChange?.("empty");
            }}
            className={`border px-4 py-4 text-left transition-colors ${
              vertical === "realtor"
                ? "border-ds-gold bg-ds-bg/70 text-ds-text-primary"
                : "border-ds-text-secondary/30 text-ds-text-secondary hover:border-ds-gold/70 hover:text-ds-text-primary"
            }`}
            data-testid="studio-vertical-realtor"
            disabled={submissionLocked}
          >
            <p className="text-sm font-medium text-inherit">Realtor</p>
            <p className="mt-2 text-sm leading-copy text-inherit/80">Trust-first, local authority, and a clear next move.</p>
          </button>

          <button
            type="button"
            onClick={() => {
              setVertical("travel_advisor");
              setVoice("Premium");
              setQualityFailure(null);
              if (touched) reset();
              onStatusChange?.("empty");
            }}
            className={`border px-4 py-4 text-left transition-colors ${
              vertical === "travel_advisor"
                ? "border-ds-gold bg-ds-bg/70 text-ds-text-primary"
                : "border-ds-text-secondary/30 text-ds-text-secondary hover:border-ds-gold/70 hover:text-ds-text-primary"
            }`}
            data-testid="studio-vertical-travel-advisor"
            disabled={submissionLocked}
          >
            <p className="text-sm font-medium text-inherit">Travel advisor</p>
            <p className="mt-2 text-sm leading-copy text-inherit/80">Curated, aspirational, and experience-led.</p>
          </button>
        </div>

        {selectedVertical ? (
          <div className="border border-ds-gold/20 bg-ds-bg/40 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-ds-text-secondary">Vertical default</p>
            <p className="mt-2 text-sm font-medium leading-copy text-ds-text-primary">{verticalDefaults?.title}</p>
            <p className="mt-2 text-sm leading-copy text-ds-text-secondary">{verticalDefaults?.description}</p>
          </div>
        ) : null}

        {!selectedVertical && touched ? (
          <p className="text-sm leading-copy text-ds-gold">Select a vertical before creating a draft.</p>
        ) : null}
      </div>

      <div className="space-y-3 border border-ds-text-secondary/20 bg-ds-bg/40 p-4">
        <p className="text-xs uppercase tracking-[0.14em] text-ds-text-secondary">Good first run</p>
        {selectedVertical ? (
          <div className="flex flex-wrap gap-2">
            {starterBriefs.map((starter) => (
              <button
                key={starter.label}
                type="button"
                onClick={() => applyStarter(starter)}
                className="border border-ds-text-secondary/30 px-3 py-2 text-sm text-ds-text-primary transition-colors hover:border-ds-gold hover:text-ds-gold"
                disabled={submissionLocked}
              >
                {starter.label}
              </button>
            ))}
            {hasLoadedDraft ? (
              <button
                type="button"
                onClick={restoreStoredDraft}
                className="border border-ds-text-secondary/30 px-3 py-2 text-sm text-ds-text-secondary transition-colors hover:border-ds-gold hover:text-ds-gold"
                disabled={submissionLocked}
              >
                Restore last brief
              </button>
            ) : null}
          </div>
        ) : (
          <p className="text-sm leading-copy text-ds-text-secondary">
            Select a vertical first to load tailored examples and defaults.
          </p>
        )}
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="goal" className="block text-sm font-medium leading-copy">
              Goal
            </label>
            <span className="text-xs uppercase tracking-[0.12em] text-ds-text-secondary">outcome first</span>
          </div>
          <textarea
            id="goal"
            rows={5}
            value={goal}
            onChange={(event) => {
              setGoal(event.target.value);
              resetTransientState();
            }}
            className="w-full border border-ds-text-secondary/40 bg-ds-bg px-4 py-3 text-sm leading-copy outline-none focus:border-ds-gold"
            placeholder={
              verticalDefaults?.goalPlaceholder ??
              "Select a vertical first, then write the exact action you want the draft to drive."
            }
            disabled={submissionLocked}
            data-testid="studio-goal"
          />
          <p className="text-xs leading-copy text-ds-text-secondary">
            {selectedVertical
              ? "Write the business result you want, not just the topic."
              : "Choose the client context first so Synqra can shape the brief correctly."}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="platform" className="block text-sm font-medium leading-copy">
              Platform
            </label>
            <select
              id="platform"
              value={platform}
              onChange={(event) => {
                setPlatform(event.target.value);
                resetTransientState();
              }}
              disabled={submissionLocked}
              className="w-full border border-ds-text-secondary/40 bg-ds-bg px-4 py-2 text-sm leading-copy outline-none focus:border-ds-gold"
              data-testid="studio-platform"
            >
              <option value="">Select platform</option>
              <option value="Instagram">Instagram</option>
              <option value="Email">Email</option>
              <option value="LinkedIn">LinkedIn</option>
            </select>
            <p className="text-xs leading-copy text-ds-text-secondary">Choose the first surface this message needs to work on.</p>
          </div>

          <div className="space-y-2">
            <label htmlFor="voice" className="block text-sm font-medium leading-copy">
              Voice
            </label>
            <select
              id="voice"
              value={voice}
              onChange={(event) => {
                setVoice(event.target.value);
                resetTransientState();
              }}
              disabled={submissionLocked}
              className="w-full border border-ds-text-secondary/40 bg-ds-bg px-4 py-2 text-sm leading-copy outline-none focus:border-ds-gold"
              data-testid="studio-voice"
            >
              <option value="">Select voice</option>
              <option value="Direct">Direct</option>
              <option value="Premium">Premium</option>
            </select>
            <p className="text-xs leading-copy text-ds-text-secondary">
              {verticalDefaults?.voiceHelper ?? "Select a vertical first to load the right tone default."}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submissionLocked}
            className="w-full bg-ds-gold px-4 py-3 text-sm font-medium leading-copy text-ds-bg disabled:opacity-60"
            data-testid="studio-create"
          >
            {submissionLocked ? "Creating..." : "Create"}
          </button>

          {submissionLocked ? (
            <div className="border border-ds-gold/40 bg-ds-bg/50 p-4 text-sm leading-copy text-ds-text-secondary">
              {verticalDefaults?.loadingCopy ?? "Generating now. Synqra is shaping one clean first draft for the selected path."}
            </div>
          ) : null}

          {guidanceMessage ? <p className="text-sm leading-copy text-ds-gold">{guidanceMessage}</p> : null}

          {qualityFailure ? (
            <div className="space-y-2 border border-ds-gold/40 bg-ds-bg/50 p-4" data-testid="studio-failure-state">
              <p className="text-sm leading-copy text-ds-gold">{qualityFailure}</p>
              <p className="text-xs leading-copy text-ds-text-secondary">
                {qualityFailure.includes("try again in a moment")
                  ? "The request path is intact. Give Synqra a moment, then rerun from the same brief."
                  : "Keep the ask tighter, choose the cleanest surface, and rerun only when the brief matches the client context."}
              </p>
            </div>
          ) : null}

          {!qualityFailure && error ? (
            <div className="space-y-2 border border-ds-gold/40 bg-ds-bg/50 p-4" data-testid="studio-failure-state">
              <p className="text-sm leading-copy text-ds-gold">{error}</p>
              <p className="text-xs leading-copy text-ds-text-secondary">
                Synqra could not return a draft cleanly. Tighten the brief and try again.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
