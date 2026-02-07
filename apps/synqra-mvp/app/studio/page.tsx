"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import CalibrationModal from "@/components/portal/calibration-modal";
import StatusQ from "@/components/StatusQ";
import StudioCommandCenter from "@/components/studio/command-center";

type CouncilResponse = {
  consensus?: string;
  responses?: Array<{ content?: string; response?: string }>;
  metadata?: { requestId?: string };
  request_id?: string;
};

export default function StudioPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [showCalibration, setShowCalibration] = useState(false);
  const [councilResponse, setCouncilResponse] = useState<CouncilResponse | null>(null);
  const [councilStatus, setCouncilStatus] = useState<
    "idle" | "loading" | "ready" | "error" | "timeout" | "empty"
  >("idle");
  const [, setCouncilError] = useState<string | null>(null);
  const [frameFile, setFrameFile] = useState<File | null>(null);
  const [frameUploadStatus, setFrameUploadStatus] = useState<
    "idle" | "uploading" | "ready" | "error"
  >("idle");
  const [, setFrameUploadError] = useState<string | null>(null);
  const [frameImageUrl, setFrameImageUrl] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [input, setInput] = useState<string | null>(null);
  const councilTimeoutRef = useRef<number | null>(null);
  const router = useRouter();
  const isStudioHold =
    frameUploadStatus === "error" ||
    councilStatus === "error" ||
    councilStatus === "timeout";

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
    void existingRequestId;
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

  const handleFrameUpload = async () => {
    if (!frameFile) {
      setFrameUploadStatus("error");
      setFrameUploadError("Add an image to continue.");
      return;
    }

    setFrameUploadStatus("uploading");
    setFrameUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", frameFile);
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "Upload failed");
      }
      setFrameImageUrl(payload.url);
      setFrameUploadStatus("ready");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed";
      setFrameUploadStatus("error");
      setFrameUploadError(message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-noid-black text-white">
        <StatusQ status="generating" label="Loading" />
      </div>
    );
  }

  if (isStudioHold) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-noid-black text-white">
        <div className="text-center">
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-noid-silver/70">
            UPLINK CALIBRATION IN PROGRESS. STUDIO OFFLINE FOR VALIDATION.
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-noid-black text-white">
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

      <div className="pointer-events-none absolute inset-x-0 top-0 h-[320px]">
        <Image
          src="/assets/atmosphere-glow.jpg"
          alt=""
          fill
          sizes="(max-width: 1024px) 100vw, 1024px"
          style={{ objectFit: "cover", opacity: 0.2 }}
        />
      </div>

      <div className="mx-auto max-w-5xl px-6 py-10 md:py-14">
        <h1 className="mb-8 font-display text-3xl uppercase tracking-[0.38em] text-white md:text-4xl">
          Synqra Frame
        </h1>

        <div className="mb-8 rounded-xl border border-noid-silver/20 bg-noid-black/60 p-6 backdrop-blur-md">
          <div className="mb-4">
            <div className="font-mono text-xs uppercase tracking-[0.16em] text-noid-silver/70">
              Frame image input
            </div>
            <div className="mt-2 text-sm text-white/70">
              Upload a listing photo. Frame produces a staged image and passes it into Synqra as a media input.
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
            <div className="rounded-lg border border-noid-silver/35 bg-noid-black/60 px-4 py-3">
              <input
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const nextFile = event.target.files?.[0] ?? null;
                  setFrameFile(nextFile);
                  setFrameUploadStatus("idle");
                  setFrameUploadError(null);
                  setFrameImageUrl(null);
                }}
                className="w-full text-sm text-noid-silver file:mr-4 file:rounded-full file:border-0 file:bg-noid-gold file:px-4 file:py-2 file:text-xs file:font-semibold file:uppercase file:tracking-[0.2em] file:text-noid-black hover:file:opacity-95"
              />
              {frameFile && (
                <div className="mt-2 text-xs text-noid-silver/70">{frameFile.name}</div>
              )}
            </div>
            <button
              type="button"
              onClick={handleFrameUpload}
              disabled={frameUploadStatus === "uploading"}
              className="rounded-full bg-noid-gold px-6 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-noid-black transition-opacity hover:opacity-95 active:opacity-90 disabled:opacity-50"
            >
              {frameUploadStatus === "uploading" ? "Uploading" : "Upload image"}
            </button>
          </div>
          {frameImageUrl && (
            <div className="mt-4 rounded-lg border border-noid-silver/20 bg-noid-black/40 px-4 py-3 text-xs text-noid-silver">
              Stored media URL: {frameImageUrl}
            </div>
          )}
        </div>

        {councilStatus === "empty" && !councilResponse && (
          <div className="mb-6 rounded-xl border border-noid-silver/20 bg-noid-black/40 p-4">
            <div className="font-mono text-xs uppercase tracking-[0.16em] text-noid-silver/70">
              Component restricted. Internal validation in progress.
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
