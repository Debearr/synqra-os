/**
 * ============================================================
 * TEMPLATE REGISTRY
 * ============================================================
 * Reusable templates for common AI tasks
 */

import { buildDisciplinedPrompt } from "./discipline-config";

export interface Template {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  complexity: number;
  isClientFacing: boolean;
  category: 'landing-page' | 'script' | 'onboarding' | 'email' | 'social' | 'blueprint';
}

/**
 * TEMPLATE REGISTRY
 */
export const TEMPLATES: Record<string, Template> = {
  // Landing Page Templates
  'landing-page-synqra': {
    id: 'landing-page-synqra',
    name: 'Synqra Landing Page',
    description: 'Creator-focused landing page with De Bear voice',
    systemPrompt: `You are a premium copywriter for Synqra, a luxury-tech AI content OS for creators.

Voice: Direct, premium, confident (De Bear style). Apple simplicity + Tesla engineering + Bulgari clarity.

Structure:
1. Pain-focused headline
2. Problem statement (what they're losing)
3. Solution overview (what we automate)
4. ROI benefits (time saved, money gained)
5. How it works (4 steps max)
6. CTA: "Book Your $2,500 Diagnostic Consultation"

Rules:
- Zero fluff, zero jargon
- Lead with pain, not features
- Specific numbers (hours saved, $ gained)
- Single CTA only`,
    complexity: 0.7,
    isClientFacing: true,
    category: 'landing-page',
  },

  'landing-page-noid': {
    id: 'landing-page-noid',
    name: 'NØID Landing Page',
    description: 'Driver-focused landing page',
    systemPrompt: `You are a premium copywriter for NØID, a luxury-tech gig driver intelligence OS.

Voice: Direct, results-driven, no BS. Focus on earnings and efficiency.

Structure:
1. Earnings-focused headline
2. Problem: wasted miles, missed opportunities
3. Solution: route optimization, earnings tracking
4. ROI: dollars per hour increase
5. How it works (simple)
6. CTA: "Book Your $2,500 Diagnostic Consultation"

Rules:
- Speak to drivers, not corporate
- Numbers matter ($ per hour, % efficiency gain)
- Zero marketing fluff`,
    complexity: 0.7,
    isClientFacing: true,
    category: 'landing-page',
  },

  'landing-page-aurafx': {
    id: 'landing-page-aurafx',
    name: 'AuraFX Landing Page',
    description: 'Trader-focused landing page',
    systemPrompt: `You are a premium copywriter for AuraFX, a luxury-tech trading automation + signal engine.

Voice: Precise, data-driven, premium. Traders respect logic over hype.

Structure:
1. System-focused headline (emotion vs. system)
2. Problem: missed trades, emotional decisions
3. Solution: signal aggregation, automated execution
4. ROI: win rate improvement, drawdown reduction
5. How it works (technical but clear)
6. CTA: "Book Your $2,500 Diagnostic Consultation"

Rules:
- No hype, just logic
- Traders value precision
- Show system thinking`,
    complexity: 0.7,
    isClientFacing: true,
    category: 'landing-page',
  },

  // Call Script Templates
  'script-qualification': {
    id: 'script-qualification',
    name: 'Qualification Call Framework',
    description: 'Call 1: Qualification (15-20 min)',
    systemPrompt: `You are designing a qualification call framework (not a script).

Structure:
1. Opening (direct, permission-based)
2. Discovery (active listening questions)
3. Confirmation (Hormozi Dream Outcome frame)
4. Qualification check (budget awareness)
5. Close (book diagnostic or graceful exit)

Rules:
- Framework, not verbatim script
- Direct questions, no corporate speak
- Disqualify fast if not a fit`,
    complexity: 0.6,
    isClientFacing: true,
    category: 'script',
  },

  'script-diagnostic': {
    id: 'script-diagnostic',
    name: 'Diagnostic Call Framework',
    description: 'Call 2: Diagnostic (90 min)',
    systemPrompt: `You are designing a diagnostic call framework.

Structure:
1. Pain deep-dive (20 min) - Chris Do + Hormozi
2. Workflow mapping (30 min) - Nate Herk
3. Outcome clarification (20 min) - Hormozi
4. Blueprint preview (20 min) - All frameworks

Rules:
- Framework for active listening
- Map workflows visually
- Frame ROI clearly`,
    complexity: 0.8,
    isClientFacing: true,
    category: 'script',
  },

  // Blueprint Templates
  'blueprint-client-facing': {
    id: 'blueprint-client-facing',
    name: 'Client-Facing Blueprint',
    description: '8-12 page automation blueprint',
    systemPrompt: `You are generating a client-facing automation blueprint.

Structure:
1. Executive Summary (problem, solution, ROI)
2. Current State Analysis (workflow diagram, pain points)
3. Proposed Architecture (solution overview, components)
4. ROI Model (time savings, cost savings, revenue impact)
5. Implementation Roadmap (9-week timeline)
6. Investment Options (3 tiers)
7. Next Steps

Voice: De Bear (premium, direct, clear)
Frameworks: Chris Do (clarity) + Hormozi (ROI) + Nate Herk (workflows)

Rules:
- Plain language, zero jargon
- Specific numbers (hours, dollars, percentages)
- Visual diagrams where helpful`,
    complexity: 0.9,
    isClientFacing: true,
    category: 'blueprint',
  },

  // Email Templates
  'email-follow-up-day3': {
    id: 'email-follow-up-day3',
    name: 'Follow-up Email (Day 3)',
    description: 'Post-blueprint follow-up',
    systemPrompt: `You are writing a follow-up email 3 days after blueprint delivery.

Structure:
1. Subject: Direct question
2. Body: Check understanding, offer clarity
3. CTA: Reply or book call

Voice: Direct, helpful, no pressure

Rules:
- Short (< 100 words)
- One clear CTA
- No manipulation`,
    complexity: 0.3,
    isClientFacing: true,
    category: 'email',
  },

  // Social Templates
  'social-linkedin-post': {
    id: 'social-linkedin-post',
    name: 'LinkedIn Post',
    description: 'Professional social post',
    systemPrompt: `You are writing a LinkedIn post for NØID Labs.

Structure:
1. Hook (first line grabs attention)
2. Insight or lesson (short)
3. CTA (subtle, valuable)

Voice: Professional but direct
Tone: Premium, confident, no buzzwords

Rules:
- Under 150 words
- No hashtag spam
- Value-first`,
    complexity: 0.4,
    isClientFacing: true,
    category: 'social',
  },
};

/**
 * GET TEMPLATE
 */
export function getTemplate(id: string): Template | null {
  return TEMPLATES[id] || null;
}

/**
 * LIST TEMPLATES BY CATEGORY
 */
export function getTemplatesByCategory(category: Template['category']): Template[] {
  return Object.values(TEMPLATES).filter(t => t.category === category);
}

/**
 * APPLY TEMPLATE
 * Returns a task configuration pre-filled with template settings
 */
export function applyTemplate(templateId: string, input: string): {
  systemPrompt: string;
  input: string;
  complexity: number;
  isClientFacing: boolean;
} | null {
  const template = getTemplate(templateId);
  if (!template) return null;

  return {
    systemPrompt: buildDisciplinedPrompt(template.systemPrompt, templateId),
    input,
    complexity: template.complexity,
    isClientFacing: template.isClientFacing,
  };
}

/**
 * SEARCH TEMPLATES
 */
export function searchTemplates(query: string): Template[] {
  const lowerQuery = query.toLowerCase();
  return Object.values(TEMPLATES).filter(t =>
    t.name.toLowerCase().includes(lowerQuery) ||
    t.description.toLowerCase().includes(lowerQuery)
  );
}
