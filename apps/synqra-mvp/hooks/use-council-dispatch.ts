"use client";

import { useCallback, useState } from "react";
import { createBrowserSupabaseClient } from "@/utils/supabase/client";

export type CouncilStatus = "idle" | "analysis" | "done" | "error";

export type CouncilVerdict = {
  approved: boolean;
  risk: string;
  consensus: string;
};

export type StudioDraftRequest = {
  vertical: "realtor" | "travel_advisor";
  goal: string;
  platform: string;
  voice: string;
};

export type StudioComplianceState = {
  status: "ok" | "adjusted";
  issues?: string[];
};

export interface CouncilDispatchState {
  status: CouncilStatus;
  verdict: CouncilVerdict | null;
  error: string | null;
  requestId?: string | null;
  draft?: string | null;
  nextActions?: string[];
  notes?: string | null;
  provider?: string | null;
  model?: string | null;
  generationTier?: string | null;
  compliance?: StudioComplianceState | null;
  replies?: string[];
  comments?: string[];
  followUp?: string | null;
}

type CouncilResponse = {
  draft?: string;
  next_actions?: string[];
  notes?: string;
  compliance?: StudioComplianceState;
  replies?: string[];
  comments?: string[];
  follow_up?: string;
  provider?: string;
  model?: string;
  tier?: string;
  content?: string;
  consensus?: string;
  responses?: Array<{ response?: string; content?: string }>;
  metadata?: {
    requestId?: string;
    risk?: string;
  };
  error?: string;
  message?: string;
  request_id?: string;
};

const RESTRICTED_MESSAGE = "Restricted by governance.";
const PROVIDER_UNAVAILABLE_MESSAGE = "Synqra could not complete this draft cleanly right now. Please try again in a moment.";
const COUNCIL_RETRY_DELAY_MS = 800;
const COUNCIL_TIMEOUT_MS = 20000;

type CouncilRequestPayload = {
  prompt: string;
  studio: {
    goal: string;
    platform: string;
    voice: string;
  };
  tenant: {
    vertical: string;
  };
};

function isRetryableCouncilError(message: string | null | undefined): boolean {
  const normalizedMessage = message?.toLowerCase() ?? "";
  return (
    normalizedMessage.includes("503") ||
    normalizedMessage.includes("timeout") ||
    normalizedMessage.includes("failed to fetch") ||
    normalizedMessage.includes("networkerror") ||
    normalizedMessage.includes("network request failed")
  );
}

async function dispatchWithRetry<T>(fn: () => Promise<T>) {
  try {
    return await fn();
  } catch (err) {
    if (!isRetryableCouncilError(err instanceof Error ? err.message : null)) {
      throw err;
    }

    await new Promise((resolve) => setTimeout(resolve, COUNCIL_RETRY_DELAY_MS));
    return await fn();
  }
}

function normalizeError(err: unknown) {
  if (isRetryableCouncilError(err instanceof Error ? err.message : null)) {
    return new Error(PROVIDER_UNAVAILABLE_MESSAGE);
  }

  return new Error(RESTRICTED_MESSAGE);
}

async function dispatchToCouncil(authHeader: string | null, payload: CouncilRequestPayload) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), COUNCIL_TIMEOUT_MS);

  try {
    const response = await fetch("/api/council", {
      method: "POST",
      headers: authHeader
        ? {
            "Content-Type": "application/json",
            Authorization: authHeader,
          }
        : {
            "Content-Type": "application/json",
          },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (response.status === 503) {
      throw new Error("503 creation provider unavailable");
    }

    return response;
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error("timeout");
    }

    throw err;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function parseCouncilResponse(response: Response) {
  let timeoutId: number | null = null;
  try {
    return (await Promise.race([
      response.json(),
      new Promise<null>((_, reject) => {
        timeoutId = window.setTimeout(() => reject(new Error("timeout")), COUNCIL_TIMEOUT_MS);
      }),
    ])) as CouncilResponse | null;
  } catch (parseError) {
    if (isRetryableCouncilError(parseError instanceof Error ? parseError.message : null)) {
      throw parseError;
    }

    console.error("Failed to parse council response:", parseError);
    return null;
  } finally {
    if (timeoutId !== null) {
      window.clearTimeout(timeoutId);
    }
  }
}

async function sendCouncilRequest(authHeader: string | null, payload: CouncilRequestPayload) {
  const response = await dispatchToCouncil(authHeader, payload);
  const body = await parseCouncilResponse(response);
  return { response, body };
}

function resolveCouncilErrorMessage(
  response: Response,
  body: CouncilResponse | null,
  fallbackRisk: string
): string {
  if (response.status === 503 || body?.error === "Creation provider unavailable") {
    return PROVIDER_UNAVAILABLE_MESSAGE;
  }

  if (response.status === 403) {
    return RESTRICTED_MESSAGE;
  }

  if (typeof body?.message === "string" && body.message.trim()) {
    return body.message.trim();
  }

  if (typeof body?.error === "string" && body.error.trim()) {
    return body.error.trim();
  }

  if (fallbackRisk === "CRITICAL") {
    return PROVIDER_UNAVAILABLE_MESSAGE;
  }

  return RESTRICTED_MESSAGE;
}

export function useCouncilDispatch() {
  const [status, setStatus] = useState<CouncilStatus>("idle");
  const [verdict, setVerdict] = useState<CouncilVerdict | null>(null);
  const [error, setError] = useState<string | null>(null);

  const initializeProtocol = useCallback(
    async (input: StudioDraftRequest): Promise<CouncilDispatchState> => {
      const normalizedGoal = input.goal.trim();
      const normalizedVertical = input.vertical.trim();
      const normalizedPlatform = input.platform.trim();
      const normalizedVoice = input.voice.trim();

      if (!normalizedGoal || !normalizedVertical || !normalizedPlatform || !normalizedVoice) {
        const invalidState: CouncilDispatchState = {
          status: "error",
          verdict: null,
          error: RESTRICTED_MESSAGE,
          requestId: null,
        };
        setStatus("error");
        setError(invalidState.error);
        setVerdict(null);
        return invalidState;
      }

      setStatus("analysis");
      setVerdict(null);
      setError(null);

      const serializedPrompt = [
        `Vertical: ${normalizedVertical}`,
        `Goal: ${normalizedGoal}`,
        `Platform: ${normalizedPlatform}`,
        `Voice: ${normalizedVoice}`,
        "Task: Create one polished draft for immediate use.",
      ].join("\n");
      const councilPayload: CouncilRequestPayload = {
        prompt: serializedPrompt,
        studio: {
          goal: normalizedGoal,
          platform: normalizedPlatform,
          voice: normalizedVoice,
        },
        tenant: {
          vertical: normalizedVertical,
        },
      };

      try {
        let authHeader: string | null = null;
        const supabase = createBrowserSupabaseClient();
        if (supabase) {
          try {
            const {
              data: { session },
            } = await supabase.auth.getSession();
            if (session?.access_token) {
              authHeader = `Bearer ${session.access_token}`;
            }
          } catch (sessionError) {
            console.warn("Session lookup failed, continuing as guest:", sessionError);
          }
        }

        const { response: councilResponse, body: councilBody } = await dispatchWithRetry(() =>
          sendCouncilRequest(authHeader, councilPayload)
        );

        const governanceRisk = councilBody?.metadata?.risk || "BASELINE";
        const responseDraft =
          councilBody?.draft ||
          councilBody?.content ||
          councilBody?.consensus ||
          councilBody?.responses?.[0]?.response ||
          councilBody?.responses?.[0]?.content ||
          "";
        const requestId = councilBody?.metadata?.requestId || councilBody?.request_id || null;

        if (!councilResponse.ok) {
          const resolvedErrorMessage = resolveCouncilErrorMessage(councilResponse, councilBody, governanceRisk);
          const failed: CouncilDispatchState = {
            status: "error",
            verdict: {
              approved: false,
              risk: governanceRisk,
              consensus: responseDraft || councilBody?.message || councilBody?.error || "Council analysis failed",
            },
            error: resolvedErrorMessage,
            requestId,
          };
          setVerdict(failed.verdict);
          setStatus("error");
          setError(failed.error);
          return failed;
        }

        if (!responseDraft) {
          const contractMismatch: CouncilDispatchState = {
            status: "error",
            verdict: null,
            error: RESTRICTED_MESSAGE,
            requestId: null,
          };
          setStatus("error");
          setError(contractMismatch.error);
          setVerdict(null);
          return contractMismatch;
        }

        const finalVerdict: CouncilDispatchState = {
          status: "done",
          verdict: {
            approved: true,
            risk: governanceRisk,
            consensus: responseDraft || "Council analysis complete",
          },
          error: null,
          requestId,
          draft: responseDraft,
          nextActions: councilBody?.next_actions ?? [],
          notes: councilBody?.notes ?? null,
          provider: councilBody?.provider ?? null,
          model: councilBody?.model ?? null,
          generationTier: councilBody?.tier ?? null,
          compliance: councilBody?.compliance ?? null,
          replies: councilBody?.replies ?? [],
          comments: councilBody?.comments ?? [],
          followUp: councilBody?.follow_up ?? null,
        };

        if (typeof window !== "undefined") {
          localStorage.setItem("synqra_input", serializedPrompt);
          if (requestId) {
            localStorage.setItem("synqra_request_id", requestId);
          }
        }

        setVerdict(finalVerdict.verdict);
        setStatus("done");
        setError(null);
        return finalVerdict;
      } catch (err) {
        const normalizedError = normalizeError(err);
        console.error("Protocol initialization failed:", normalizedError);
        const unreachable: CouncilDispatchState = {
          status: "error",
          verdict: {
            approved: false,
            risk: "CRITICAL",
            consensus:
              normalizedError.message === PROVIDER_UNAVAILABLE_MESSAGE
                ? "Council provider temporarily unavailable"
                : "Council unavailable",
          },
          error: normalizedError.message,
          requestId: null,
        };
        setVerdict(unreachable.verdict);
        setStatus("error");
        setError(unreachable.error);
        return unreachable;
      }
    },
    []
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setVerdict(null);
    setError(null);
  }, []);

  return {
    status,
    verdict,
    error,
    initializeProtocol,
    reset,
  };
}
