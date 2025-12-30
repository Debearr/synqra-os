"use client";

import type { ExecSummaryData } from "@/features/executive-summary/execSummary.types";
import { synqraExecSummaryData } from "@/features/executive-summary/execSummary.data.synqra";
import SectionTitle from "@/features/executive-summary/SectionTitle";

export function ExecutiveSummaryPage({ dataOverride }: { dataOverride?: ExecSummaryData }) {
  const data = dataOverride ?? synqraExecSummaryData;

  const handleDownloadPdf = async () => {
    try {
      const response = await fetch("/api/exec-summary/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataOverride: data }),
      });

      if (!response.ok) throw new Error("PDF generation failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "synqra-executive-summary.pdf";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error(error);
      alert("Failed to generate PDF");
    }
  };

  return (
    <main className="min-h-screen bg-noid-black text-white">
      <div className="mx-auto max-w-6xl px-6 py-[160px]">
        <header>
          <div className="flex items-end justify-between gap-8">
            <div>
              <h1 className="font-display text-5xl uppercase tracking-[0.22em] text-white">
                {data.brandName}
              </h1>
              <div className="mt-4 font-mono text-xs uppercase tracking-[0.22em] text-noid-silver/70">
                {data.periodLabel} • {data.status}
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono text-xs uppercase tracking-[0.22em] text-noid-silver/70">
                Platform
              </div>
              <div className="mt-2 text-sm tracking-[0.08em] text-white/80">{data.platformUrl}</div>
            </div>
          </div>
          <div className="mt-10 max-w-3xl text-base leading-relaxed text-white/75">{data.tagline}</div>
        </header>

        <div className="h-[160px]" />

        <div className="grid grid-cols-1 gap-16 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-[160px]">
            <section>
              <SectionTitle>Current State</SectionTitle>
              <p className="mt-6 text-base leading-relaxed text-white/75">{data.overview}</p>
            </section>

            <section>
              <SectionTitle>Product Surfaces (Implemented)</SectionTitle>
              <div className="mt-6 rounded-3xl border border-noid-silver/20 bg-white/[0.03] p-8">
                <pre className="whitespace-pre-wrap font-mono text-[0.85rem] leading-relaxed text-white/75">
                  {data.marketProblem}
                </pre>
              </div>
            </section>

            <section>
              <SectionTitle>Entrance • Barcode Identity</SectionTitle>
              <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
                {data.solutionArchitecture.map((item, i) => (
                  <div key={i} className="rounded-3xl border border-noid-silver/20 bg-white/[0.03] p-8">
                    <div className="font-mono text-xs uppercase tracking-[0.22em] text-noid-gold">
                      {item.label}
                    </div>
                    <div className="mt-4 text-sm leading-relaxed text-white/75">{item.body}</div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <SectionTitle>Systems Present (Repo Reality)</SectionTitle>
              <div className="mt-6 space-y-6">
                {data.whySynqraWins.map((item, i) => (
                  <div key={i} className="rounded-3xl border border-noid-silver/20 bg-white/[0.02] p-8">
                    <div className="font-mono text-xs uppercase tracking-[0.22em] text-noid-silver/70">
                      {item.label}
                    </div>
                    <div className="mt-3 text-sm leading-relaxed text-white/75">{item.body}</div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <SectionTitle>Explicit Gaps (Not Implemented)</SectionTitle>
              <p className="mt-6 text-base leading-relaxed text-white/75">{data.whyNow}</p>
            </section>

            <section>
              <SectionTitle>Next Steps (Non-Speculative)</SectionTitle>
              <ul className="mt-6 space-y-3">
                {data.roadmap.map((r, i) => (
                  <li key={i} className="text-sm leading-relaxed text-white/75">
                    {r}
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <aside className="space-y-10">
            <section className="rounded-3xl border border-noid-silver/20 bg-white/[0.03] p-8">
              <SectionTitle>Status</SectionTitle>
              <div className="mt-6">
                <div className="font-mono text-xs uppercase tracking-[0.22em] text-noid-silver/70">Build</div>
                <div className="mt-2 text-2xl font-semibold tracking-[0.08em] text-noid-gold">{data.targetRaise}</div>
                <div className="mt-3 text-sm leading-relaxed text-white/70">{data.targetRaiseNote}</div>
              </div>
              <div className="mt-8">
                <div className="font-mono text-xs uppercase tracking-[0.22em] text-noid-silver/70">Validation</div>
                <div className="mt-2 text-2xl font-semibold tracking-[0.08em] text-noid-gold">{data.targetRevenue}</div>
                <div className="mt-3 text-sm leading-relaxed text-white/70">{data.targetRevenueNote}</div>
              </div>
            </section>

            <section className="rounded-3xl border border-noid-silver/20 bg-white/[0.02] p-8">
              <SectionTitle>Access Tiers (Present in Code)</SectionTitle>
              <div className="mt-6 space-y-6">
                {data.revenueTiers.map((tier) => (
                  <div key={tier.name} className="rounded-2xl border border-white/10 bg-black/30 p-6">
                    <div className="flex items-baseline justify-between gap-6">
                      <div className="font-mono text-xs uppercase tracking-[0.22em] text-white/80">{tier.name}</div>
                      <div className="font-mono text-[0.72rem] uppercase tracking-[0.18em] text-noid-silver/70">
                        {tier.price}
                      </div>
                    </div>
                    <div className="mt-3 text-sm leading-relaxed text-white/70">{tier.tagLine}</div>
                    <ul className="mt-4 space-y-2">
                      {tier.bullets.map((b) => (
                        <li key={b} className="text-xs leading-relaxed text-white/65">
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <div className="mt-6 text-xs leading-relaxed text-white/60">{data.additionalRevenueNotes}</div>
            </section>

            <section className="rounded-3xl border border-noid-silver/20 bg-white/[0.02] p-8">
              <SectionTitle>API Surface (Selected)</SectionTitle>
              <div className="mt-6 space-y-3">
                {data.useOfFunds.map((item) => (
                  <div key={item.label} className="flex items-start justify-between gap-4">
                    <div className="text-xs uppercase tracking-[0.18em] text-white/70">{item.label}</div>
                    <div className="font-mono text-[0.78rem] tracking-[0.06em] text-noid-silver/70">{item.amount}</div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-noid-silver/20 bg-white/[0.02] p-8">
              <SectionTitle>Notes</SectionTitle>
              <p className="mt-6 text-sm leading-relaxed text-white/75">{data.founderBlurb}</p>
              <div className="mt-6 text-xs uppercase tracking-[0.22em] text-noid-silver/70">{data.location}</div>
            </section>

            <section>
              <button
                onClick={handleDownloadPdf}
                className="w-full rounded-full border border-noid-gold bg-transparent px-6 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-noid-gold transition-colors hover:bg-white/[0.03]"
              >
                Download Executive Summary (PDF)
              </button>
            </section>
          </aside>
        </div>

        <div className="h-[160px]" />

        <footer className="flex flex-col gap-4 border-t border-noid-silver/15 pt-10 text-sm text-noid-silver/70 md:flex-row md:items-center md:justify-between">
          <div>{data.footerNote}</div>
          <div className="font-mono text-xs uppercase tracking-[0.22em] text-white/70">{data.footerCta}</div>
        </footer>
      </div>
    </main>
  );
}
