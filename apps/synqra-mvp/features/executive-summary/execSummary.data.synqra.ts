import type { ExecSummaryData } from "./execSummary.types";

export const synqraExecSummaryData: ExecSummaryData = {
  brandName: "SYNQRA",
  productName: "Synqra",
  tagline:
    "Executive view of current repo state. Entrance-first. Barcode identity is ceremonial and local-only.",
  periodLabel: "Dec 2025",

  // Repurposed for boardroom-at-a-glance truth (not fundraising).
  targetRaise: "Entrance: Implemented",
  targetRaiseNote: "The root route (/) is now the canonical entrance on all domains. No investor-domain rewrite.",
  targetRevenue: "Validation: Local-only",
  targetRevenueNote: "Client validation only. Regex: ^[A-Z0-9]{6,12}$. No API calls. No redirects.",

  overview:
    "This repository contains multiple MVP surfaces and API routes. The entrance has been rebuilt as a barcode-identity ritual: a barcode header, SYNQRA wordmark, and a Command Center that validates code format locally and returns an ACCEPTED / DENIED state. The prior content-generation homepage surface is no longer the root entry.",

  // Multiline, formatted for monospace rendering in the executive view.
  marketProblem: [
    "Public / product-facing",
    "- / (Entrance)",
    "- /exec-summary (Executive artifact)",
    "- /waitlist, /waitlist/success",
    "- /pilot/apply, /pilot/apply/success",
    "",
    "Internal / operational (present in repo)",
    "- /onboard (profile extraction + confirm flow)",
    "- /create (composer surface)",
    "- /agents (test interface for multi-agent system)",
    "- /admin, /admin/integrations (approval queue tooling)",
    "- /studio/exec-summary (exec summary editor + save/load + PDF export)",
    "- /noid-intel (driver intel demo surface)",
    "",
    "Dev / design system surfaces (present in repo)",
    "- /luxgrid/colors",
  ].join("\n"),

  solutionArchitecture: [
    {
      label: "Entrance",
      body: "Root route renders only: barcode header image, wordmark, and Command Center. No marketing sections."
    },
    {
      label: "Command Center",
      body: "Local-only format validation for identity codes. ACCEPTED / DENIED state. No redirect. No backend verification."
    },
    {
      label: "Barcode System",
      body: "Barcode is infrastructural: a stranger should recognize the barcode before reading the name. Header opacity is capped (≤ 35%)."
    }
  ],

  // Repurposed as tiering that actually exists in code (gatekeeper types).
  revenueTiers: [
    {
      name: "Free",
      price: "tier: free",
      tagLine: "Rate-limited access enforced in server gatekeeper logic.",
      bullets: [
        "Used by: /api/draft gatekeeper",
        "Caps and limits exist in code (min-interval + daily cap)",
        "Identifies callers via fingerprint/IP/UA"
      ]
    },
    {
      name: "Premium",
      price: "tier: premium",
      tagLine: "Bypass behavior exists when tier/auth headers indicate premium.",
      bullets: [
        "Used by: /api/draft gatekeeper",
        "Premium tiers must not regress (explicit in code)",
        "Auth header can elevate tier (per route logic)"
      ],
      highlight: true
    },
    {
      name: "Enterprise",
      price: "tier: enterprise",
      tagLine: "Tier type exists; enterprise health endpoints exist in repo.",
      bullets: [
        "Type exists in gatekeeper tier union",
        "Health endpoints under /api/health/* exist",
        "No barcode-verification backend is implemented yet"
      ]
    }
  ],

  additionalRevenueNotes:
    "Note: tiering here reflects code paths and enforcement logic present in the repository, not pricing or go-to-market.",

  whySynqraWins: [
    {
      label: "Entrance-first architecture",
      body: "The root route is now a single entrance ritual. Content generation and other product surfaces remain in the repo but are not the entrance."
    },
    {
      label: "Onboarding extractor is present",
      body: "An onboarding flow exists with /api/onboard/extract and /api/onboard/confirm used by /onboard."
    },
    {
      label: "Approval and publishing tooling exists",
      body: "Admin surfaces and /api/approve exist to approve and publish content when approval is required."
    },
    {
      label: "Executive artifact tooling exists",
      body: "Exec summary studio exists with save/load/list routes and PDF export under /api/exec-summary/*."
    }
  ],

  whyNow:
    [
      "Not implemented in this repo (explicit):",
      "- Barcode verification backend",
      "- Camera scan / device scanning flow",
      "- Redirect-on-success entrance behavior (locked out by decision)",
      "- Authenticated identity binding for codes (account/session binding)",
      "",
      "Deprecated at root (explicit):",
      "- The content-generation homepage is no longer served at /",
    ].join("\n"),

  // Repurposed as a “selected API surface” index (label -> route path).
  useOfFunds: [
    { label: "Draft generation", amount: "POST /api/draft" },
    { label: "Waitlist", amount: "POST /api/waitlist" },
    { label: "Pilot apply", amount: "POST /api/pilot/apply" },
    { label: "Onboard extract", amount: "POST /api/onboard/extract" },
    { label: "Onboard confirm", amount: "POST /api/onboard/confirm" },
    { label: "Exec summary PDF", amount: "POST /api/exec-summary/pdf" },
    { label: "Exec summary save", amount: "POST /api/exec-summary/save" },
    { label: "Exec summary list", amount: "GET /api/exec-summary/list" },
    { label: "Exec summary load", amount: "GET /api/exec-summary/load?id=…" },
  ],

  roadmap: [
    "Maintain this executive artifact as a curated mirror of repo reality. Update it with each material build change.",
    "If barcode verification is added later, document the exact endpoint, request/response, and the success/failure UX states here.",
    "If scanning is introduced later, explicitly document device requirements, permissions, and fallback input behavior here.",
  ],

  founderBlurb:
    "This page is intentionally non-marketing. It is a boardroom artifact: what exists, what was removed, and what is explicitly not implemented yet.",

  platformUrl: "synqra.app",
  location: "Toronto, ON",
  status: "Active build (entrance-first)",

  footerCta: "Curated executive artifact — update alongside the codebase.",
  footerNote: "© Synqra Intelligence Systems, 2024–2025",
};

