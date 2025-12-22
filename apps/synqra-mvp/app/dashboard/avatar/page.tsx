"use client";

import { useEffect, useMemo, useState } from "react";
import { AVATAR_PRICING, estimateAvatarCost } from "@/lib/kie-ai/cost-estimator";
import type { AvatarJobStatus, AvatarPlan, AvatarVoiceProfile } from "@/lib/avatar/types";

const defaultVoice: AvatarVoiceProfile = {
  name: "Synqra Voice",
  tone: "calm, executive",
  cadence: "mid-tempo",
  vocabulary: ["momentum", "clarity"],
  guardrails: ["no hallucinations"],
  audience: "leaders",
};

const planLabels: Record<AvatarPlan, string> = {
  lite: "Lite",
  pro: "Pro",
  studio: "Studio",
};

export default function AvatarDashboardPage() {
  const [plan, setPlan] = useState<AvatarPlan>("lite");
  const [script, setScript] = useState("Write a 20-second executive intro for our new product launch.");
  const [image, setImage] = useState<File | null>(null);
  const [audio, setAudio] = useState<File | null>(null);
  const [job, setJob] = useState<AvatarJobStatus | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [costEstimate, setCostEstimate] = useState(estimateAvatarCost(plan));

  const planMeta = useMemo(() => AVATAR_PRICING[plan], [plan]);

  useEffect(() => {
    setCostEstimate(estimateAvatarCost(plan));
  }, [plan]);

  useEffect(() => {
    if (!job?.id || job.status === "completed" || job.status === "failed") return;
    const interval = setInterval(async () => {
      const res = await fetch(`/api/avatar/status?id=${job.id}`);
      if (!res.ok) return;
      const next = (await res.json()) as AvatarJobStatus;
      setJob(next);
    }, 2500);
    return () => clearInterval(interval);
  }, [job?.id, job?.status]);

  const onFileChange = (setter: (file: File | null) => void) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setter(event.target.files?.[0] ?? null);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("script", script);
      formData.append("plan", plan);
      formData.append("userId", "demo-user");
      formData.append("voice", JSON.stringify(defaultVoice));
      if (image) formData.append("image", image);
      if (audio) formData.append("audio", audio);

      const response = await fetch("/api/avatar/generate", { method: "POST", body: formData });
      if (!response.ok) {
        const message = await response.json();
        throw new Error(message.error || "Failed to queue avatar");
      }

      const payload = await response.json();
      setPreviewUrl(payload.previewUrl ?? null);
      setJob({ id: payload.jobId, status: "queued" });
      setCostEstimate(payload.cost);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400 uppercase tracking-wide">Avatar Engine</p>
          <h1 className="text-3xl font-semibold text-white">Phase 1 — Synthesis & Queue</h1>
          <p className="text-gray-400 mt-2">Validate with Kie.AI, estimate cost, route providers, and track generation status.</p>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-right">
          <p className="text-xs text-gray-400">Plan</p>
          <p className="text-lg font-semibold text-white">{planLabels[plan]}</p>
          <p className="text-xs text-gray-500">{planMeta.includedVideos} videos · ${planMeta.monthlyPrice} / mo</p>
        </div>
      </header>

      <section className="grid md:grid-cols-3 gap-4">
        <div className="col-span-2 bg-neutral-900 border border-neutral-800 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-semibold">Script editor</h2>
            <select
              className="bg-neutral-800 text-white text-sm rounded px-3 py-2 border border-neutral-700"
              value={plan}
              onChange={(e) => setPlan(e.target.value as AvatarPlan)}
            >
              <option value="lite">Lite</option>
              <option value="pro">Pro</option>
              <option value="studio">Studio</option>
            </select>
          </div>
          <textarea
            value={script}
            onChange={(e) => setScript(e.target.value)}
            className="w-full min-h-[180px] bg-neutral-950 border border-neutral-800 rounded-lg text-white p-3 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          <div className="flex items-center gap-3">
            <label className="flex flex-col text-sm text-gray-400">
              Upload face image
              <input type="file" accept="image/*" onChange={onFileChange(setImage)} className="mt-1 text-white" />
            </label>
            <label className="flex flex-col text-sm text-gray-400">
              Upload voice sample
              <input type="file" accept="audio/*" onChange={onFileChange(setAudio)} className="mt-1 text-white" />
            </label>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="ml-auto bg-cyan-500 text-black px-4 py-2 rounded-md font-semibold hover:bg-cyan-400 disabled:opacity-50"
            >
              {isSubmitting ? "Queuing..." : "Generate"}
            </button>
          </div>
          {error && <p className="text-sm text-rose-400">{error}</p>}
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 space-y-3">
          <h2 className="text-white font-semibold">Usage</h2>
          <div className="text-sm text-gray-400 space-y-1">
            <p>Estimated per-video cap: ${planMeta.perVideoCap}</p>
            <p>Included renders: {planMeta.includedVideos}</p>
            <p>Current job cost: ${costEstimate.estimatedJobCost}</p>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Cost projection</span>
              <span>{costEstimate.capped ? "Cap applied" : "Within included"}</span>
            </div>
            <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-2 bg-cyan-500"
                style={{ width: `${Math.min(100, (costEstimate.estimatedJobCost / planMeta.perVideoCap) * 100 || 12)}%` }}
              />
            </div>
          </div>
          <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-xs text-gray-400">
            <p className="font-semibold text-white mb-1">Upgrade guidance</p>
            <p>Pro unlocks 10 renders/mo and faster queues. Studio pins priority to Hedra/D-ID with $15 per-video cap.</p>
          </div>
        </div>
      </section>

      <section className="grid md:grid-cols-2 gap-4">
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 space-y-3">
          <h3 className="text-white font-semibold">Job progress</h3>
          {job ? (
            <div className="space-y-2">
              <p className="text-gray-300 text-sm">Job ID: {job.id}</p>
              <p className="text-gray-400 text-sm">Status: {job.status}</p>
              <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-2 bg-green-400"
                  style={{ width: `${job.progress ?? (job.status === "completed" ? 100 : 35)}%` }}
                />
              </div>
              {job.resultUrl && (
                <a href={job.resultUrl} className="text-cyan-400 text-sm" target="_blank" rel="noreferrer">
                  View render
                </a>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No jobs yet. Submit your first avatar render to see live progress.</p>
          )}
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 space-y-3">
          <h3 className="text-white font-semibold">Preview</h3>
          {previewUrl ? (
            <img src={previewUrl} alt="Preview" className="rounded-lg border border-neutral-800" />
          ) : (
            <div className="h-40 rounded-lg border border-dashed border-neutral-700 text-gray-500 flex items-center justify-center">
              Upload a face image to see the sanitized preview.
            </div>
          )}
          <div className="text-xs text-gray-500">
            Phase 2 scaffold will stream renders to native client located in <code className="font-mono">/native-avatar</code>.
          </div>
        </div>
      </section>
    </div>
  );
}
