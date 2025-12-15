'use client';

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type UploadZoneProps = {
  isLoading?: boolean;
  error?: string | null;
  onSubmit: (payload: { link?: string; file?: File | null }) => Promise<void> | void;
};

export function UploadZone({ isLoading, error, onSubmit }: UploadZoneProps) {
  const [link, setLink] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (nextFile: File | null) => {
    if (!nextFile) return;
    setFile(nextFile);
    setLocalError(null);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
    const nextFile = event.dataTransfer.files?.[0];
    if (nextFile) {
      handleFile(nextFile);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!link.trim() && !file) {
      setLocalError("Add a link or drop a file so we can extract your signals.");
      return;
    }
    setLocalError(null);
    await onSubmit({ link: link.trim(), file });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0B0B0B] via-[#0F0F0F] to-[#050505] px-8 py-10 shadow-[0_40px_120px_-60px_rgba(212,175,55,0.35)]"
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 left-8 h-48 w-48 rounded-full bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.35),transparent_55%)] blur-3xl opacity-70" />
        <div className="absolute -bottom-12 right-6 h-40 w-40 rounded-full bg-[radial-gradient(circle_at_center,rgba(0,255,198,0.18),transparent_55%)] blur-3xl opacity-70" />
      </div>

      <div className="relative flex flex-col gap-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-brand-gold">Step 1</p>
            <h2 className="text-2xl font-light text-white md:text-3xl">
              Upload anything and we will extract your executive profile.
            </h2>
            <p className="text-sm text-brand-gray md:text-base">
              Paste a link, drop a screenshot, or attach a doc. We only read the content and return a draft.
            </p>
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/80 backdrop-blur">
            Signal inputs: URL / PDF / PNG / JPG / DOCX
          </div>
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={cn(
            "relative overflow-hidden rounded-2xl border border-dashed border-white/15 bg-white/[0.03] transition-all duration-300",
            isDragOver && "border-brand-gold/80 bg-white/[0.05] shadow-glow"
          )}
        >
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_30%,rgba(212,175,55,0.08),transparent_55%)]" />
          <div className="relative grid gap-8 p-8 md:grid-cols-2 md:gap-10">
            <div className="space-y-4">
              <label className="text-sm font-medium text-white">Paste a link</label>
              <div className="rounded-xl border border-white/10 bg-black/60 px-4 py-3 focus-within:border-brand-gold/50">
                <input
                  type="url"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https://www.linkedin.com/in/exec-profile"
                  className="w-full bg-transparent text-white placeholder:text-white/40 focus:outline-none"
                />
              </div>
              <p className="text-xs text-brand-gray">
                We preview the page, pull your headline, highlights, and proof points.
              </p>
            </div>

            <div className="space-y-4">
              <label className="text-sm font-medium text-white">Upload a screenshot or document</label>
              <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-black/60 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 bg-white/5">
                    <span className="text-sm text-brand-gold">+</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-white">Drop a file</p>
                    <p className="text-xs text-brand-gray">PNG, JPG, PDF, DOC, DOCX (max 25MB)</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-white/20 bg-transparent text-white hover:border-brand-gold/80 hover:bg-white/5"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                  >
                    Browse
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".png,.jpg,.jpeg,.pdf,.doc,.docx"
                    className="hidden"
                    onChange={(event) => handleFile(event.target.files?.[0] ?? null)}
                  />
                </div>
                {file ? (
                  <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white">
                    {file.name}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-white/10 bg-white/5 px-3 py-2 text-xs text-brand-gray">
                    Or drag a file into this area
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3 text-sm text-brand-gray">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs text-brand-gold">
              *
            </div>
            <span>Synqra reads the file or link, extracts your voice, and returns a draft profile.</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="submit"
              size="lg"
              className="bg-white text-black hover:bg-brand-gold/90 transition-all duration-300"
              disabled={isLoading}
            >
              {isLoading ? "Extracting..." : "Send to extractor"}
            </Button>
            <div className="rounded-full border border-white/10 px-3 py-1 text-xs text-brand-gray">
              Encrypted ingest / Nothing is public yet
            </div>
          </div>
        </div>

        {(localError || error) && (
          <div className="rounded-lg border border-red-400/30 bg-red-400/5 px-4 py-3 text-sm text-red-200">
            {localError || error}
          </div>
        )}
      </div>
    </form>
  );
}
