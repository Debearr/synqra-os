"use client";

import { useCallback, useState } from "react";

type DispatchStatus = "idle" | "analysis" | "done" | "error";

type DispatchResult = {
  status: "done" | "error";
  requestId?: string;
  verdict?: { consensus: string };
  error?: string;
};

type CouncilPayload = {
  content?: string;
  consensus?: string;
  metadata?: {
    requestId?: string;
  };
  error?: string;
  message?: string;
};

function extractConsensus(payload: CouncilPayload | null): string {
  if (!payload) return "";
  if (typeof payload.consensus === "string" && payload.consensus.trim()) return payload.consensus.trim();
  if (typeof payload.content === "string" && payload.content.trim()) return payload.content.trim();
  return "";
}

export function useCouncilDispatch() {
  const [status, setStatus] = useState<DispatchStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
  }, []);

  const initializeProtocol = useCallback(async (input: string): Promise<DispatchResult> => {
    const prompt = input.trim();
    if (!prompt) {
      const message = "Prompt is required.";
      setStatus("error");
      setError(message);
      return { status: "error", error: message };
    }

    setStatus("analysis");
    setError(null);

    try {
      const response = await fetch("/api/council", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const payload = (await response.json().catch(() => null)) as CouncilPayload | null;
      if (!response.ok) {
        const message = payload?.message || payload?.error || "Generation failed.";
        setStatus("error");
        setError(message);
        return { status: "error", error: message };
      }

      const consensus = extractConsensus(payload);
      if (!consensus) {
        const message = "Generation returned empty content.";
        setStatus("error");
        setError(message);
        return { status: "error", error: message };
      }

      setStatus("done");
      return {
        status: "done",
        requestId: payload?.metadata?.requestId,
        verdict: { consensus },
      };
    } catch (unknownError) {
      const message = unknownError instanceof Error ? unknownError.message : "Generation failed.";
      setStatus("error");
      setError(message);
      return { status: "error", error: message };
    }
  }, []);

  return {
    status,
    error,
    initializeProtocol,
    reset,
  };
}
