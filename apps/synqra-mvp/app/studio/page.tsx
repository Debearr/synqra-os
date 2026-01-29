"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import CalibrationModal from "@/components/portal/calibration-modal";
import StatusQ from "@/components/StatusQ";
import StudioCommandCenter from "@/components/studio/command-center";

export default function StudioPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [showCalibration, setShowCalibration] = useState(false);
  const [councilResponse, setCouncilResponse] = useState<any>(null);
  const [councilStatus, setCouncilStatus] = useState<
    "idle" | "loading" | "ready" | "error" | "timeout" | "empty"
  >("idle");
  const [councilError, setCouncilError] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [input, setInput] = useState<string | null>(null);
  const councilTimeoutRef = useRef<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    return () => {
      if (councilTimeoutRef.current) {
        window.clearTimeout(councilTimeoutRef.current);
        councilTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const checkUserAndLoad = async () => {
      const getCookie = (name: string): string | null => {
        if (typeof document === "undefined") return null;
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
        return null;
      };

      const identityCode = getCookie("synqra_auth");

      if (identityCode) {
        const persistedRequestId = localStorage.getItem("synqra_request_id");
        const persistedInput =
          localStorage.getItem("synqra_input") || identityCode;

        if (persistedInput && persistedRequestId) {
          setRequestId(persistedRequestId);
          setInput(persistedInput);
          console.info("[demo] studio init: loading council");
          await loadCouncilResponse(persistedInput, persistedRequestId);
        } else {
          setInput(identityCode);
        }

        setIsLoading(false);
        return;
      }

      setIsLoading(false);
    };

    checkUserAndLoad();
  }, [router]);

  const loadCouncilResponse = async (
    prompt: string,
    existingRequestId?: string
  ) => {
    try {
      setCouncilStatus("loading");
      setCouncilError(null);
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      // NEVER throw — cookie-only mode must work without Supabase
      if (!supabaseUrl || !supabaseKey) {
        console.log("Supabase not configured — skipping council load.");
        setCouncilStatus("empty");
        return null;
      }

      const supabase = createClient(supabaseUrl, supabaseKey);
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      const controller = new AbortController();
      if (councilTimeoutRef.current) {
        window.clearTimeout(councilTimeoutRef.current);
      }
      councilTimeoutRef.current = window.setTimeout(() => {
        controller.abort();
      }, 8000);

      const response = await fetch("/api/council", {
        method: "POST",
        headers,
        body: JSON.stringify({ prompt }),
        signal: controller.signal,
      });

      if (councilTimeoutRef.current) {
        window.clearTimeout(councilTimeoutRef.current);
        councilTimeoutRef.current = null;
      }

      if (!response.ok) {
        console.warn("[demo] studio council load failed", response.status);
        setCouncilStatus("error");
        setCouncilError("SYSTEM UNREACHABLE");
        return null;
      }

      const data = await response.json();
      const newRequestId = data.metadata?.requestId || data.request_id;

      if (newRequestId) {
        setRequestId(newRequestId);
        localStorage.setItem("synqra_request_id", newRequestId);
      }

      const consensusText =
        data?.consensus || data?.responses?.[0]?.content || data?.responses?.[0]?.response || "";
      if (!consensusText) {
        console.info("[demo] studio council empty");
        setCouncilResponse(data);
        setCouncilStatus("empty");
        return data;
      }

      setCouncilResponse(data);
      setCouncilStatus("ready");
      console.info("[demo] studio council ready");
      return data;
    } catch (error) {
      if (councilTimeoutRef.current) {
        window.clearTimeout(councilTimeoutRef.current);
        councilTimeoutRef.current = null;
      }
      if (error instanceof DOMException && error.name === "AbortError") {
        console.warn("[demo] studio council timeout");
        setCouncilStatus("timeout");
        setCouncilError("SYSTEM UNREACHABLE");
        return null;
      }
      console.error("Council load skipped:", error);
      setCouncilStatus("error");
      setCouncilError("SYSTEM UNREACHABLE");
      return null;
    }
  };

  const handleCalibrationComplete = () => {
    setShowCalibration(false);
    if (input) {
      loadCouncilResponse(input, requestId || undefined);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-noid-black text-white">
        <StatusQ status="generating" label="Loading" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-noid-black text-white">
      <StatusQ
        status={
          councilStatus === "loading"
            ? "generating"
            : councilStatus === "ready"
            ? "complete"
            : councilStatus === "error" || councilStatus === "timeout"
            ? "error"
            : "idle"
        }
        label={
          councilStatus === "loading"
            ? "Loading"
            : councilStatus === "ready"
            ? "Ready"
            : councilStatus === "error" || councilStatus === "timeout"
            ? "Error"
            : "Idle"
        }
      />

      <div className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="mb-8 font-mono text-2xl uppercase tracking-[0.16em] text-white">
          Studio
        </h1>

        {(councilStatus === "error" || councilStatus === "timeout") && (
          <div className="mb-6 rounded-xl border border-red-500/40 bg-red-500/10 p-4">
            <div className="font-mono text-xs uppercase tracking-[0.16em] text-red-400">
              {councilError || "SYSTEM UNREACHABLE"}
            </div>
            {input && (
              <button
                type="button"
                onClick={() => loadCouncilResponse(input, requestId || undefined)}
                className="mt-3 rounded-full border border-red-400/40 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-red-200 transition-opacity hover:opacity-90"
              >
                Retry
              </button>
            )}
          </div>
        )}

        {councilStatus === "empty" && !councilResponse && (
          <div className="mb-6 rounded-xl border border-noid-silver/20 bg-noid-black/40 p-4">
            <div className="font-mono text-xs uppercase tracking-[0.16em] text-noid-silver/70">
              No response
            </div>
          </div>
        )}

        {councilResponse ? (
          <div className="rounded-xl border border-noid-silver/20 bg-noid-black p-6">
            <h2 className="mb-4 font-mono text-sm uppercase tracking-[0.16em] text-noid-silver/70">
              Response
            </h2>
            <div className="font-mono text-sm leading-relaxed text-white/90">
              {councilResponse.consensus ||
                councilResponse.responses?.[0]?.content ||
                "No response"}
            </div>
          </div>
        ) : (
          <StudioCommandCenter
            onInitialized={async (newRequestId, newInput) => {
              setRequestId(newRequestId);
              setInput(newInput);
              await loadCouncilResponse(newInput, newRequestId);
            }}
          />
        )}
      </div>

      <CalibrationModal
        isOpen={showCalibration}
        onComplete={handleCalibrationComplete}
      />
    </main>
  );
}
