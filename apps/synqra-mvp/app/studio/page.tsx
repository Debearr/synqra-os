"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import CalibrationModal from "@/components/portal/calibration-modal";
import StatusQ from "@/components/StatusQ";
import StudioCommandCenter from "@/components/studio/command-center";

export default function StudioPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [showCalibration, setShowCalibration] = useState(false);
  const [councilResponse, setCouncilResponse] = useState<any>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [input, setInput] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkUserAndLoad = async () => {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!supabaseUrl || !supabaseKey) {
        router.push("/");
        return;
      }

      const supabase = createClient(supabaseUrl, supabaseKey);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/");
        return;
      }

      const metadata = user.user_metadata || {};
      const pilotStatus = metadata.pilot_status;
      const industry = metadata.industry;
      const role = metadata.role;
      const userEmail = user.email;

      // Sovereign Key: Admin bypass
      const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
      if (adminEmail && userEmail === adminEmail) {
        // Inject architect role if not already set
        if (role !== "architect") {
          await supabase.auth.updateUser({
            data: {
              ...metadata,
              role: "architect",
            },
          });
        }
      } else {
        // Check user status for non-admin users
        if (metadata.status !== "approved" && role !== "architect") {
          router.push("/?access_denied=true");
          return;
        }
      }

      // Check if calibration is needed
      if (pilotStatus === "active" && !industry && role !== "architect") {
        setShowCalibration(true);
        setIsLoading(false);
        return;
      }

      // Load persisted input and request_id
      const persistedRequestId = localStorage.getItem("synqra_request_id");
      const persistedInput = localStorage.getItem("synqra_input");

      if (persistedInput && persistedRequestId) {
        setRequestId(persistedRequestId);
        setInput(persistedInput);
        await loadCouncilResponse(persistedInput, persistedRequestId);
      }

      setIsLoading(false);
    };

    checkUserAndLoad();
  }, [router]);

  const loadCouncilResponse = async (prompt: string, existingRequestId?: string) => {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!supabaseUrl || !supabaseKey) {
        throw new Error("Supabase not configured");
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

      const response = await fetch("/api/council", {
        method: "POST",
        headers,
        body: JSON.stringify({
          prompt,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const newRequestId = data.metadata?.requestId || data.request_id;
        if (newRequestId) {
          setRequestId(newRequestId);
          localStorage.setItem("synqra_request_id", newRequestId);
        }
        setCouncilResponse(data);
      }
    } catch (error) {
      console.error("Failed to load council response:", error);
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
        status={councilResponse ? "complete" : "idle"}
        label={councilResponse ? "Ready" : "Idle"}
      />

      <div className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="mb-8 font-mono text-2xl uppercase tracking-[0.16em] text-white">Studio</h1>

        {councilResponse ? (
          <div className="space-y-6">
            <div className="rounded-xl border border-noid-silver/20 bg-noid-black p-6">
              <h2 className="mb-4 font-mono text-sm uppercase tracking-[0.16em] text-noid-silver/70">
                Response
              </h2>
              <div className="font-mono text-sm leading-relaxed text-white/90">
                {councilResponse.consensus || councilResponse.responses?.[0]?.content || "No response"}
              </div>
            </div>

            {councilResponse.responses && councilResponse.responses.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-mono text-xs uppercase tracking-[0.16em] text-noid-silver/70">
                  Individual Perspectives
                </h3>
                {councilResponse.responses.map((r: any, idx: number) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-noid-silver/10 bg-noid-black/50 p-4"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-mono text-xs text-noid-silver/70">{r.name || r.model}</span>
                      <span className="font-mono text-xs text-noid-silver/50">{r.role}</span>
                    </div>
                    <p className="font-mono text-xs leading-relaxed text-white/80">{r.content}</p>
                  </div>
                ))}
              </div>
            )}

            {requestId && (
              <FeedbackControls requestId={requestId} />
            )}
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

      <CalibrationModal isOpen={showCalibration} onComplete={handleCalibrationComplete} />
    </main>
  );
}

function FeedbackControls({ requestId }: { requestId: string }) {
  const [submitted, setSubmitted] = useState(false);

  const handleFeedback = async (rating: "good" | "needs_improvement" | "edit") => {
    if (submitted) return;

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          request_id: requestId,
          rating,
        }),
      });

      if (response.ok) {
        setSubmitted(true);
      }
    } catch (error) {
      console.error("Failed to submit feedback:", error);
    }
  };

  if (submitted) {
    return (
      <div className="mt-4 font-mono text-xs text-noid-silver/50">Feedback recorded</div>
    );
  }

  return (
    <div className="mt-6 flex items-center gap-3 border-t border-noid-silver/10 pt-4">
      <span className="font-mono text-xs uppercase tracking-[0.16em] text-noid-silver/70">Feedback:</span>
      <button
        onClick={() => handleFeedback("good")}
        className="rounded border border-noid-silver/20 bg-noid-black/40 px-3 py-1 font-mono text-xs uppercase tracking-[0.12em] text-noid-silver/70 transition-opacity hover:opacity-80"
      >
        Good
      </button>
      <button
        onClick={() => handleFeedback("needs_improvement")}
        className="rounded border border-noid-silver/20 bg-noid-black/40 px-3 py-1 font-mono text-xs uppercase tracking-[0.12em] text-noid-silver/70 transition-opacity hover:opacity-80"
      >
        Needs Improvement
      </button>
      <button
        onClick={() => handleFeedback("edit")}
        className="rounded border border-noid-silver/20 bg-noid-black/40 px-3 py-1 font-mono text-xs uppercase tracking-[0.12em] text-noid-silver/70 transition-opacity hover:opacity-80"
      >
        Edit
      </button>
    </div>
  );
}

