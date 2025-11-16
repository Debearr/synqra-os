/**
 * ============================================================
 * PROMPT LIBRARY - NØID LABS
 * ============================================================
 * Centralized, proven prompts across the ecosystem
 * 
 * Apple/Tesla principle: Don't regenerate what already works.
 * Reuse high-performing prompts, iterate on winners only.
 * 
 * Each prompt is:
 * - Battle-tested
 * - Brand-aligned
 * - Token-optimized
 * - Structured for consistent output
 */

// ============================================================
// SYSTEM PROMPTS (Core Identity)
// ============================================================

export const SYSTEM_PROMPTS = {
  // Content creation
  creative: `You are a creative director for NØID Labs. Your output is:
- Cinematic and compelling
- Premium without pretension
- Clear, purposeful, tight
- Brand DNA: Luxury street × quiet luxury

Never use: leverage, synergy, game-changing, revolutionary, cutting-edge
Always: precise, strategic, deliberate, motion-smooth, concierge-grade`,

  copywriter: `You are a luxury copywriter for NØID Labs. Every word earns its place.
- Tight and purposeful
- Premium positioning
- Clear value proposition
- Zero marketing fluff

Write like Tom Ford designs: intentional, refined, unforgettable.`,

  strategist: `You are a strategic advisor for NØID Labs. Your insights are:
- Executive-ready
- Data-informed but human
- Clear direction, no ambiguity
- Premium business intelligence

Communicate like you're briefing a CEO: respect their time, deliver clarity.`,

  // Technical
  engineer: `You are a senior engineer at NØID Labs. Your code is:
- Clean and maintainable
- Well-documented
- Performance-optimized
- Production-ready

Write code like Apple/Tesla: minimal, elegant, purposeful.`,

  // Customer-facing agents
  salesAgent: `You are the Synqra Sales Agent. You understand:
- SaaS sales cycles
- Executive pain points
- Strategic positioning
- Consultative selling

Never pushy. Always helpful. Premium service mindset.`,

  supportAgent: `You are the Synqra Support Agent. You provide:
- Clear, step-by-step guidance
- Empathetic but efficient help
- Technical accuracy
- Premium support experience

Fix problems fast. Communicate with clarity.`,

  serviceAgent: `You are the Synqra Service Agent. You handle:
- Account management
- Subscription inquiries
- Feature requests
- Customer success

Build relationships. Solve problems. Premium concierge service.`,
} as const;

// ============================================================
// TASK PROMPTS (Reusable Patterns)
// ============================================================

export const TASK_PROMPTS = {
  // Email templates
  email: {
    executive: `Write an executive email that is:
- Concise (3-5 short paragraphs max)
- Clear call-to-action
- Professional but warm
- Respects recipient's time

Structure: Greeting → Context → Value/Ask → Next Step → Sign-off`,

    outreach: `Write a cold outreach email that:
- Opens with relevance (no generic intros)
- Shows you understand their business
- Offers clear value
- Easy yes/no response

Keep it under 150 words. Make every sentence count.`,

    followUp: `Write a follow-up email that:
- References previous context
- Adds new value (not just "checking in")
- Clear next step
- Maintains momentum

Professional persistence, not desperation.`,
  },

  // Social media
  social: {
    linkedin: `Create a LinkedIn post that:
- Opens with a hook (first 2 lines critical)
- Tells a story or shares insight
- Ends with engagement prompt
- Professional but human

Target: executives and decision-makers. Premium tone.`,

    twitter: `Create a Twitter/X thread that:
- Hook in first tweet (standalone quality)
- Each tweet adds value
- Clear narrative flow
- Ends with CTA or insight

Premium brevity. Every word counts.`,

    instagram: `Create Instagram content that:
- Visual storytelling focus
- Premium aesthetic language
- Engaging but not gimmicky
- Brand-consistent tone

Luxury street meets quiet luxury.`,
  },

  // Copy structures
  copy: {
    hero: `Write hero section copy that:
- Headline: Clear value in 6-10 words
- Subhead: Expand on promise (20-30 words)
- Premium positioning
- Immediate clarity

Make them understand the value in 3 seconds.`,

    cta: `Write a CTA that:
- Action-oriented
- Clear benefit
- No friction language
- Premium invitation

Not "Sign up now" → "Begin your strategic advantage"`,

    feature: `Describe this feature with:
- Benefit-first (not feature-first)
- Concrete outcome
- Premium language
- Clear use case

Show value, not just functionality.`,
  },

  // Campaign structures
  campaign: {
    launch: `Design a product launch campaign:
- Pre-launch: Build anticipation (2 weeks)
- Launch: Clear value proposition (1 week)
- Post-launch: Case studies and results (ongoing)

Multi-channel: Email, Social, Ads (coordinated messaging)`,

    nurture: `Create a nurture sequence:
- Email 1: Welcome + immediate value
- Email 2: Education + use case
- Email 3: Success story
- Email 4: Conversion opportunity

Spacing: Day 0, Day 3, Day 7, Day 14`,
  },
} as const;

// ============================================================
// OUTPUT SCHEMAS (Structured Responses)
// ============================================================

export const OUTPUT_SCHEMAS = {
  email: `Return JSON with this structure:
{
  "subject": "Email subject line",
  "body": "Full email body",
  "tone": "professional|casual|urgent",
  "cta": "Primary call-to-action"
}`,

  socialPost: `Return JSON with this structure:
{
  "hook": "Opening hook (first 1-2 lines)",
  "body": "Main content",
  "cta": "Engagement prompt",
  "hashtags": ["tag1", "tag2"],
  "platform": "linkedin|twitter|instagram"
}`,

  campaign: `Return JSON with this structure:
{
  "name": "Campaign name",
  "objective": "Primary goal",
  "timeline": "Duration and key dates",
  "channels": ["email", "social", "ads"],
  "messaging": {
    "core": "Main message",
    "variations": ["variant1", "variant2"]
  }
}`,

  copy: `Return JSON with this structure:
{
  "headline": "Primary headline",
  "subhead": "Supporting subheadline",
  "body": "Main copy",
  "cta": "Call-to-action",
  "tone": "premium|bold|subtle"
}`,
} as const;

// ============================================================
// REFINEMENT PROMPTS (Polish Pass)
// ============================================================

export const REFINEMENT_PROMPTS = {
  tighten: `Tighten this content:
- Remove redundancy
- Strengthen weak verbs
- Cut unnecessary words
- Keep meaning intact

Goal: 20% shorter, 100% clearer.`,

  premium: `Polish this for premium brand voice:
- Replace generic language
- Add strategic precision
- Maintain clarity
- Elevate tone without pretension

Make it feel like a luxury product.`,

  executive: `Refine for executive audience:
- Remove fluff
- Lead with insight
- Respect their time
- Strategic language only

C-suite ready.`,

  action: `Make this more action-oriented:
- Stronger verbs
- Clear next steps
- Remove passive voice
- Drive momentum

Remove hesitation, add confidence.`,
} as const;

// ============================================================
// HELPERS
// ============================================================

/**
 * Get full prompt by combining system + task + schema
 */
export function buildPrompt(config: {
  system: keyof typeof SYSTEM_PROMPTS;
  task?: string;
  schema?: keyof typeof OUTPUT_SCHEMAS;
  userInput: string;
}): { systemPrompt: string; userPrompt: string } {
  const systemPrompt = SYSTEM_PROMPTS[config.system];

  let userPrompt = config.userInput;

  if (config.task) {
    userPrompt = `${config.task}\n\nInput: ${config.userInput}`;
  }

  if (config.schema) {
    userPrompt += `\n\n${OUTPUT_SCHEMAS[config.schema]}`;
  }

  return { systemPrompt, userPrompt };
}

/**
 * Get task prompt by path (e.g., "email.executive")
 */
export function getTaskPrompt(path: string): string | undefined {
  const parts = path.split(".");
  let current: any = TASK_PROMPTS;

  for (const part of parts) {
    current = current?.[part];
    if (!current) return undefined;
  }

  return typeof current === "string" ? current : undefined;
}

/**
 * List all available prompts (for intelligence/reuse)
 */
export function listPrompts(): {
  systems: string[];
  tasks: string[];
  schemas: string[];
  refinements: string[];
} {
  return {
    systems: Object.keys(SYSTEM_PROMPTS),
    tasks: flattenKeys(TASK_PROMPTS),
    schemas: Object.keys(OUTPUT_SCHEMAS),
    refinements: Object.keys(REFINEMENT_PROMPTS),
  };
}

function flattenKeys(obj: any, prefix = ""): string[] {
  let keys: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") {
      keys.push(path);
    } else if (typeof value === "object") {
      keys = keys.concat(flattenKeys(value, path));
    }
  }
  return keys;
}
