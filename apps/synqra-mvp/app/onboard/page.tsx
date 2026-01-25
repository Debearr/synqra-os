'use client';

import { useMemo, useState } from "react";
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

  const handleExtract = async ({ link, file }: ExtractPayload) => {
    setIsLoading(true);
    setStatusNote(null);
    setError(null);
    setConfirmError(null);

    const formData = new FormData();
    if (link) formData.append("link", link);
    if (file) formData.append("file", file);

    try {
      const response = await fetch("/api/onboard/extract", {
        method: "POST",
        body: formData,
      });

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
      setStatusNote("Extractor responded. Edit anything; this is your draft.");
    } catch (err) {
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

    try {
      const response = await fetch("/api/onboard/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile }),
      });

      if (!response.ok) {
        const message = await safeErrorMessage(response);
        setConfirmError(message || "Unable to confirm right now. Try again.");
        setIsConfirming(false);
        return;
      }

      router.push("/");
    } catch (err) {
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
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(212,175,55,0.08),transparent_35%),radial-gradient(circle_at_90%_20%,rgba(0,255,198,0.12),transparent_32%)]" />
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/8 to-transparent" />

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
  const source = (payload as any).profile ?? payload;

  const safeString = (value: any) => (typeof value === "string" ? value.trim() : "");
  const safeArray = (value: any) => {
    if (Array.isArray(value)) {
      return value.map((item) => String(item)).filter(Boolean);
    }
    return [];
  };

  const normalized: ExtractedProfile = {
    ...emptyProfile,
    name: safeString((source as any).name),
    title: safeString((source as any).title),
    company: safeString((source as any).company),
    location: safeString((source as any).location),
    headline: safeString((source as any).headline),
    summary: safeString((source as any).summary),
    website: safeString((source as any).website),
    linkedin: safeString((source as any).linkedin),
    twitter: safeString((source as any).twitter),
    newsletter: safeString((source as any).newsletter),
    tone: safeString((source as any).tone),
    contentPillars: safeArray((source as any).contentPillars ?? (source as any).pillars),
    proofPoints: safeArray((source as any).proofPoints ?? (source as any).highlights),
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
      return (data as any).error || (data as any).message || null;
    }
  } catch {
    // ignore
  }
  return response.statusText || null;
}
