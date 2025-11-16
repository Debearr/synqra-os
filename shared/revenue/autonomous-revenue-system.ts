/**
 * ============================================================
 * AUTONOMOUS REVENUE GROWTH SYSTEM
 * ============================================================
 * Self-improving sales and conversion engine for NØID Labs
 * 
 * Capabilities:
 * - 3-year $15M ARR roadmap with monthly milestones
 * - Dynamic AI Sales Agent goals
 * - Intelligence-driven sales script optimization
 * - Self-improving conversion through pattern detection
 * - Unified funnel orchestration
 * - Zero hard-sell approach (listen → extract → guide)
 */

import { App } from "@/shared/types";
import { getSupabaseClient, logIntelligence } from "@/shared/db/supabase";
import { aiClient } from "@/shared/ai/client";

// ============================================================
// REVENUE ROADMAP — 3-YEAR $15M ARR TARGET
// ============================================================

export type RevenueGoal = {
  month: number;
  year: number;
  signups: number;
  conversionRate: number; // as decimal (e.g., 0.08 = 8%)
  mrr: number;
  arr: number;
  avgCustomerValue: number;
};

export const REVENUE_ROADMAP: RevenueGoal[] = [
  // Year 1: Building foundation ($352K ARR)
  { month: 1, year: 1, signups: 100, conversionRate: 0.05, mrr: 245, arr: 2_940, avgCustomerValue: 49 },
  { month: 2, year: 1, signups: 200, conversionRate: 0.06, mrr: 588, arr: 7_056, avgCustomerValue: 49 },
  { month: 3, year: 1, signups: 500, conversionRate: 0.08, mrr: 1_960, arr: 23_520, avgCustomerValue: 49 },
  { month: 6, year: 1, signups: 2_000, conversionRate: 0.10, mrr: 9_800, arr: 117_600, avgCustomerValue: 49 },
  { month: 9, year: 1, signups: 3_500, conversionRate: 0.11, mrr: 18_865, arr: 226_380, avgCustomerValue: 49 },
  { month: 12, year: 1, signups: 5_000, conversionRate: 0.12, mrr: 29_400, arr: 352_800, avgCustomerValue: 49 },

  // Year 2: Scaling ($2.5M ARR)
  { month: 15, year: 2, signups: 8_000, conversionRate: 0.13, mrr: 68_640, arr: 823_680, avgCustomerValue: 66 },
  { month: 18, year: 2, signups: 12_000, conversionRate: 0.14, mrr: 125_440, arr: 1_505_280, avgCustomerValue: 74 },
  { month: 21, year: 2, signups: 16_000, conversionRate: 0.15, mrr: 193_600, arr: 2_323_200, avgCustomerValue: 80 },
  { month: 24, year: 2, signups: 20_000, conversionRate: 0.16, mrr: 256_000, arr: 3_072_000, avgCustomerValue: 80 },

  // Year 3: Dominating ($15M ARR)
  { month: 27, year: 3, signups: 30_000, conversionRate: 0.17, mrr: 612_000, arr: 7_344_000, avgCustomerValue: 120 },
  { month: 30, year: 3, signups: 40_000, conversionRate: 0.18, mrr: 864_000, arr: 10_368_000, avgCustomerValue: 120 },
  { month: 33, year: 3, signups: 50_000, conversionRate: 0.19, mrr: 1_140_000, arr: 13_680_000, avgCustomerValue: 120 },
  { month: 36, year: 3, signups: 55_000, conversionRate: 0.20, mrr: 1_320_000, arr: 15_840_000, avgCustomerValue: 120 },
];

/**
 * Get current revenue goal based on elapsed months since launch
 */
export function getCurrentGoal(launchDate: Date): RevenueGoal {
  const now = new Date();
  const monthsElapsed = Math.floor(
    (now.getTime() - launchDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
  );

  const closestGoal = REVENUE_ROADMAP.reduce((prev, curr) => {
    return Math.abs(curr.month - monthsElapsed) < Math.abs(prev.month - monthsElapsed)
      ? curr
      : prev;
  });

  return closestGoal;
}

// ============================================================
// AI SALES AGENT BEHAVIOR FRAMEWORK
// ============================================================

export type SalesAgentRole = "qualifier" | "closer" | "nurturer";

export type SalesConversation = {
  id: string;
  userId?: string;
  email?: string;
  messages: SalesMessage[];
  stage: "discovery" | "qualification" | "proposal" | "nurture" | "closed" | "lost";
  intelligence: {
    painPoints: string[];
    goals: string[];
    budget?: string;
    timeline?: string;
    decisionMaker: boolean;
    fitScore: number; // 0-100
  };
  nextAction: "listen" | "clarify" | "propose" | "follow-up" | "close";
  createdAt: string;
  updatedAt: string;
};

export type SalesMessage = {
  role: "user" | "agent";
  content: string;
  timestamp: string;
  metadata?: {
    extractedIntent?: string;
    emotionalTone?: string;
    nextBestAction?: string;
  };
};

/**
 * SALES AGENT CORE RULES (NEVER VIOLATE)
 */
const SALES_AGENT_RULES = {
  neverHardSell: true,
  listenFirst: true,
  extractIntelligence: true,
  askClarifyingQuestions: true,
  mirrorUserPriorities: true,
  guideNaturally: true,
  respectTiming: true,
  buildTrust: true,
};

/**
 * Generate next agent response using RPRD DNA
 */
export async function generateAgentResponse(
  conversation: SalesConversation,
  newUserMessage: string
): Promise<{
  response: string;
  updatedIntelligence: SalesConversation["intelligence"];
  nextAction: SalesConversation["nextAction"];
}> {
  // Extract intelligence from user message
  const intelligencePrompt = `
You are analyzing a sales conversation to extract strategic intelligence.

User message: "${newUserMessage}"

Context from previous messages:
${conversation.messages.slice(-3).map((m) => `${m.role}: ${m.content}`).join("\n")}

Extract:
1. Pain points mentioned
2. Goals/objectives
3. Budget hints
4. Timeline hints
5. Is this person the decision-maker? (boolean)
6. Fit score (0-100): How well does Synqra solve their problem?

Return as JSON:
{
  "painPoints": ["..."],
  "goals": ["..."],
  "budget": "...",
  "timeline": "...",
  "decisionMaker": true/false,
  "fitScore": 0-100
}
`;

  const intelligenceResult = await aiClient.generate({
    prompt: intelligencePrompt,
    taskType: "structural",
    mode: "polished",
    maxTokens: 500,
  });

  let extractedIntelligence: SalesConversation["intelligence"];
  try {
    extractedIntelligence = JSON.parse(intelligenceResult.content);
  } catch {
    extractedIntelligence = conversation.intelligence; // Fallback to existing
  }

  // Merge with existing intelligence
  const updatedIntelligence: SalesConversation["intelligence"] = {
    painPoints: [
      ...new Set([...conversation.intelligence.painPoints, ...(extractedIntelligence.painPoints || [])]),
    ],
    goals: [...new Set([...conversation.intelligence.goals, ...(extractedIntelligence.goals || [])])],
    budget: extractedIntelligence.budget || conversation.intelligence.budget,
    timeline: extractedIntelligence.timeline || conversation.intelligence.timeline,
    decisionMaker:
      extractedIntelligence.decisionMaker !== undefined
        ? extractedIntelligence.decisionMaker
        : conversation.intelligence.decisionMaker,
    fitScore: Math.max(conversation.intelligence.fitScore, extractedIntelligence.fitScore || 0),
  };

  // Determine next action based on intelligence
  let nextAction: SalesConversation["nextAction"] = "listen";
  if (updatedIntelligence.painPoints.length < 2) {
    nextAction = "clarify"; // Need more discovery
  } else if (updatedIntelligence.fitScore > 70 && updatedIntelligence.decisionMaker) {
    nextAction = "propose"; // Ready for offer
  } else if (updatedIntelligence.fitScore > 50 && updatedIntelligence.fitScore <= 70) {
    nextAction = "clarify"; // Need more alignment
  } else if (updatedIntelligence.fitScore < 50) {
    nextAction = "follow-up"; // Not ready, nurture
  }

  // Generate agent response following RPRD DNA rules
  const responsePrompt = `
You are a concierge-level sales agent for Synqra, an AI content orchestration platform for executives.

RULES (NEVER VIOLATE):
- NEVER hard-sell
- Listen first, always
- Extract intelligence before pitching
- Ask precise clarifying questions
- Mirror user priorities in your language
- Guide naturally toward the right offer
- Build trust through understanding

Current conversation stage: ${conversation.stage}
Next action: ${nextAction}

Intelligence gathered:
- Pain points: ${updatedIntelligence.painPoints.join(", ") || "None yet"}
- Goals: ${updatedIntelligence.goals.join(", ") || "None yet"}
- Budget: ${updatedIntelligence.budget || "Unknown"}
- Timeline: ${updatedIntelligence.timeline || "Unknown"}
- Decision maker: ${updatedIntelligence.decisionMaker ? "Yes" : "Unknown"}
- Fit score: ${updatedIntelligence.fitScore}/100

User just said: "${newUserMessage}"

Generate your next response:
${
  nextAction === "listen"
    ? "Focus on understanding their situation deeper."
    : nextAction === "clarify"
    ? "Ask a precise clarifying question to understand their needs better."
    : nextAction === "propose"
    ? "Suggest the right Synqra tier based on their needs (don't be pushy)."
    : "Acknowledge their situation and suggest staying in touch."
}

Keep it:
- Concise (2-3 sentences max)
- Premium tone (luxury concierge, not salesy)
- Focused on their needs, not product features
- Natural conversation flow
`;

  const responseResult = await aiClient.generate({
    prompt: responsePrompt,
    taskType: "creative",
    mode: "polished",
    maxTokens: 200,
  });

  // Log this interaction for intelligence gathering
  await logIntelligence({
    app: "synqra",
    context: "sales_conversation",
    metadata: {
      conversationId: conversation.id,
      stage: conversation.stage,
      nextAction,
      fitScore: updatedIntelligence.fitScore,
      userMessage: newUserMessage.substring(0, 100),
    },
  });

  return {
    response: responseResult.content.trim(),
    updatedIntelligence,
    nextAction,
  };
}

// ============================================================
// SELF-IMPROVING CONVERSION SYSTEM
// ============================================================

export type ConversionPattern = {
  id: string;
  pattern: string;
  context: string;
  conversionRate: number;
  sampleSize: number;
  lastUsed: string;
  effectiveness: "high" | "medium" | "low";
};

/**
 * Detect winning patterns from closed deals
 */
export async function detectWinningPatterns(app: App): Promise<ConversionPattern[]> {
  const supabase = getSupabaseClient();

  // Get all closed conversations
  const { data: closedDeals } = await supabase
    .from("sales_conversations")
    .select("*")
    .eq("app", app)
    .eq("stage", "closed")
    .order("created_at", { ascending: false })
    .limit(100);

  if (!closedDeals || closedDeals.length === 0) {
    return [];
  }

  // Use AI to extract patterns
  const patternPrompt = `
Analyze these winning sales conversations to identify patterns that led to conversion.

Conversations (last 100 closed deals):
${closedDeals.map((deal, i) => `Deal ${i + 1}: ${JSON.stringify(deal.intelligence)}`).join("\n")}

Extract patterns like:
- Common pain points that led to conversion
- Effective questions that qualified leads
- Timing patterns (how fast did they convert?)
- Language patterns in winning conversations

Return top 5 patterns as JSON array:
[
  {
    "pattern": "Pain point: Manual content takes 2+ hours/week",
    "context": "Discovery stage, when asked about current workflow",
    "conversionRate": 0.85,
    "sampleSize": 42
  },
  ...
]
`;

  const patternsResult = await aiClient.generate({
    prompt: patternPrompt,
    taskType: "structural",
    mode: "polished",
    maxTokens: 1000,
  });

  let patterns: ConversionPattern[];
  try {
    patterns = JSON.parse(patternsResult.content).map((p: any, i: number) => ({
      ...p,
      id: `pattern_${Date.now()}_${i}`,
      lastUsed: new Date().toISOString(),
      effectiveness: p.conversionRate > 0.7 ? "high" : p.conversionRate > 0.5 ? "medium" : "low",
    }));
  } catch {
    patterns = [];
  }

  // Store patterns in database for future use
  if (patterns.length > 0) {
    await supabase.from("conversion_patterns").upsert(
      patterns.map((p) => ({
        app,
        pattern: p.pattern,
        context: p.context,
        conversion_rate: p.conversionRate,
        sample_size: p.sampleSize,
        effectiveness: p.effectiveness,
        last_used: p.lastUsed,
      }))
    );
  }

  return patterns;
}

/**
 * Apply winning patterns to improve sales scripts
 */
export async function improveSalesScripts(app: App): Promise<void> {
  const patterns = await detectWinningPatterns(app);

  if (patterns.length === 0) {
    console.log("No patterns detected yet, need more data");
    return;
  }

  // Update sales agent prompts with winning patterns
  const supabase = getSupabaseClient();

  const improvementPrompt = `
Based on these winning patterns, generate improved sales scripts:

Patterns:
${patterns.map((p) => `- ${p.pattern} (${(p.conversionRate * 100).toFixed(1)}% conversion)`).join("\n")}

Generate:
1. Discovery questions (3-5 questions)
2. Qualification questions (3-5 questions)
3. Proposal framing (2-3 approaches)

Format as JSON.
`;

  const scriptsResult = await aiClient.generate({
    prompt: improvementPrompt,
    taskType: "creative",
    mode: "polished",
    maxTokens: 1500,
  });

  // Store improved scripts
  await supabase.from("sales_scripts").insert({
    app,
    version: Date.now(),
    scripts: scriptsResult.content,
    based_on_patterns: patterns.map((p) => p.id),
    created_at: new Date().toISOString(),
  });

  console.log(`✅ Sales scripts improved for ${app} based on ${patterns.length} patterns`);
}

// ============================================================
// UNIFIED FUNNEL ORCHESTRATION
// ============================================================

export type FunnelStage =
  | "awareness" // Saw landing page, watched demo
  | "interest" // Clicked CTA, started trial
  | "consideration" // Engaged with agent, asked questions
  | "intent" // Requested pricing, started signup
  | "purchase" // Completed payment
  | "retention"; // Active user, using product

export async function advanceFunnelStage(
  userId: string,
  currentStage: FunnelStage,
  action: string
): Promise<FunnelStage> {
  const stageProgression: Record<FunnelStage, FunnelStage> = {
    awareness: "interest",
    interest: "consideration",
    consideration: "intent",
    intent: "purchase",
    purchase: "retention",
    retention: "retention", // Already at end
  };

  const nextStage = stageProgression[currentStage];

  // Log funnel progression
  await logIntelligence({
    app: "synqra",
    context: "funnel_progression",
    metadata: {
      userId,
      fromStage: currentStage,
      toStage: nextStage,
      action,
      timestamp: new Date().toISOString(),
    },
  });

  // Trigger appropriate nurture sequence
  await triggerNurtureSequence(userId, nextStage);

  return nextStage;
}

/**
 * Trigger automated nurture based on funnel stage
 */
async function triggerNurtureSequence(userId: string, stage: FunnelStage): Promise<void> {
  const sequences: Record<FunnelStage, string> = {
    awareness: "welcome_sequence",
    interest: "value_demonstration",
    consideration: "social_proof",
    intent: "urgency_scarcity",
    purchase: "onboarding",
    retention: "engagement",
  };

  const sequenceId = sequences[stage];

  // This would trigger email/SMS/in-app messaging
  console.log(`🔔 Triggering ${sequenceId} for user ${userId}`);

  // In production, integrate with:
  // - SendGrid for email
  // - Twilio for SMS
  // - In-app notifications
  // - Slack notifications to sales team
}

// ============================================================
// AUTONOMOUS SCALING LOGIC
// ============================================================

/**
 * Self-adjusting sales goals based on actual performance
 */
export async function adjustSalesGoals(app: App): Promise<void> {
  const supabase = getSupabaseClient();

  // Get current month's performance
  const { data: performance } = await supabase
    .from("sales_metrics")
    .select("signups, conversions, mrr")
    .eq("app", app)
    .gte("recorded_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .single();

  if (!performance) {
    console.log("No performance data yet");
    return;
  }

  const currentGoal = getCurrentGoal(new Date("2025-01-01")); // Launch date
  const actualConversionRate = performance.conversions / performance.signups;
  const goalConversionRate = currentGoal.conversionRate;

  if (actualConversionRate < goalConversionRate * 0.8) {
    // Underperforming by 20%+
    console.log("⚠️ Underperforming, running improvement cycle...");
    await improveSalesScripts(app);
    await detectWinningPatterns(app);
  } else if (actualConversionRate > goalConversionRate * 1.2) {
    // Overperforming by 20%+
    console.log("🚀 Overperforming, scaling up goals...");
    // Increase goals for next period
  } else {
    console.log("✅ On track with goals");
  }
}

export default {
  REVENUE_ROADMAP,
  getCurrentGoal,
  generateAgentResponse,
  detectWinningPatterns,
  improveSalesScripts,
  advanceFunnelStage,
  adjustSalesGoals,
};
