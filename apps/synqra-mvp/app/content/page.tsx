"use client";

import { useState } from "react";

/**
 * ============================================================
 * CONTENT FLYWHEEL UI
 * ============================================================
 * Minimal interface for content generation and retention tracking
 */

type Platform = "youtube" | "tiktok" | "x" | "linkedin";

const PLATFORMS: { value: Platform; label: string }[] = [
  { value: "youtube", label: "YouTube" },
  { value: "tiktok", label: "TikTok" },
  { value: "x", label: "X (Twitter)" },
  { value: "linkedin", label: "LinkedIn" },
];

export default function ContentPage() {
  // Content Generation State
  const [brief, setBrief] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<any>(null);

  // Retention Note State
  const [platform, setPlatform] = useState<Platform>("youtube");
  const [videoId, setVideoId] = useState("");
  const [avgViewDuration, setAvgViewDuration] = useState("");
  const [avgCompletion, setAvgCompletion] = useState("");
  const [notes, setNotes] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [noteSuccess, setNoteSuccess] = useState(false);

  const handlePlatformToggle = (platform: Platform) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  };

  const handleGenerate = async () => {
    if (!brief || selectedPlatforms.length === 0) return;

    setIsGenerating(true);
    setGeneratedContent(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief, platforms: selectedPlatforms }),
      });

      const data = await response.json();

      if (response.ok) {
        setGeneratedContent(data);
      } else {
        console.error("Generation failed:", data.message);
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error("Generation error:", error);
      alert("Failed to generate content. Check console for details.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveRetentionNote = async () => {
    if (!platform || !videoId) return;

    setIsSavingNote(true);
    setNoteSuccess(false);

    try {
      const response = await fetch("/api/retention/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform,
          videoId,
          avgViewDuration: avgViewDuration ? parseFloat(avgViewDuration) : undefined,
          avgCompletion: avgCompletion ? parseFloat(avgCompletion) : undefined,
          notes,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setNoteSuccess(true);
        // Clear form
        setVideoId("");
        setAvgViewDuration("");
        setAvgCompletion("");
        setNotes("");
        setTimeout(() => setNoteSuccess(false), 3000);
      } else {
        console.error("Save failed:", data.message);
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error("Save error:", error);
      alert("Failed to save retention note. Check console for details.");
    } finally {
      setIsSavingNote(false);
    }
  };

  return (
    <main className="min-h-screen bg-black px-6 py-12">
      <div className="mx-auto max-w-5xl space-y-12">
        {/* Header */}
        <header className="text-center">
          <h1 className="text-3xl font-bold text-white">Content Flywheel</h1>
          <p className="mt-2 text-sm text-white/60">
            Zero-cost content generation and retention tracking
          </p>
        </header>

        {/* Content Generation Section */}
        <section className="rounded-2xl border border-white/10 bg-white/5 p-8">
          <h2 className="mb-6 text-xl font-semibold text-white">
            Generate Platform Hooks
          </h2>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm text-white/70">Brief</label>
              <textarea
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                placeholder="Enter your content brief..."
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/40 focus:border-white/20 focus:outline-none"
                rows={3}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-white/70">
                Platforms
              </label>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => handlePlatformToggle(value)}
                    className={`rounded-lg px-4 py-2 text-sm transition-colors ${
                      selectedPlatforms.includes(value)
                        ? "bg-white/20 text-white"
                        : "bg-white/5 text-white/60 hover:bg-white/10"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating || !brief || selectedPlatforms.length === 0}
              className="w-full rounded-lg bg-white/10 px-6 py-3 text-white transition-colors hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isGenerating ? "Generating..." : "Generate Hooks"}
            </button>
          </div>

          {/* Generated Content Display */}
          {generatedContent && (
            <div className="relative mt-6 space-y-4 rounded-lg bg-black/40 p-6">
              <p className="text-xs text-white/50">
                Job ID: {generatedContent.jobId}
              </p>

              {Object.entries(generatedContent.variants).map(
                ([platform, variants]: [string, any]) => (
                  <div key={platform} className="space-y-2">
                    <h3 className="text-sm font-semibold uppercase text-white/80">
                      {platform}
                    </h3>
                    {variants.map((v: any, idx: number) => (
                      <div
                        key={idx}
                        className="rounded-md border border-white/10 bg-white/5 p-3"
                      >
                        <p className="text-sm text-white">{v.hook}</p>
                        <p className="mt-1 text-xs text-white/50">{v.cta}</p>
                      </div>
                    ))}
                  </div>
                )
              )}
              <a
                href="https://synqra.co"
                target="_blank"
                rel="noopener noreferrer"
                className="absolute bottom-3 right-4 text-[0.6rem] uppercase tracking-[0.3em] text-white/35 hover:text-white/60"
              >
                Synqra
              </a>
            </div>
          )}
        </section>

        {/* Retention Notes Section */}
        <section className="rounded-2xl border border-white/10 bg-white/5 p-8">
          <h2 className="mb-6 text-xl font-semibold text-white">
            Add Retention Note
          </h2>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm text-white/70">
                Platform
              </label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as Platform)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-white/20 focus:outline-none"
              >
                {PLATFORMS.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm text-white/70">
                Video ID
              </label>
              <input
                type="text"
                value={videoId}
                onChange={(e) => setVideoId(e.target.value)}
                placeholder="e.g., dQw4w9WgXcQ"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/40 focus:border-white/20 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm text-white/70">
                  Avg View Duration (seconds)
                </label>
                <input
                  type="number"
                  value={avgViewDuration}
                  onChange={(e) => setAvgViewDuration(e.target.value)}
                  placeholder="120"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/40 focus:border-white/20 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/70">
                  Avg Completion (%)
                </label>
                <input
                  type="number"
                  value={avgCompletion}
                  onChange={(e) => setAvgCompletion(e.target.value)}
                  placeholder="65"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/40 focus:border-white/20 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm text-white/70">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional insights..."
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/40 focus:border-white/20 focus:outline-none"
                rows={3}
              />
            </div>

            <button
              onClick={handleSaveRetentionNote}
              disabled={isSavingNote || !platform || !videoId}
              className="w-full rounded-lg bg-white/10 px-6 py-3 text-white transition-colors hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSavingNote ? "Saving..." : "Save Retention Note"}
            </button>

            {noteSuccess && (
              <p className="text-center text-sm text-green-400">
                Retention note saved successfully!
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
