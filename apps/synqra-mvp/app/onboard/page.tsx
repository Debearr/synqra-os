'use client';

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { UploadZone } from "@/components/pilot/UploadZone";
import {
  ExtractedProfile,
  ProfileReview,
} from "@/components/pilot/ProfileReview";

const emptyProfile: ExtractedProfile = {
  name: "",
  title: "",
  company: "",
  location: "",
  headline: "",
  summary: "",
  website: "",
  linkedin: "",
  twitter: "",
  newsletter: "",
  tone: "",
  contentPillars: [],
  proofPoints: [],
};

type ExtractPayload = {
  link?: string;
  file?: File | null;
};

export default function OnboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ExtractedProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [statusNote, setStatusNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const extractTimeoutRef = useRef<number | null>(null);
  const confirmTimeoutRef = useRef<number | null>(null);

  const handleExtract = async ({ link, file }: ExtractPayload) => {
    setIsLoading(true);
    setStatusNote(null);
    setError(null);
    setConfirmError(null);
    console.info("[demo] onboard extract start");

    const formData = new FormData();
    if (link) formData.append("link", link);
    if (file) formData.append("file", file);

    try {
      const controller = new AbortController();
      if (extractTimeoutRef.current) {
        window.clearTimeout(extractTimeoutRef.current);
      }
      extractTimeoutRef.current = window.setTimeout(() => {
        controller.abort();
      }, 8000);

      const response = await fetch("/api/onboard/extract", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      if (extractTimeoutRef.current) {
        window.clearTimeout(extractTimeoutRef.current);
        extractTimeoutRef.current = null;
      }

      if (!response.ok) {
        const message = await safeErrorMessage(response);
        setError(message || "We could not reach the extractor. Try again.");
        setProfile(null);
        setStatusNote(null);
        return;
      }

      const payload = await response.json().catch(() => null);
      const normalized = normalizeProfile(payload);

      if (!normalized) {
        setError("Extractor returned an empty response. Upload a different source or retry.");
        setProfile(null);
        setStatusNote(null);
        return;
      }

      setProfile(normalized);
      const payloadObj =
        payload && typeof payload === "object"
          ? (payload as Record<string, unknown>)
          : {};
      const confidence =
        typeof payloadObj.confidence === "number" ? payloadObj.confidence : null;
      if (confidence !== null && confidence < 0.5) {
        setStatusNote("Limited signal extracted. Please review.");
      } else {
        setStatusNote("Extractor responded. Edit anything; this is your draft.");
      }
      console.info("[demo] onboard extract complete", {
        confidence,
        hasProfile: true,
      });
    } catch (err) {
      if (extractTimeoutRef.current) {
        window.clearTimeout(extractTimeoutRef.current);
        extractTimeoutRef.current = null;
      }
      if (err instanceof DOMException && err.name === "AbortError") {
        setError("We could not reach the extractor. Please retry.");
        setProfile(null);
        return;
      }
      console.error("Extractor failed", err);
      setError("We could not reach the extractor. Please retry.");
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartOver = () => {
    setProfile(null);
    setError(null);
    setStatusNote(null);
    setConfirmError(null);
  };

  const handleConfirm = async () => {
    if (!profile) return;
    setIsConfirming(true);
    setConfirmError(null);
    setStatusNote(null);
    console.info("[demo] onboard confirm start");

    try {
      const controller = new AbortController();
      if (confirmTimeoutRef.current) {
        window.clearTimeout(confirmTimeoutRef.current);
      }
      confirmTimeoutRef.current = window.setTimeout(() => {
        controller.abort();
      }, 8000);

      const response = await fetch("/api/onboard/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile }),
        signal: controller.signal,
      });

      if (confirmTimeoutRef.current) {
        window.clearTimeout(confirmTimeoutRef.current);
        confirmTimeoutRef.current = null;
      }

      if (!response.ok) {
        const message = await safeErrorMessage(response);
        setConfirmError(message || "Unable to confirm right now. Try again.");
        setIsConfirming(false);
        return;
      }

      console.info("[demo] onboard confirm complete");
      router.push("/");
    } catch (err) {
      if (confirmTimeoutRef.current) {
        window.clearTimeout(confirmTimeoutRef.current);
        confirmTimeoutRef.current = null;
      }
      if (err instanceof DOMException && err.name === "AbortError") {
        setConfirmError("Network issue while confirming. Please retry.");
        setIsConfirming(false);
        return;
      }
      console.error("Confirm failed", err);
      setConfirmError("Network issue while confirming. Please retry.");
      setIsConfirming(false);
    }
  };

  const statusBadge = useMemo(() => {
    if (isLoading) return "Extracting signals...";
    if (profile) return "Draft ready";
    return "Awaiting upload";
  }, [isLoading, profile]);

  return (
    <main className="min-h-screen bg-noid-black text-white">
      <div className="relative isolate overflow-hidden">
        <div className="relative mx-auto max-w-6xl px-6 py-16 md:px-8 md:py-20 space-y-12">
          <header className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.24em] text-noid-silver">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                Synqra onboarding
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                Private preview
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                {statusBadge}
              </span>
            </div>
            <div className="space-y-3">
              <h1 className="text-3xl font-light leading-tight md:text-4xl">
                Capture your signals. Review the profile. Move into the composer with confidence.
              </h1>
              <p className="max-w-3xl text-base text-noid-silver">
                Luxury spacing, gold accents, and a clear draft-first flow. Upload anything - LinkedIn,
                PDFs, or screenshots. We extract, you edit, nothing goes live until you confirm.
              </p>
            </div>
          </header>

          <UploadZone isLoading={isLoading} onSubmit={handleExtract} error={error} />

          {profile ? (
            <ProfileReview
              data={profile}
              onChange={setProfile}
              onStartOver={handleStartOver}
              onConfirm={handleConfirm}
              isConfirming={isConfirming}
              statusNote={statusNote}
              errorNote={confirmError}
            />
          ) : (
            <div className="rounded-3xl border border-dashed border-noid-silver/40 bg-white/5 px-6 py-8 text-sm text-noid-silver">
              The extracted profile will land here after you upload. Nothing is public yet.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function normalizeProfile(payload: unknown): ExtractedProfile | null {
  if (!payload || typeof payload !== "object") return null;
  const payloadObj = payload as Record<string, unknown>;
  const source =
    typeof payloadObj.profile === "object" && payloadObj.profile !== null
      ? (payloadObj.profile as Record<string, unknown>)
      : payloadObj;

  const safeString = (value: unknown) =>
    typeof value === "string" ? value.trim() : "";
  const safeArray = (value: unknown) => {
    if (Array.isArray(value)) {
      return value.map((item) => String(item)).filter(Boolean);
    }
    return [];
  };

  const normalized: ExtractedProfile = {
    ...emptyProfile,
    name: safeString(source.name),
    title: safeString(source.title),
    company: safeString(source.company),
    location: safeString(source.location),
    headline: safeString(source.headline),
    summary: safeString(source.summary),
    website: safeString(source.website),
    linkedin: safeString(source.linkedin),
    twitter: safeString(source.twitter),
    newsletter: safeString(source.newsletter),
    tone: safeString(source.tone),
    contentPillars: safeArray(source.contentPillars ?? source.pillars),
    proofPoints: safeArray(source.proofPoints ?? source.highlights),
  };

  const hasSignal =
    !!normalized.name ||
    !!normalized.headline ||
    !!normalized.summary ||
    !!normalized.company ||
    !!normalized.title ||
    normalized.contentPillars.length > 0 ||
    normalized.proofPoints.length > 0;

  return hasSignal ? normalized : null;
}

async function safeErrorMessage(response: Response) {
  try {
    const data = await response.json();
    if (data && typeof data === "object") {
      const record = data as Record<string, unknown>;
      if (typeof record.error === "string") return record.error;
      if (typeof record.message === "string") return record.message;
      return null;
    }
  } catch {
    // ignore
  }
  return response.statusText || null;
}
