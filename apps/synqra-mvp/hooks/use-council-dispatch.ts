"use client";

import { useCallback, useState } from "react";

export type CouncilStatus = "idle" | "analysis" | "done" | "error";

export type CouncilVerdict = {
  approved: boolean;
  risk: string;
  consensus: string;
};

export interface CouncilDispatchState {
  status: CouncilStatus;
  verdict: CouncilVerdict | null;
  error: string | null;
  requestId?: string | null;
}

type CouncilResponse = {
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

export function useCouncilDispatch() {
  const [status, setStatus] = useState<CouncilStatus>("idle");
  const [verdict, setVerdict] = useState<CouncilVerdict | null>(null);
  const [error, setError] = useState<string | null>(null);

  const initializeProtocol = useCallback(
    async (input: string): Promise<CouncilDispatchState> => {
      const normalizedInput = input.trim();
      if (!normalizedInput) {
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

      try {
        let authHeader: string | null = null;
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (supabaseUrl && supabaseAnonKey) {
          try {
            const { createClient } = await import("@supabase/supabase-js");
            const supabase = createClient(supabaseUrl, supabaseAnonKey);
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

        const councilResponse = await fetch("/api/council", {
          method: "POST",
          headers: authHeader
            ? {
                "Content-Type": "application/json",
                Authorization: authHeader,
              }
            : {
                "Content-Type": "application/json",
              },
          body: JSON.stringify({ prompt: normalizedInput }),
        }).catch((fetchError) => {
          console.error("Council request failed:", fetchError);
          const networkError: CouncilDispatchState = {
            status: "error",
            verdict: {
              approved: false,
              risk: "CRITICAL",
              consensus: "Network error prevented council analysis",
            },
            error: RESTRICTED_MESSAGE,
            requestId: null,
          };
          setVerdict(networkError.verdict);
          setStatus("error");
          setError(networkError.error);
          return null;
        });

        if (!councilResponse) {
          // Error already handled in catch block above
          const unreachable: CouncilDispatchState = {
            status: "error",
            verdict: {
              approved: false,
              risk: "CRITICAL",
              consensus: "Council unavailable",
            },
            error: RESTRICTED_MESSAGE,
            requestId: null,
          };
          setVerdict(unreachable.verdict);
          setStatus("error");
          setError(unreachable.error);
          return unreachable;
        }

        const councilBody = (await councilResponse.json().catch((parseError) => {
          console.error("Failed to parse council response:", parseError);
          return null;
        })) as CouncilResponse | null;

        const governanceRisk = councilBody?.metadata?.risk || "BASELINE";
        const responseContent =
          councilBody?.content ||
          councilBody?.consensus ||
          councilBody?.responses?.[0]?.response ||
          councilBody?.responses?.[0]?.content ||
          "";
        const requestId = councilBody?.metadata?.requestId || councilBody?.request_id || null;

        if (!councilResponse.ok) {
          const errorMessage = RESTRICTED_MESSAGE;

          const failed: CouncilDispatchState = {
            status: "error",
            verdict: {
              approved: false,
              risk: governanceRisk,
              consensus: responseContent || councilBody?.message || councilBody?.error || "Council analysis failed",
            },
            error: errorMessage,
            requestId,
          };
          setVerdict(failed.verdict);
          setStatus("error");
          setError(failed.error);
          return failed;
        }

        if (!responseContent) {
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
            consensus: responseContent || "Council analysis complete",
          },
          error: null,
          requestId,
        };

        if (typeof window !== "undefined") {
          localStorage.setItem("synqra_input", normalizedInput);
          if (requestId) {
            localStorage.setItem("synqra_request_id", requestId);
          }
        }

        setVerdict(finalVerdict.verdict);
        setStatus("done");
        setError(null);
        return finalVerdict;
      } catch (err) {
        console.error("Protocol initialization failed:", err);
        const errorMessage = RESTRICTED_MESSAGE;
        const unreachable: CouncilDispatchState = {
          status: "error",
          verdict,
          error: errorMessage,
          requestId: null,
        };
        setStatus("error");
        setError(unreachable.error);
        return unreachable;
      }
    },
    [verdict]
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
