"use client";

import { useEffect, useState } from "react";
import { ExecSummaryDoc } from "@/features/executive-summary/types/execSummary.types";
import { fetchExecSummary } from "@/features/executive-summary/execSummary.api";
import { SectionTitle } from "@/features/executive-summary/SectionTitle";
import { PricingCard } from "@/features/executive-summary/PricingCard";
import { synqraTokens } from "@/features/executive-summary/tokens";

export default function ExecutiveSummaryPage() {
  const [data, setData] = useState<ExecSummaryDoc | null>(null);

  useEffect(() => {
    async function load() {
      const res = await fetchExecSummary();
      setData(res);
    }
    load();
  }, []);

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

  if (!data) {
    return (
      <div className="flex items-center justify-center h-screen text-neutral-400">
        Loading executive summary…
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-black text-neutral-200 px-6 md:px-16 lg:px-28 py-20">
      {/* HEADER */}
      <header className="mb-20">
        <h1 className="text-5xl font-medium tracking-tight text-white mb-2">
          SYNQRA
        </h1>
        <p className="text-lg tracking-wide text-neutral-400">
          INTELLIGENCE THAT COMPOUNDS. COSTS THAT DON’T.
        </p>
      </header>

      {/* GRID LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
        {/* LEFT CONTENT */}
        <div className="lg:col-span-2 space-y-16">
          {/* OVERVIEW */}
          <section>
            <SectionTitle title="OVERVIEW" />
            <p className="leading-relaxed text-neutral-300">
              {data.overview}
            </p>
          </section>

          {/* MARKET PROBLEM */}
          <section>
            <SectionTitle title="MARKET PROBLEM" />
            <p className="leading-relaxed text-neutral-300">
              {data.marketProblem}
            </p>
          </section>

          {/* SOLUTION ARCHITECTURE */}
          <section>
            <SectionTitle title="SOLUTION ARCHITECTURE" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {data.solutionArchitecture.map((item, i) => (
                <div
                  key={i}
                  className="bg-neutral-900 p-6 rounded-lg border border-neutral-800"
                >
                  <h3 className="text-sm tracking-widest text-[var(--gold)] mb-2">
                    {item.title.toUpperCase()}
                  </h3>
                  <p className="text-neutral-400 text-sm leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* WHY SYNQRA WINS */}
          <section>
            <SectionTitle title="WHY SYNQRA WINS" />
            <ul className="space-y-3">
              {data.whySynqraWins.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-[var(--gold)] mt-1">■</span>
                  <p className="text-neutral-300 leading-relaxed">{item}</p>
                </li>
              ))}
            </ul>
          </section>

          {/* WHY NOW */}
          <section>
            <SectionTitle title="WHY NOW" />
            <p className="leading-relaxed text-neutral-300">
              {data.whyNow}
            </p>
          </section>
        </div>

        {/* RIGHT SIDEBAR */}
        <aside className="space-y-14">
          {/* TARGET RAISE */}
          <section>
            <h4 className="text-neutral-400 text-xs tracking-widest mb-2">
              TARGET RAISE
            </h4>
            <p className="text-3xl text-[var(--gold)] font-semibold">
              {data.targetRaise}
            </p>
            <p className="text-neutral-500 text-sm mt-1">
              Seed round for 12–18 months of runway
            </p>
          </section>

          {/* TARGET REVENUE */}
          <section>
            <h4 className="text-neutral-400 text-xs tracking-widest mb-2">
              12-MONTH TARGET
            </h4>
            <p className="text-3xl text-[var(--gold)] font-semibold">
              {data.targetRevenue}
            </p>
            <p className="text-neutral-500 text-sm mt-1">
              ARR with 500+ subscribers
            </p>
          </section>

          {/* QUOTE */}
          <section className="border-l border-neutral-700 pl-5">
            <p className="italic text-neutral-400 text-sm leading-relaxed">
              “The first platform where intelligence compounds while costs stay flat.”
            </p>
          </section>

          {/* USE OF FUNDS */}
          <section>
            <h4 className="text-neutral-400 text-xs tracking-widest mb-3">
              USE OF FUNDS
            </h4>
            <ul className="space-y-2">
              {data.useOfFunds.map((f, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between text-neutral-300 text-sm"
                >
                  <span>{f.label}</span>
                  <span className="text-[var(--gold)]">{f.amount}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* ROADMAP */}
          <section>
            <h4 className="text-neutral-400 text-xs tracking-widest mb-3">
              ROADMAP
            </h4>
            <ul className="space-y-2">
              {data.roadmap.map((r, i) => (
                <li key={i} className="text-neutral-300 text-sm">
                  {r}
                </li>
              ))}
            </ul>
          </section>

          {/* FOUNDER */}
          <section>
            <h4 className="text-neutral-400 text-xs tracking-widest mb-2">
              FOUNDER
            </h4>
            <p className="text-neutral-300 text-sm leading-relaxed">
              {data.founder}
            </p>
          </section>

           {/* DOWNLOAD PDF BUTTON */}
           <section>
            <button
              onClick={handleDownloadPdf}
              className="w-full py-3 px-4 bg-neutral-900 border border-[var(--gold)] rounded text-[var(--gold)] text-xs tracking-widest uppercase hover:bg-neutral-800 transition-colors"
            >
              Download Executive Summary (PDF)
            </button>
          </section>
        </aside>
      </div>

      {/* FOOTER */}
      <footer className="mt-24 text-neutral-500 text-sm border-t border-neutral-800 pt-6 flex justify-between items-center flex-wrap gap-4">
        <span>© Synqra Intelligence Systems, 2024–2025</span>
        <div className="flex gap-6 text-xs tracking-wide">
             <span>Available At:</span>
             <a href="https://synqra.co/exec-summary" className="hover:text-white transition-colors">synqra.co</a>
             <a href="https://invest.synqra.co/exec-summary" className="hover:text-white transition-colors">invest.synqra.co</a>
             <a href="https://summary.synqra.co" className="hover:text-white transition-colors">summary.synqra.co</a>
             <a href="https://synqra.app/exec-summary" className="hover:text-white transition-colors">synqra.app</a>
        </div>
      </footer>
    </main>
  );
}
