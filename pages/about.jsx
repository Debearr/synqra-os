import React from "react";
import { brandCore, brandStatement } from "@/lib/brand/metadata";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <section className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="text-3xl md:text-5xl font-serif">{brandCore.name}</h1>
        <p className="mt-2 text-sm text-neutral-400">Version {brandCore.version} — {brandCore.councilStatus} ({brandCore.lastReview})</p>
        <p className="mt-6 text-neutral-300 whitespace-pre-line">{brandStatement}</p>
      </section>
    </main>
  );
}
