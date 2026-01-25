"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import StatusQ from "@/components/StatusQ";
import StudioCommandCenter from "@/components/studio/command-center";
import { resolveIdentityAssetForSurface } from "@/lib/identity/resolver";

type StudioResponse = {
  content?: string;
  metadata?: { requestId?: string };
  request_id?: string;
};

type StudioStatus = "ready" | "processing" | "complete" | "adjust";

export default function StudioPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [studioResponse, setStudioResponse] = useState<StudioResponse | null>(null);
  const [studioStatus, setStudioStatus] = useState<StudioStatus>("ready");

  const responseText = studioResponse?.content || "";
  const studioIdentityAsset = useMemo(
    () => resolveIdentityAssetForSurface("system_state_indicator", ["system_seal", "monogram_stamp"]),
    []
  );
  const showSystemSeal = studioIdentityAsset === "system_seal";

  const nextActions = useMemo(() => {
    if (!responseText) return [];
    return responseText
      .split(/\n{2,}/)
      .map((section) => section.trim())
      .filter((section) => /^\d+[\)\.]\s+/.test(section) || /^[-*]\s+/.test(section))
      .map((section) =>
        section
          .replace(/^\d+[\)\.]\s+/, "")
          .replace(/^[-*]\s+/, "")
          .replace(/\n+/g, " ")
          .trim()
      )
      .filter(Boolean);
  }, [responseText]);

  useEffect(() => {
    setStudioResponse(null);
    setStudioStatus("ready");
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-noid-black text-white">
        {showSystemSeal ? <StatusQ status="generating" label="Loading" /> : null}
      </div>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-noid-black text-white">
      {showSystemSeal ? (
        <StatusQ
          status={
            studioStatus === "processing"
              ? "generating"
              : studioStatus === "complete"
                ? "complete"
                : studioStatus === "adjust"
                  ? "error"
                  : "idle"
          }
          label={
            studioStatus === "processing"
              ? "Processing"
              : studioStatus === "complete"
                ? "Complete"
                : studioStatus === "adjust"
                  ? "Adjust"
                  : "Ready"
          }
        />
      ) : null}

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
          Synqra Studio
        </h1>

        {studioResponse ? (
          <div className="rounded-xl border border-noid-silver/20 bg-noid-black p-6">
            <h2 className="mb-2 font-display text-2xl tracking-[0.08em] text-white">
              Your output is ready.
            </h2>
            <div className="font-mono text-sm leading-relaxed text-white/90">{responseText || "No response"}</div>
            <div className="mt-6 font-mono text-xs uppercase tracking-[0.16em] text-noid-silver/70">
              Next move.
            </div>
            {nextActions.length > 0 && (
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-white/85">
                {nextActions.map((action, index) => (
                  <li key={`${action.slice(0, 24)}-${index}`}>{action}</li>
                ))}
              </ul>
            )}
            <button
              type="button"
              onClick={() => {
                setStudioResponse(null);
                setStudioStatus("ready");
              }}
              className="mt-6 text-sm text-noid-silver/80 transition-opacity hover:opacity-100"
            >
              Create another -&gt;
            </button>
          </div>
        ) : (
          <StudioCommandCenter
            onStatusChange={setStudioStatus}
            onInitialized={(payload) => {
              if (payload.requestId) {
                localStorage.setItem("synqra_request_id", payload.requestId);
              }
              localStorage.setItem("synqra_input", payload.input);
              setStudioResponse({
                content: payload.content,
                metadata: { requestId: payload.requestId || undefined },
              });
              setStudioStatus("complete");
            }}
          />
        )}
      </div>
    </main>
  );
}
