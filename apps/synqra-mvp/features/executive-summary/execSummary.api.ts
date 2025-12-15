import { ExecSummaryDoc } from "@/features/executive-summary/types/execSummary.types";

// Mock data function mimicking an API call
export async function fetchExecSummary(): Promise<ExecSummaryDoc> {
  // Simulating network delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  return {
    overview: "Synqra is a content intelligence platform built for the post-generic era. Where others offer tools, we deliver infrastructure—Apple-grade simplicity wrapped around Tesla-grade architecture. The Synqra Intelligence Kernel learns from every interaction, routes tasks across optimal AI models, and scales intelligence without scaling costs.",
    marketProblem: "Content creation is broken. Enterprises burn $10K–$50K per campaign on fragmented workflows. SMBs sacrifice brand consistency for speed. Luxury brands—who demand precision—have zero AI tools meeting their standards. The market is saturated with generic outputs, slow agencies, and one-size-fits-none solutions.",
    solutionArchitecture: [
      { title: "Multi-Industry Intelligence", description: "Purpose-built AI for real estate, luxury brands, creators, and enterprise—not retrofitted, native." },
      { title: "Intelligence Kernel", description: "Tiered routing across optimal models with intelligent caching. Costs stay flat; output quality compounds." },
      { title: "Zero-Friction UX", description: "Voice workflows, file uploads, one-click publishing, embedded viral mechanics. Luxury experience, mass scale." }
    ],
    whySynqraWins: [
      "Static Costs, Compounding Intelligence — The more the system learns, the more you save.",
      "Cross-Industry Learning — Luxury insights sharpen every vertical.",
      "Embedded Viral Engine — Every output carries subtle branding; every share becomes a distribution channel.",
      "First Mover in Luxury AI — No competitor serves high-end brands at scale with purpose-built infrastructure."
    ],
    whyNow: "AI costs are in freefall. Multimodal AI is production-ready. Content demand is exploding. Luxury brands are actively seeking AI partners—not vendors. The window is open. First movers win. Fast followers survive. Everyone else becomes irrelevant.",
    targetRaise: "$750K",
    targetRevenue: "$750K",
    useOfFunds: [
      { label: "Engineering (2 hires)", amount: "$240K" },
      { label: "Infrastructure & AI", amount: "$120K" },
      { label: "GTM Operations", amount: "$180K" },
      { label: "Legal, Ops & Runway", amount: "$210K" }
    ],
    roadmap: [
      "Multi-model architecture validated",
      "6mo: Solo/Pro launch + luxury pilots + API",
      "12mo: 500+ users, $750K ARR"
    ],
    founder: "De Bear — Multi-model AI architect. Luxury brand strategist. System designer with extreme build velocity. Previously shipped production AI across three verticals. Toronto, Canada."
  };
}

