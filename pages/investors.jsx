import React from "react";
import Head from "next/head";
import DemoPreviewBanner from "@/components/investors/DemoPreviewBanner";
import InvestorThemeToggle from "@/components/investors/InvestorThemeToggle";
import DemoBanner from "@/components/investors/DemoBanner";

export default function Investors() {
  const orgSchema = {
    "@context":"https://schema.org",
    "@type":"Organization",
    name:"NØID",
    url:"https://noid.ai",
    brand:"SYNQRA",
    sameAs:["https://www.linkedin.com/company/noid","https://twitter.com/noid"],
    offers:{
      "@type":"OfferCatalog",
      name:"SYNQRA Tiers",
      itemListElement:[
        {"@type":"Offer",name:"Atelier",price:"0",priceCurrency:"USD"},
        {"@type":"Offer",name:"Maison",price:"89",priceCurrency:"USD"},
        {"@type":"Offer",name:"Couture",price:"Custom",priceCurrency:"USD"}
      ]
    },
    knowsAbout:["AI automation","enterprise content ops","luxury brand technology"]
  };

  return (
    <>
      <Head>
        <title>NØID × SYNQRA — Luxury Automation for Brands | Investor Overview</title>
        <meta name="description" content="Luxury-grade automation & AI content engine. Enterprise reliability, measurable lift, and a compounding brand moat. We don’t sell features. We sell freedom." />
        <meta name="keywords" content="luxury automation, AI content engine, enterprise automation, brand automation platform, YC ready" />
        <link rel="canonical" href="https://noid.ai/investors" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
        />
      </Head>
      <main className="min-h-screen bg-black text-white">
        <InvestorThemeToggle />
        <section className="mx-auto max-w-4xl px-6 py-16">
          <h1 className="text-3xl md:text-5xl font-serif">We don’t sell features. We sell freedom.</h1>
          <p className="mt-4 text-neutral-300">Freedom from chaos. From manual grind. From noisy tools that don’t move the needle. NØID × SYNQRA is a luxury-grade automation stack: invisible when you want calm, powerful when you need scale.</p>
        </section>
        <DemoPreviewBanner />
        <DemoBanner />
      </main>
    </>
  );
}
