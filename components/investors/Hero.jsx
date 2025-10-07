import React from "react";
import { brandStatement } from "@/lib/brand/metadata";

export default function InvestorsHero() {
  return (
    <section className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-3xl md:text-5xl font-serif">We don’t sell features. We sell freedom.</h1>
      <p className="mt-4 text-neutral-300 whitespace-pre-line">{brandStatement}</p>
    </section>
  );
}
