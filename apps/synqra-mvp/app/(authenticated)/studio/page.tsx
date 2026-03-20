"use client";

import { useMemo, useState } from "react";
import StudioCommandCenter from "@/components/studio/command-center";
import type { StudioVertical } from "@/lib/council/studio-quality-gate";

type StudioResponse = {
  draft?: string;
  content?: string;
  nextActions?: string[];
  notes?: string | null;
  compliance?: {
    status: "ok" | "adjusted";
    issues?: string[];
  } | null;
  replies?: string[];
  comments?: string[];
  followUp?: string | null;
  provider?: string | null;
  model?: string | null;
  generationTier?: string | null;
  request?: {
    vertical: StudioVertical;
    platform: string;
    voice: string;
  };
  metadata?: { requestId?: string };
  request_id?: string;
};

type FlowStatus = "empty" | "loading" | "success" | "failure";

function normalizeOutputText(value: string): string {
  return value.replace(/\*\*/g, "").trim();
}

function extractOutputBlocks(value: string): string[] {
  return normalizeOutputText(value)
    .split(/\n{2,}/)
    .map((section) => section.trim())
    .filter(Boolean);
}

function formatVerticalLabel(vertical: StudioVertical | undefined): string {
  if (vertical === "travel_advisor") return "Travel advisor";
  if (vertical === "realtor") return "Realtor";
  return "Not set";
}

export default function StudioPage() {
  const [studioResponse, setStudioResponse] = useState<StudioResponse | null>(null);
  const [flowStatus, setFlowStatus] = useState<FlowStatus>("empty");
  const [copyState, setCopyState] = useState<"idle" | "done" | "error">("idle");
  const responseText = studioResponse?.draft ?? studioResponse?.content ?? "";
  const outputBlocks = useMemo(() => extractOutputBlocks(responseText), [responseText]);
  const cleanedResponseText = useMemo(() => normalizeOutputText(responseText), [responseText]);
  const parsedNextActions = useMemo(() => {
    if (!cleanedResponseText) return [];
    return cleanedResponseText
      .split(/\n{2,}/)
      .map((section) => section.trim())
      .filter((section) => /^\d+[\)\.]\s+/.test(section) || /^[-*]\s+/.test(section))
      .map((section) => section.replace(/^\d+[\)\.]\s+/, "").replace(/^[-*]\s+/, "").replace(/\n+/g, " ").trim())
      .filter(Boolean);
  }, [cleanedResponseText]);
  const nextActions = studioResponse?.nextActions && studioResponse.nextActions.length > 0 ? studioResponse.nextActions : parsedNextActions;

  const requestId = studioResponse?.metadata?.requestId ?? studioResponse?.request_id ?? null;

  const handleCopy = async () => {
    if (!cleanedResponseText || typeof navigator === "undefined" || !navigator.clipboard) {
      setCopyState("error");
      return;
    }

    try {
      await navigator.clipboard.writeText(cleanedResponseText);
      setCopyState("done");
    } catch {
      setCopyState("error");
    }
  };

  return (
    <main className="min-h-screen bg-ds-bg text-ds-text-primary">
      <div className="mx-auto w-full max-w-journey px-6 py-12">
        <header className="mb-6 space-y-4">
          <p className="text-sm leading-copy uppercase tracking-[0.12em] text-ds-text-secondary">Synqra Journey V1</p>
          <h1 className="text-2xl font-medium leading-compact">Studio</h1>
          <p className="max-w-2xl text-sm leading-copy text-ds-text-secondary">
            Select the client context first, then turn one business objective into one usable draft that is ready to refine.
          </p>
        </header>

        {flowStatus === "empty" && !studioResponse ? (
          <div className="mb-6 border border-ds-text-secondary/20 bg-ds-bg/40 p-4 text-sm leading-copy text-ds-text-secondary" data-testid="studio-empty-state">
            Best first use: choose the vertical, pick one platform, and write the exact action the draft should drive.
          </div>
        ) : null}

        {flowStatus === "failure" && !studioResponse ? (
          <div className="mb-6 border border-ds-gold/30 bg-ds-bg/40 p-4 text-sm leading-copy text-ds-text-secondary" data-testid="studio-page-failure-state">
            Synqra held the last draft back. Tighten the brief or adjust the surface, then rerun only when the ask feels clean.
          </div>
        ) : null}

        {flowStatus === "loading" && !studioResponse ? (
          <div className="mb-6 border border-ds-gold/30 bg-ds-bg/40 p-4 text-sm leading-copy text-ds-text-secondary" data-testid="studio-loading-state">
            Synqra is shaping one clean first draft for the selected vertical and surface.
          </div>
        ) : null}

        {studioResponse ? (
          <section className="space-y-6 border border-ds-text-secondary/40 bg-ds-surface p-6" data-testid="studio-success-state">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.14em] text-ds-text-secondary">Output</p>
                <h2 className="text-2xl font-medium leading-compact">Output ready</h2>
                <p className="max-w-2xl text-sm leading-copy text-ds-text-secondary">
                  Read it once for tone, once for clarity, then refine from the same brief if needed.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="border border-ds-text-secondary/30 px-4 py-2 text-sm text-ds-text-primary"
                >
                  {copyState === "done" ? "Copied" : copyState === "error" ? "Copy unavailable" : "Copy draft"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStudioResponse(null);
                    setFlowStatus("empty");
                    setCopyState("idle");
                  }}
                  className="bg-ds-gold px-4 py-2 text-sm font-medium leading-copy text-ds-bg"
                >
                  Refine brief
                </button>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.5fr_0.8fr]">
              <div className="space-y-4 border border-ds-text-secondary/20 bg-ds-bg/40 p-5">
                <p className="text-xs uppercase tracking-[0.14em] text-ds-text-secondary">Draft</p>
                <div className="space-y-4 text-sm leading-7 text-ds-text-primary">
                  {outputBlocks.length > 0 ? outputBlocks.map((block, index) => <p key={`${block}-${index}`}>{block}</p>) : <p>No response</p>}
                </div>
              </div>

              <aside className="space-y-4">
                <div className="border border-ds-text-secondary/20 bg-ds-bg/40 p-5">
                  <p className="text-xs uppercase tracking-[0.14em] text-ds-text-secondary">Use this draft</p>
                  <ul className="mt-3 space-y-2 text-sm leading-copy text-ds-text-secondary">
                    <li>Keep the strongest line.</li>
                    <li>Keep the vertical tone tight.</li>
                    <li>Cut anything that sounds generic.</li>
                  </ul>
                </div>

                <div className="border border-ds-text-secondary/20 bg-ds-bg/40 p-5">
                  <p className="text-xs uppercase tracking-[0.14em] text-ds-text-secondary">Request</p>
                  <div className="mt-3 space-y-3 text-sm leading-copy text-ds-text-secondary">
                    <p>{requestId ? `Request ID: ${requestId}` : "Request ID will appear when available."}</p>
                    <p>Vertical: {formatVerticalLabel(studioResponse.request?.vertical)}</p>
                    <p>Platform: {studioResponse.request?.platform ?? "Not set"}</p>
                    <p>Voice: {studioResponse.request?.voice ?? "Not set"}</p>
                    {studioResponse?.compliance ? (
                      <div className="space-y-2">
                        <p className="text-xs uppercase tracking-[0.12em] text-ds-text-secondary">Compliance</p>
                        <p>
                          {studioResponse.compliance.status === "adjusted"
                            ? "Adjusted for platform safety and trust."
                            : "Checked and aligned for platform-safe tone."}
                        </p>
                        {studioResponse.compliance.issues?.length ? (
                          <ul className="list-disc space-y-1 pl-5">
                            {studioResponse.compliance.issues.map((issue, index) => (
                              <li key={`${issue}-${index}`}>{issue}</li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    ) : null}
                    {studioResponse?.notes ? <p>{studioResponse.notes}</p> : null}
                    {nextActions.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-xs uppercase tracking-[0.12em] text-ds-text-secondary">Suggested next actions</p>
                        <ul className="list-disc space-y-2 pl-5">
                          {nextActions.map((action, index) => (
                            <li key={`${action}-${index}`}>{action}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {studioResponse?.comments?.length ? (
                      <div className="space-y-2">
                        <p className="text-xs uppercase tracking-[0.12em] text-ds-text-secondary">Penny comments</p>
                        <ul className="list-disc space-y-2 pl-5">
                          {studioResponse.comments.map((comment, index) => (
                            <li key={`${comment}-${index}`}>{comment}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {studioResponse?.replies?.length ? (
                      <div className="space-y-2">
                        <p className="text-xs uppercase tracking-[0.12em] text-ds-text-secondary">Penny replies</p>
                        <ul className="list-disc space-y-2 pl-5">
                          {studioResponse.replies.map((reply, index) => (
                            <li key={`${reply}-${index}`}>{reply}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {studioResponse?.followUp ? (
                      <div className="space-y-2">
                        <p className="text-xs uppercase tracking-[0.12em] text-ds-text-secondary">Follow-up</p>
                        <p>{studioResponse.followUp}</p>
                      </div>
                    ) : null}
                  </div>
                </div>
              </aside>
            </div>
          </section>
        ) : (
          <StudioCommandCenter
            onInitialized={(payload) => {
              if (payload.requestId) {
                localStorage.setItem("synqra_request_id", payload.requestId);
              }
              localStorage.setItem("synqra_input", payload.input);
              setStudioResponse({
                draft: payload.content,
                content: payload.content,
                nextActions: payload.nextActions ?? [],
                notes: payload.notes ?? null,
                compliance: payload.compliance ?? null,
                replies: payload.replies ?? [],
                comments: payload.comments ?? [],
                followUp: payload.followUp ?? null,
                provider: payload.provider ?? null,
                model: payload.model ?? null,
                generationTier: payload.generationTier ?? null,
                request: {
                  vertical: payload.vertical,
                  platform: payload.platform,
                  voice: payload.voice,
                },
                metadata: { requestId: payload.requestId || undefined },
              });
              setFlowStatus("success");
              setCopyState("idle");
            }}
            onStatusChange={(status) => setFlowStatus(status)}
          />
        )}
      </div>
    </main>
  );
}
