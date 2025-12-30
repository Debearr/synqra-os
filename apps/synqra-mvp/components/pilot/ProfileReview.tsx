'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ExtractedProfile = {
  name: string;
  title: string;
  company: string;
  location: string;
  headline: string;
  summary: string;
  website: string;
  linkedin: string;
  twitter: string;
  newsletter: string;
  tone: string;
  contentPillars: string[];
  proofPoints: string[];
};

type ProfileReviewProps = {
  data: ExtractedProfile;
  onChange: (next: ExtractedProfile) => void;
  onStartOver: () => void;
  onConfirm: () => void;
  isConfirming?: boolean;
  statusNote?: string | null;
  errorNote?: string | null;
};

export function ProfileReview({
  data,
  onChange,
  onStartOver,
  onConfirm,
  isConfirming,
  statusNote,
  errorNote,
}: ProfileReviewProps) {
  const setField = (key: keyof ExtractedProfile, value: string | string[]) => {
    onChange({ ...data, [key]: value } as ExtractedProfile);
  };

  return (
    <StudioLayout>
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.22em] text-noid-gold">
            Step 2
          </p>
          <h3 className="text-2xl font-light text-white md:text-3xl">
            Review your extracted profile
          </h3>
          <p className="text-sm text-noid-silver md:text-base">
            Nothing is public yet. Edit anything. This is your draft.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Badge>Draft only</Badge>
          <Badge tone="gold">Private sandbox</Badge>
        </div>
      </div>

      {statusNote ? (
        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white">
          {statusNote}
        </div>
      ) : null}
      {errorNote ? (
        <div className="rounded-xl border border-red-400/30 bg-red-400/5 px-4 py-3 text-sm text-red-200">
          {errorNote}
        </div>
      ) : null}

      <div className="space-y-10">
        <StudioSection
          title="Identity shell"
          hint="Name, title, and the way you want to show up across surfaces."
        >
          <div className="grid gap-6 md:grid-cols-3">
            <Field
              label="Full name"
              value={data.name}
              onChange={(value) => setField("name", value)}
            />
            <Field
              label="Title"
              value={data.title}
              onChange={(value) => setField("title", value)}
            />
            <Field
              label="Company"
              value={data.company}
              onChange={(value) => setField("company", value)}
            />
            <Field
              label="Location"
              value={data.location}
              onChange={(value) => setField("location", value)}
            />
            <Field
              label="Headline"
              value={data.headline}
              onChange={(value) => setField("headline", value)}
              fullWidth
            />
          </div>
        </StudioSection>

        <StudioSection
          title="Voice and positioning"
          hint="We highlighted the phrases and proof points to keep in your content."
        >
          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <StudioContainer title="Bio / summary">
              <textarea
                value={data.summary}
                onChange={(event) => setField("summary", event.target.value)}
                className="min-h-[160px] w-full resize-none rounded-lg border border-noid-silver/40 bg-white/5 p-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-noid-teal"
              />
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <Field
                  label="Tone"
                  value={data.tone}
                  onChange={(value) => setField("tone", value)}
                />
                <Field
                  label="CTA / invitation"
                  value={data.newsletter}
                  onChange={(value) => setField("newsletter", value)}
                />
              </div>
            </StudioContainer>

            <StudioContainer title="Proof points">
              <InlineTagEditor
                values={data.proofPoints}
                onChange={(value) => setField("proofPoints", value)}
                placeholder="Add proof point"
              />
              <div className="mt-4 rounded-lg border border-noid-silver/30 bg-white/5 p-3 text-xs text-noid-silver">
                Keep it tight: outcome + scale + credibility (numbers, logos, awards).
              </div>
            </StudioContainer>
          </div>
        </StudioSection>

        <StudioSection
          title="Content pillars"
          hint="We use these to seed LinkedIn, X, newsletter, and deck scripts."
        >
          <div className="grid gap-6 md:grid-cols-2">
            <StudioContainer title="Topics to amplify">
              <InlineTagEditor
                values={data.contentPillars}
                onChange={(value) => setField("contentPillars", value)}
                placeholder="Add a pillar (ops scaling, AI guardrails, etc.)"
              />
            </StudioContainer>

            <StudioContainer title="Channels + links">
              <div className="grid gap-4">
                <Field
                  label="Website"
                  value={data.website}
                  onChange={(value) => setField("website", value)}
                />
                <Field
                  label="LinkedIn"
                  value={data.linkedin}
                  onChange={(value) => setField("linkedin", value)}
                />
                <Field
                  label="X / Twitter"
                  value={data.twitter}
                  onChange={(value) => setField("twitter", value)}
                />
              </div>
              <div className="mt-4 flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-noid-silver">
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-noid-gold">
                  {"->"}
                </span>
                <span>
                  These stay private until you pick where to publish. We never post without review.
                </span>
              </div>
            </StudioContainer>
          </div>
        </StudioSection>
      </div>

      <div className="flex flex-col gap-4 border-t border-white/10 pt-6 md:flex-row md:items-center md:justify-between">
        <div className="text-sm text-noid-silver">
          Your workspace saves locally for now. Confirm to move into the composer.
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="lg"
            className="border border-white/15 bg-transparent text-white hover:border-white/40"
            onClick={onStartOver}
          >
            Start over
          </Button>
          <Button
            type="button"
            size="lg"
            className="bg-noid-gold text-noid-black hover:opacity-90 shadow-gold-glow"
            onClick={onConfirm}
            disabled={isConfirming}
          >
            {isConfirming ? "Confirming..." : "Confirm & Continue"}
          </Button>
        </div>
      </div>
    </StudioLayout>
  );
}

function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-[30px] border border-white/10 bg-gradient-to-br from-[#0B0B0B] via-[#0F0F0F] to-[#070707] p-10 shadow-[0_50px_160px_-80px_rgba(212,175,55,0.45)]">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-12 left-10 h-52 w-52 rounded-full bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.25),transparent_55%)] blur-3xl opacity-70" />
        <div className="absolute -bottom-10 right-6 h-48 w-48 rounded-full bg-[radial-gradient(circle_at_center,rgba(0,255,198,0.18),transparent_55%)] blur-3xl opacity-70" />
      </div>
      <div className="relative space-y-10">{children}</div>
    </div>
  );
}

function StudioSection({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-baseline md:justify-between">
        <div>
          <h4 className="text-lg font-light text-white md:text-xl">{title}</h4>
          {hint ? <p className="text-sm text-noid-silver">{hint}</p> : null}
        </div>
        <span className="text-xs uppercase tracking-[0.22em] text-white/60">
          Draft mode
        </span>
      </div>
      {children}
    </section>
  );
}

function StudioContainer({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-noid-gold">Draft</p>
          <h5 className="text-base font-medium text-white">{title}</h5>
        </div>
        <div className="h-px flex-1 bg-gradient-to-r from-noid-gold/60 via-white/20 to-transparent" />
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  fullWidth,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  fullWidth?: boolean;
}) {
  return (
    <label className={cn("flex flex-col gap-2", fullWidth ? "md:col-span-3 col-span-1" : "")}>
      <span className="text-xs uppercase tracking-[0.18em] text-white/60">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-noid-silver/40 bg-white/5 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-noid-teal"
      />
    </label>
  );
}

function InlineTagEditor({
  values,
  onChange,
  placeholder,
}: {
  values: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");

  const add = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onChange([...values, trimmed]);
    setDraft("");
  };

  const remove = (index: number) => {
    const next = values.filter((_, idx) => idx !== index);
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {values.map((value, index) => (
          <span
            key={`${value}-${index}`}
            className="group inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white"
          >
            {value}
            <button
              type="button"
              className="text-white/60 transition hover:text-white"
              onClick={() => remove(index)}
              aria-label={`Remove ${value}`}
            >
              x
            </button>
          </span>
        ))}
      </div>
      <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/5 p-3 md:flex-row md:items-center">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="border-noid-silver/50 bg-transparent text-white hover:border-noid-silver hover:bg-white/5"
          onClick={add}
        >
          Add
        </Button>
      </div>
    </div>
  );
}

function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "gold";
}) {
  return (
    <span
      className={cn(
        "rounded-full border px-3 py-1 text-xs uppercase tracking-[0.16em]",
        tone === "gold"
          ? "border-noid-silver/60 bg-noid-gold/10 text-noid-gold"
          : "border-white/20 bg-white/5 text-white/80"
      )}
    >
      {children}
    </span>
  );
}
