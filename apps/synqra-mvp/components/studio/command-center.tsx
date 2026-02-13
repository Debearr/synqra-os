"use client";

import { useState } from "react";
import { useCouncilDispatch } from "@/hooks/use-council-dispatch";

type StudioCommandCenterProps = {
  onInitialized?: (payload: { requestId: string | null; input: string; content: string }) => void;
  onStatusChange?: (status: "ready" | "processing" | "complete" | "adjust") => void;
};

export default function StudioCommandCenter({ onInitialized, onStatusChange }: StudioCommandCenterProps) {
  const [goal, setGoal] = useState("");
  const [platform, setPlatform] = useState("");
  const [voice, setVoice] = useState("");
  const [touched, setTouched] = useState(false);
  const { status, error, initializeProtocol, reset } = useCouncilDispatch();

  const isProcessing = status === "analysis";
  const isError = status === "error";
  const isValid = goal.trim().length > 0 && platform.length > 0 && voice.length > 0;

  const buildInput = () =>
    [`Goal: ${goal.trim()}`, `Platform: ${platform}`, `Voice: ${voice}`, "Task: Create one polished draft for immediate use."].join(
      "\n"
    );

  const handleSubmit = async () => {
    if (!isValid) {
      setTouched(true);
      return;
    }

    setTouched(true);
    reset();
    onStatusChange?.("processing");

    try {
      const input = buildInput();
      const result = await initializeProtocol(input);
      if (result.error) {
        onStatusChange?.("adjust");
        return;
      }
      if (result.status === "done") {
        onStatusChange?.("complete");
        onInitialized?.({
          requestId: result.requestId || null,
          input,
          content: result.verdict?.consensus || "",
        });
        return;
      }
      onStatusChange?.("ready");
    } catch {
      onStatusChange?.("adjust");
    }
  };

  return (
    <section className="space-y-6 border border-ds-text-secondary/40 bg-ds-surface p-6">
      <div className="space-y-4">
        <h2 className="text-2xl font-medium leading-compact">{isError ? "Adjust request" : "Create draft"}</h2>
        <p className="text-sm leading-copy text-ds-text-secondary">
          Enter a goal, choose a platform, and choose a voice. Output is generated deterministically for Journey V1.
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="goal" className="block text-sm font-medium leading-copy">
            Goal
          </label>
          <textarea
            id="goal"
            rows={4}
            value={goal}
            onChange={(event) => {
              setGoal(event.target.value);
              if (touched) reset();
            }}
            className="w-full border border-ds-text-secondary/40 bg-ds-bg px-4 py-2 text-sm leading-copy outline-none focus:border-ds-gold"
            placeholder="Launch a founder announcement this week."
            disabled={isProcessing}
          />
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
                if (touched) reset();
              }}
              disabled={isProcessing}
              className="w-full border border-ds-text-secondary/40 bg-ds-bg px-4 py-2 text-sm leading-copy outline-none focus:border-ds-gold"
            >
              <option value="">Select platform</option>
              <option value="Instagram">Instagram</option>
              <option value="Email">Email</option>
            </select>
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
                if (touched) reset();
              }}
              disabled={isProcessing}
              className="w-full border border-ds-text-secondary/40 bg-ds-bg px-4 py-2 text-sm leading-copy outline-none focus:border-ds-gold"
            >
              <option value="">Select voice</option>
              <option value="Direct">Direct</option>
              <option value="Premium">Premium</option>
              <option value="Playful">Playful</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isValid || isProcessing}
            className="w-full bg-ds-gold px-4 py-2 text-sm font-medium leading-copy text-ds-bg disabled:opacity-60"
          >
            {isProcessing ? "Processing..." : "Create"}
          </button>

          {!isValid && touched ? (
            <p className="text-sm leading-copy text-ds-gold">All fields are required before creation.</p>
          ) : null}

          {error ? <p className="text-sm leading-copy text-ds-gold">{error}</p> : null}
        </div>
      </div>
    </section>
  );
}
