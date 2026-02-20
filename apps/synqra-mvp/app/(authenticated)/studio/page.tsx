"use client";

import { useMemo, useState } from "react";
import StudioCommandCenter from "@/components/studio/command-center";

type StudioResponse = {
  content?: string;
  metadata?: { requestId?: string };
  request_id?: string;
};

export default function StudioPage() {
  const [studioResponse, setStudioResponse] = useState<StudioResponse | null>(null);
  const responseText = studioResponse?.content ?? "";

  const nextActions = useMemo(() => {
    if (!responseText) return [];
    return responseText
      .split(/\n{2,}/)
      .map((section) => section.trim())
      .filter((section) => /^\d+[\)\.]\s+/.test(section) || /^[-*]\s+/.test(section))
      .map((section) => section.replace(/^\d+[\)\.]\s+/, "").replace(/^[-*]\s+/, "").replace(/\n+/g, " ").trim())
      .filter(Boolean);
  }, [responseText]);

  return (
    <main className="min-h-screen bg-ds-bg text-ds-text-primary">
      <div className="mx-auto w-full max-w-journey px-6 py-12">
        <header className="mb-6 space-y-4">
          <p className="text-sm leading-copy uppercase tracking-[0.12em] text-ds-text-secondary">Synqra Journey V1</p>
          <h1 className="text-2xl font-medium leading-compact">Studio</h1>
        </header>

        {studioResponse ? (
          <section className="space-y-6 border border-ds-text-secondary/40 bg-ds-surface p-6">
            <h2 className="text-2xl font-medium leading-compact">Output ready</h2>
            <div className="whitespace-pre-wrap text-sm leading-copy text-ds-text-primary">{responseText || "No response"}</div>
            {nextActions.length > 0 ? (
              <ul className="list-disc space-y-2 pl-6 text-sm leading-copy text-ds-text-secondary">
                {nextActions.map((action, index) => (
                  <li key={`${action}-${index}`}>{action}</li>
                ))}
              </ul>
            ) : null}
            <button
              type="button"
              onClick={() => setStudioResponse(null)}
              className="w-full bg-ds-gold px-4 py-2 text-sm font-medium leading-copy text-ds-bg"
            >
              Create another
            </button>
          </section>
        ) : (
          <StudioCommandCenter
            onInitialized={(payload) => {
              if (payload.requestId) {
                localStorage.setItem("synqra_request_id", payload.requestId);
              }
              localStorage.setItem("synqra_input", payload.input);
              setStudioResponse({
                content: payload.content,
                metadata: { requestId: payload.requestId || undefined },
              });
            }}
          />
        )}
      </div>
    </main>
  );
}
