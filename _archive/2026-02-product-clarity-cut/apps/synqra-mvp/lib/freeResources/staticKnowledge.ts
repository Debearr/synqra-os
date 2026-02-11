/**
 * ============================================================
 * STATIC KNOWLEDGE BASE - Zero Runtime Cost
 * ============================================================
 * Pre-built knowledge that requires no API calls
 * Updated manually or via scheduled batch jobs
 */

/**
 * Synqra Product Knowledge (Static - No API Cost)
 */
export const SYNQRA_KNOWLEDGE = {
  product: {
    name: "Synqra",
    tagline: "Luxury-grade social automation for executives",
    description:
      "AI-powered social media management with executive-level polish. Schedule, generate, and optimize content across all platforms with RPRD DNA quality.",
    
    features: [
      "AI content generation with brand voice",
      "Multi-platform scheduling (YouTube, LinkedIn, Instagram, TikTok, X)",
      "Intelligent agent system (sales, support, service)",
      "RAG-powered knowledge retrieval",
      "Safety guardrails and hallucination detection",
      "Cost-optimized ($0.01-0.02 per reply)",
      "Enterprise health monitoring",
    ],
    
    pricing: {
      starter: { price: 29, features: ["5 users", "Core automation", "Email support"] },
      professional: { price: 99, features: ["25 users", "Advanced integrations", "Priority support"] },
      enterprise: { price: "Custom", features: ["Unlimited", "24/7 support", "Custom dev"] },
    },

    competitors: [
      { name: "Buffer", weakness: "No AI generation" },
      { name: "Hootsuite", weakness: "Expensive, cluttered UI" },
      { name: "Later", weakness: "Limited platforms" },
    ],

    useCases: [
      "Executive social presence management",
      "Startup founder content automation",
      "Agency client management",
      "Personal brand building",
    ],
  },

  faq: [
    {
      q: "How much does Synqra cost?",
      a: "Starter plan is $29/month for small teams. Professional is $99/month (most popular). Enterprise pricing is custom based on your needs.",
    },
    {
      q: "What platforms does Synqra support?",
      a: "YouTube, LinkedIn, Instagram, TikTok, X (Twitter), and Facebook. All from one dashboard.",
    },
    {
      q: "Is there a free trial?",
      a: "Yes! 14-day free trial of the Professional plan, no credit card required.",
    },
    {
      q: "How does AI content generation work?",
      a: "Our agents use Claude 3.5 Sonnet with your brand voice and RAG context to generate premium, on-brand content. Cost optimized at $0.01-0.02 per generation.",
    },
    {
      q: "Can I cancel anytime?",
      a: "Absolutely. No contracts, cancel anytime from your dashboard.",
    },
  ],

  integrations: [
    "Salesforce",
    "HubSpot",
    "Slack",
    "Microsoft Teams",
    "Google Workspace",
    "Notion",
    "Stripe",
    "Zapier",
  ],

  techStack: {
    frontend: "Next.js 15 + React 18 + TypeScript",
    backend: "Next.js API Routes + Supabase",
    ai: "Claude 3.5 Sonnet (Anthropic)",
    database: "PostgreSQL (Supabase)",
    deployment: "Railway",
    monitoring: "Custom health cell + Telegram",
  },
};

/**
 * Industry Best Practices (Static - No API Cost)
 */
export const INDUSTRY_KNOWLEDGE = {
  socialMedia: {
    bestPostTimes: {
      linkedin: "Tuesday-Thursday, 9am-12pm EST",
      instagram: "Monday-Friday, 11am-1pm EST",
      twitter: "Monday-Friday, 12pm-3pm EST",
      youtube: "Thursday-Saturday, 2pm-4pm EST",
    },

    contentTypes: [
      "Educational (how-to, tutorials)",
      "Inspirational (quotes, stories)",
      "Promotional (product launches)",
      "Behind-the-scenes (culture, team)",
      "User-generated (testimonials, reviews)",
    ],

    hashtagStrategies: {
      linkedin: "3-5 industry-specific hashtags",
      instagram: "15-20 mixed (popular + niche)",
      twitter: "1-2 trending hashtags",
    },
  },

  contentCreation: {
    principles: [
      "Lead with value, not promotion",
      "Tell stories, not sales pitches",
      "Use data to back claims",
      "Keep it conversational",
      "End with clear CTA",
    ],

    videoSpecs: {
      youtube: { ratio: "16:9", length: "8-15min optimal", thumbnail: "1280x720" },
      instagram: { ratio: "4:5 or 1:1", length: "30-60sec reels", thumbnail: "1080x1350" },
      tiktok: { ratio: "9:16", length: "15-60sec", thumbnail: "1080x1920" },
    },
  },

  aiPromptTips: [
    "Be specific about tone and style",
    "Provide examples of desired output",
    "Use bullet points for structure",
    "Specify word count or length",
    "Include target audience context",
  ],
};

/**
 * Common Objections & Responses (Static - No API Cost)
 */
export const SALES_OBJECTION_HANDLERS = {
  "too expensive": {
    response:
      "I understand budget is important. Synqra actually saves money—the time you'd spend on manual posting (3-5 hours/week) costs more than our $99/month plan. Plus, our AI generates content for pennies, while agencies charge $500+ per post.",
    proof: "Average customer saves 15 hours/month = ~$750 in opportunity cost",
  },

  "already using [competitor]": {
    response:
      "Great! Most Synqra customers switched from Buffer/Hootsuite. The key difference: we have AI content generation, multi-agent support, and cost 40% less for the same features. Want a side-by-side comparison?",
    proof: "See our comparison page: synqra.co/vs/buffer",
  },

  "too complex": {
    response:
      "Actually, Synqra is designed for simplicity—executives use it daily without training. Our AI handles the complex parts (content, timing, optimization). You just review and approve. 5 minutes/day vs 30 minutes with other tools.",
    proof: "Average onboarding time: 15 minutes. First post: 2 minutes.",
  },

  "not sure if I need it": {
    response:
      "Fair question. If you're posting less than 3x/week or spending under 30min/week on social, you might not need us yet. But if you want to grow your presence or feel social media is draining time—Synqra is built for you. Want to try the free trial?",
    proof: "14-day trial, no commitment. See if it fits.",
  },
};

/**
 * Technical Troubleshooting (Static - No API Cost)
 */
export const SUPPORT_KNOWLEDGE = {
  commonIssues: [
    {
      issue: "Login not working",
      solution: "Clear cache, try incognito mode, reset password via 'Forgot Password' link",
      escalate: false,
    },
    {
      issue: "Post failed to publish",
      solution: "Check OAuth connection status, reconnect platform, verify post meets platform requirements (length, media format)",
      escalate: false,
    },
    {
      issue: "Agent not responding",
      solution: "Check agent mode (mock vs live), verify ANTHROPIC_API_KEY, check budget status at /api/budget/status",
      escalate: false,
    },
    {
      issue: "Budget exceeded",
      solution: "System auto-locks at $190. Check /api/budget/status. Contact admin to review usage and unlock if appropriate.",
      escalate: true,
    },
  ],

  platformRequirements: {
    youtube: {
      title: "Max 100 characters",
      description: "Max 5000 characters",
      tags: "Max 500 characters total",
      thumbnail: "1280x720, JPG/PNG, max 2MB",
    },
    linkedin: {
      post: "Max 3000 characters",
      link: "Preview auto-generated",
      image: "1200x627 recommended",
    },
    instagram: {
      caption: "Max 2200 characters",
      hashtags: "Max 30 per post",
      image: "1080x1080 or 1080x1350",
    },
  },
};

/**
 * Get static knowledge by topic (zero cost lookup)
 */
export function getStaticKnowledge(topic: string): string {
  const topicMap: Record<string, unknown> = {
    pricing: SYNQRA_KNOWLEDGE.product.pricing,
    features: SYNQRA_KNOWLEDGE.product.features,
    faq: SYNQRA_KNOWLEDGE.faq,
    integrations: SYNQRA_KNOWLEDGE.integrations,
    competitors: SYNQRA_KNOWLEDGE.product.competitors,
    "best practices": INDUSTRY_KNOWLEDGE,
    objections: SALES_OBJECTION_HANDLERS,
    troubleshooting: SUPPORT_KNOWLEDGE,
  };

  const data = topicMap[topic.toLowerCase()];
  if (!data) {
    return "Topic not found in knowledge base.";
  }

  return JSON.stringify(data, null, 2);
}

/**
 * Search static knowledge (zero cost, instant)
 */
export function searchStaticKnowledge(query: string): string[] {
  const lowerQuery = query.toLowerCase();
  const results: string[] = [];

  // Search FAQ
  SYNQRA_KNOWLEDGE.faq.forEach((item) => {
    if (item.q.toLowerCase().includes(lowerQuery) || item.a.toLowerCase().includes(lowerQuery)) {
      results.push(`FAQ: ${item.q}\nA: ${item.a}`);
    }
  });

  // Search features
  SYNQRA_KNOWLEDGE.product.features.forEach((feature) => {
    if (feature.toLowerCase().includes(lowerQuery)) {
      results.push(`Feature: ${feature}`);
    }
  });

  // Search objections
  Object.entries(SALES_OBJECTION_HANDLERS).forEach(([objection, handler]) => {
    if (objection.includes(lowerQuery) || handler.response.toLowerCase().includes(lowerQuery)) {
      results.push(`Objection: "${objection}"\nResponse: ${handler.response}`);
    }
  });

  return results;
}
