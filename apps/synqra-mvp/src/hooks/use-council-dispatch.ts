"use client";

import { useCallback, useState } from "react";

export type CouncilStatus = "idle" | "governance" | "analysis" | "done" | "error";

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

const deriveRiskLabel = (riskLevel?: number): string => {
  if (typeof riskLevel !== "number") return "UNKNOWN";
  if (riskLevel >= 80) return "CRITICAL";
  if (riskLevel >= 50) return "ELEVATED";
  if (riskLevel > 0) return "SAFE";
  return "BASELINE";
};

const buildGovernancePayload = (input: string) => ({
  action: {
    type: "content_generation",
    metadata: { input: input.slice(0, 120) },
  },
  accountState: {
    balance: 0,
    currentDailyPnL: 0,
    currentWeeklyPnL: 0,
    tradesToday: 0,
    consecutiveLosses: 0,
    isLocked: false,
  },
  recentTrades: [],
  sessionData: {
    startTime: Date.now() - 30 * 60 * 1000,
    errors: 0,
    totalActions: 0,
  },
  product: "synqra",
});

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
          error: "SYSTEM UNREACHABLE",
          requestId: null,
        };
        setStatus("error");
        setError(invalidState.error);
        setVerdict(null);
        return invalidState;
      }

      setStatus("governance");
      setVerdict(null);
      setError(null);

      try {
        const { createClient } = await import("@supabase/supabase-js");
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseAnonKey) {
          const unreachable: CouncilDispatchState = {
            status: "error",
            verdict: null,
            error: "SYSTEM UNREACHABLE",
            requestId: null,
          };
          setStatus("error");
          setError(unreachable.error);
          return unreachable;
        }

        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          const unreachable: CouncilDispatchState = {
            status: "error",
            verdict: null,
            error: "SYSTEM UNREACHABLE",
            requestId: null,
          };
          setStatus("error");
          setError(unreachable.error);
          return unreachable;
        }

        const authHeader = `Bearer ${session.access_token}`;

        // Step 1: Governance check
        const governanceResponse = await fetch("/api/council/governance", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: authHeader,
          },
          body: JSON.stringify(buildGovernancePayload(normalizedInput)),
        }).catch((fetchError) => {
          console.error("Governance request failed:", fetchError);
          return null;
        });

        if (!governanceResponse) {
          const unreachable: CouncilDispatchState = {
            status: "error",
            verdict: null,
            error: "SYSTEM UNREACHABLE",
            requestId: null,
          };
          setStatus("error");
          setError(unreachable.error);
          return unreachable;
        }

        const governanceBody = await governanceResponse.json().catch(() => null);
        const governanceRisk = deriveRiskLabel(governanceBody?.verdict?.riskLevel);

        if (!governanceResponse.ok || !governanceBody?.verdict?.allowed) {
          const rejected: CouncilDispatchState = {
            status: "error",
            verdict: {
              approved: false,
              risk: governanceRisk,
              consensus: governanceBody?.verdict?.reason || "Action blocked by governance",
            },
            error: governanceBody?.error || "SYSTEM UNREACHABLE",
            requestId: null,
          };
          setVerdict(rejected.verdict);
          setStatus("error");
          setError(rejected.error);
          return rejected;
        }

        // Step 2: Council analysis (stream-aware)
        setStatus("analysis");
        let consensusText = "";
        let requestId: string | null = null;

        const councilResponse = await fetch("/api/council", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: authHeader,
          },
          body: JSON.stringify({ prompt: normalizedInput }),
        }).catch((fetchError) => {
          console.error("Council request failed:", fetchError);
          return null;
        });

        if (!councilResponse) {
          const unreachable: CouncilDispatchState = {
            status: "error",
            verdict: {
              approved: false,
              risk: governanceRisk,
              consensus: "Council unavailable",
            },
            error: "SYSTEM UNREACHABLE",
            requestId: null,
          };
          setVerdict(unreachable.verdict);
          setStatus("error");
          setError(unreachable.error);
          return unreachable;
        }

        const contentType = councilResponse.headers.get("content-type") || "";
        const responseClone = contentType.includes("application/json") ? councilResponse.clone() : null;

        if (contentType.includes("text/event-stream") && councilResponse.body?.getReader) {
          const reader = councilResponse.body.getReader();
          const decoder = new TextDecoder();
          setVerdict({ approved: true, risk: governanceRisk, consensus: "" });

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            consensusText += decoder.decode(value, { stream: true });
            setVerdict({ approved: true, risk: governanceRisk, consensus: consensusText });
          }

          consensusText += decoder.decode();
        }

        if (!consensusText) {
          const councilBody = responseClone !== null ? await responseClone.json().catch(() => null) : null;
          consensusText =
            councilBody?.consensus ||
            councilBody?.responses?.[0]?.response ||
            councilBody?.responses?.[0]?.content ||
            "";
          requestId = councilBody?.metadata?.requestId || councilBody?.request_id || null;
        }

        if (!councilResponse.ok) {
          const failed: CouncilDispatchState = {
            status: "error",
            verdict: {
              approved: false,
              risk: governanceRisk,
              consensus: consensusText || "Council analysis failed",
            },
            error: "SYSTEM UNREACHABLE",
            requestId,
          };
          setVerdict(failed.verdict);
          setStatus("error");
          setError(failed.error);
          return failed;
        }

        const finalVerdict: CouncilDispatchState = {
          status: "done",
          verdict: {
            approved: true,
            risk: governanceRisk,
            consensus: consensusText || "Council analysis complete",
          },
          error: null,
          requestId,
        };

        setVerdict(finalVerdict.verdict);
        setStatus("done");
        setError(null);
        return finalVerdict;
      } catch (err) {
        console.error("Protocol initialization failed:", err);
        const unreachable: CouncilDispatchState = {
          status: "error",
          verdict,
          error: "SYSTEM UNREACHABLE",
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
