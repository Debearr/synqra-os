/**
 * ============================================================
 * DECISION ENGINE - NØID LABS
 * ============================================================
 * Sound logic for filtering, scoring, and prioritizing intelligence
 *
 * Core Principles:
 * 1. Quality over quantity (relevant signals only)
 * 2. Actionable insights (can we do something about it?)
 * 3. Brand alignment (premium, executive focus)
 * 4. Strategic value (does it move the needle?)
 * 5. Resource efficiency (no noise, no waste)
 *
 * Creator Engine → Intelligence Layer → Decision Engine Flow:
 * 1. Scrapers collect raw data
 * 2. SignalAnalyzer extracts intelligence
 * 3. FilterEngine removes noise
 * 4. ScoringEngine prioritizes
 * 5. DecisionEngine routes to action
 */

import { getSupabaseClient } from "../db/supabase";
import { logger } from "../dev/tools";
import type { App } from "../types";
import type {
  MarketSignal,
  Lead,
  CompetitorActivity,
  FilterCriteria,
  ScoringWeights,
  DecisionOutput,
  SignalType,
  SignalSentiment,
  LeadQuality,
} from "./types";
import {
  validateScore,
  validateScoringWeights,
  validateFilterCriteria,
  calculateRecencyScore,
  matchesKeywords,
  deduplicateContent,
  filterLowQualitySignals,
  clamp,
  DEFAULT_SCORING_WEIGHTS,
  SCORE_RANGE,
} from "./utils";

// ============================================================
// FILTER ENGINE
// ============================================================

export class FilterEngine {
  /**
   * Filter signals based on brand-aligned criteria
   */
  static filterSignals(signals: MarketSignal[], criteria: FilterCriteria): MarketSignal[] {
    validateFilterCriteria(criteria);

    return signals.filter((signal) => {
      // Relevance threshold (default: 70 = only high-quality signals)
      if (criteria.minRelevance !== undefined && signal.relevance_score < criteria.minRelevance) {
        return false;
      }

      // Engagement threshold
      if (criteria.minEngagement !== undefined && signal.engagement_score < criteria.minEngagement) {
        return false;
      }

      // Actionable only
      if (criteria.requireActionable && !signal.actionable) {
        return false;
      }

      // Signal types
      if (criteria.signalTypes && !criteria.signalTypes.includes(signal.type)) {
        return false;
      }

      // Sources
      if (criteria.sources && !criteria.sources.includes(signal.source)) {
        return false;
      }

      // Sentiments
      if (criteria.sentiments && !criteria.sentiments.includes(signal.sentiment)) {
        return false;
      }

      // Keywords (must contain at least one)
      if (criteria.keywords && criteria.keywords.length > 0) {
        if (!matchesKeywords(signal, criteria.keywords)) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Filter leads based on ICP (Ideal Customer Profile)
   */
  static filterLeads(leads: Lead[], minFitScore: number = 60): Lead[] {
    validateScore(minFitScore, "minFitScore");

    return leads.filter((lead) => {
      // Fit score threshold
      if (lead.fit_score < minFitScore) return false;

      // Status: only new or contacted
      if (!["new", "contacted"].includes(lead.status)) return false;

      // Quality: only hot or warm
      if (!["hot", "warm"].includes(lead.quality)) return false;

      return true;
    });
  }

  /**
   * De-duplicate signals (remove near-duplicates)
   */
  static deduplicateSignals(signals: MarketSignal[]): MarketSignal[] {
    return deduplicateContent(signals.map((s) => ({ ...s, url: s.url || "" })));
  }

  /**
   * Remove noise (low-value signals)
   */
  static removeNoise(signals: MarketSignal[]): MarketSignal[] {
    return filterLowQualitySignals(signals);
  }
}

// ============================================================
// SCORING ENGINE
// ============================================================

export class ScoringEngine {
  /**
   * Calculate comprehensive signal score
   */
  static calculateSignalScore(
    signal: MarketSignal,
    customWeights?: Partial<ScoringWeights>
  ): number {
    const weights = { ...DEFAULT_SCORING_WEIGHTS, ...customWeights };

    if (customWeights) {
      validateScoringWeights(weights);
    }

    // Relevance score (0-100)
    const relevanceScore = clamp(signal.relevance_score, SCORE_RANGE.min, SCORE_RANGE.max);

    // Engagement score (0-100)
    const engagementScore = clamp(signal.engagement_score, SCORE_RANGE.min, SCORE_RANGE.max);

    // Recency score (0-100, exponential decay with 24h half-life)
    const recencyScore = calculateRecencyScore(signal.detected_at, 24);

    // Sentiment score (0-100)
    const sentimentScore = this.calculateSentimentScore(signal.sentiment);

    // Actionability score (0-100)
    const actionabilityScore = signal.actionable ? 100 : 0;

    // Weighted composite score
    const compositeScore =
      relevanceScore * weights.relevance +
      engagementScore * weights.engagement +
      recencyScore * weights.recency +
      sentimentScore * weights.sentiment +
      actionabilityScore * weights.actionability;

    return clamp(Math.round(compositeScore), SCORE_RANGE.min, SCORE_RANGE.max);
  }

  /**
   * Calculate sentiment score
   */
  private static calculateSentimentScore(sentiment: SignalSentiment): number {
    const sentimentMap: Record<SignalSentiment, number> = {
      positive: 100,
      neutral: 50,
      negative: 25,
    };

    return sentimentMap[sentiment];
  }

  /**
   * Calculate lead score using dynamic rules
   */
  static async calculateLeadScore(lead: Lead, app: App): Promise<number> {
    const supabase = getSupabaseClient();

    // Get scoring rules from database
    const { data: rules } = await supabase
      .from("lead_scoring_rules")
      .select("*")
      .eq("app", app)
      .eq("enabled", true)
      .order("priority", { ascending: false });

    let score = 50; // Base score

    if (!rules || rules.length === 0) {
      // Fallback to simple composite score
      return Math.round((lead.fit_score + lead.urgency_score) / 2);
    }

    for (const rule of rules) {
      const applies = this.evaluateRule(rule, lead);

      if (applies) {
        score += rule.score_impact;
      }
    }

    // Clamp to valid range
    return clamp(score, SCORE_RANGE.min, SCORE_RANGE.max);
  }

  /**
   * Evaluate a single scoring rule against a lead
   */
  private static evaluateRule(rule: any, lead: Lead): boolean {
    switch (rule.rule_type) {
      case "title":
        if (!lead.title) return false;
        const titles = rule.condition.titles || [];
        return titles.some((t: string) =>
          lead.title!.toLowerCase().includes(t.toLowerCase())
        );

      case "pain_point":
        if (!lead.pain_points || lead.pain_points.length === 0) return false;
        const painKeywords = rule.condition.keywords || [];
        return painKeywords.some((k: string) =>
          lead.pain_points.some((p) => p.toLowerCase().includes(k.toLowerCase()))
        );

      case "intent_signal":
        if (!lead.intent_signals || lead.intent_signals.length === 0) return false;
        const intentKeywords = rule.condition.keywords || [];
        return intentKeywords.some((k: string) =>
          lead.intent_signals.some((i) => i.toLowerCase().includes(k.toLowerCase()))
        );

      case "industry":
        if (!lead.company) return false;
        const industries = rule.condition.industries || [];
        return industries.some((ind: string) =>
          lead.company!.toLowerCase().includes(ind.toLowerCase())
        );

      default:
        return false;
    }
  }

  /**
   * Calculate competitor threat score
   */
  static calculateCompetitorThreatScore(activity: CompetitorActivity): number {
    let score = 0;

    // Impact level contribution
    const impactScores = {
      high: 40,
      medium: 25,
      low: 10,
    };
    score += impactScores[activity.impact_level];

    // Activity type contribution
    const highThreatActivities: string[] = ["funding", "feature", "pricing"];
    if (highThreatActivities.includes(activity.activity_type)) {
      score += 30;
    }

    // Recency contribution (48h half-life)
    const recencyScore = calculateRecencyScore(activity.detected_at, 48);
    score += (recencyScore / 100) * 30;

    return clamp(Math.round(score), SCORE_RANGE.min, SCORE_RANGE.max);
  }
}

// ============================================================
// DECISION ENGINE
// ============================================================

export class DecisionEngine {
  /**
   * Make decision on a market signal
   */
  static async decideOnSignal(signal: MarketSignal): Promise<DecisionOutput> {
    const score = ScoringEngine.calculateSignalScore(signal);

    // Determine action based on score and characteristics
    const { action, priority, confidence } = this.determineSignalAction(signal, score);

    // Generate reasoning
    const reasoning = this.generateSignalReasoning(signal, score, action);

    // Generate recommended actions
    const recommended_actions = this.generateSignalActions(signal, action);

    return {
      action,
      priority,
      reasoning,
      recommended_actions,
      confidence,
    };
  }

  /**
   * Determine action for a signal based on score and type
   */
  private static determineSignalAction(
    signal: MarketSignal,
    score: number
  ): Pick<DecisionOutput, "action" | "priority" | "confidence"> {
    // High-score actionable signals
    if (score >= 80 && signal.actionable) {
      return {
        action: "pursue",
        priority: signal.type === "opportunity" || signal.type === "threat" ? "urgent" : "high",
        confidence: 90,
      };
    }

    // Medium-score signals
    if (score >= 60) {
      return {
        action: score >= 70 && signal.actionable ? "pursue" : "monitor",
        priority: "medium",
        confidence: 80,
      };
    }

    // Low-score signals
    return {
      action: "ignore",
      priority: "low",
      confidence: 70,
    };
  }

  /**
   * Make decision on a lead
   */
  static async decideOnLead(lead: Lead): Promise<DecisionOutput> {
    const compositeScore = Math.round((lead.fit_score + lead.urgency_score) / 2);

    const { action, priority, confidence } = this.determineLeadAction(lead);

    const reasoning = this.generateLeadReasoning(lead, compositeScore, action);
    const recommended_actions = this.generateLeadActions(lead, action);

    return {
      action,
      priority,
      reasoning,
      recommended_actions,
      confidence,
    };
  }

  /**
   * Determine action for a lead based on quality and urgency
   */
  private static determineLeadAction(
    lead: Lead
  ): Pick<DecisionOutput, "action" | "priority" | "confidence"> {
    if (lead.quality === "hot") {
      return {
        action: "pursue",
        priority: lead.urgency_score >= 80 ? "urgent" : "high",
        confidence: 90,
      };
    }

    if (lead.quality === "warm") {
      return {
        action: "pursue",
        priority: lead.urgency_score >= 70 ? "high" : "medium",
        confidence: 80,
      };
    }

    const compositeScore = (lead.fit_score + lead.urgency_score) / 2;

    return {
      action: compositeScore >= 50 ? "monitor" : "ignore",
      priority: "low",
      confidence: 70,
    };
  }

  /**
   * Prioritize signals by strategic value
   */
  static prioritizeSignals(signals: MarketSignal[]): MarketSignal[] {
    const scoredSignals = signals.map((signal) => ({
      signal,
      score: ScoringEngine.calculateSignalScore(signal),
    }));

    // Sort by score (descending)
    scoredSignals.sort((a, b) => b.score - a.score);

    return scoredSignals.map((item) => item.signal);
  }

  /**
   * Prioritize leads by composite score
   */
  static prioritizeLeads(leads: Lead[]): Lead[] {
    return [...leads].sort((a, b) => {
      const scoreA = (a.fit_score + a.urgency_score) / 2;
      const scoreB = (b.fit_score + b.urgency_score) / 2;
      return scoreB - scoreA;
    });
  }

  // ============================================================
  // PRIVATE REASONING GENERATORS
  // ============================================================

  private static generateSignalReasoning(
    signal: MarketSignal,
    score: number,
    action: string
  ): string {
    const reasons: string[] = [];

    reasons.push(`Composite score: ${score}/100`);
    reasons.push(`Relevance: ${signal.relevance_score}/100`);

    if (signal.actionable) {
      reasons.push("Actionable insight identified");
    }

    if (signal.engagement_score >= 70) {
      reasons.push(`High engagement (${signal.engagement_score}/100)`);
    }

    if (signal.type === "opportunity" || signal.type === "threat") {
      reasons.push(`Strategic signal type: ${signal.type}`);
    }

    return reasons.join(". ");
  }

  private static generateSignalActions(signal: MarketSignal, action: string): string[] {
    const actions: string[] = [];

    if (action === "pursue") {
      const signalActions = this.getSignalTypeActions(signal.type);
      actions.push(...signalActions);

      if (signal.action_items && signal.action_items.length > 0) {
        actions.push(...signal.action_items);
      }
    } else if (action === "monitor") {
      actions.push("Track for changes in engagement or relevance");
      actions.push("Set alert for follow-up signals");
    } else {
      actions.push("Archive signal (low strategic value)");
    }

    return actions;
  }

  private static getSignalTypeActions(signalType: SignalType): string[] {
    const actionMap: Record<SignalType, string[]> = {
      lead: ["Qualify lead and add to CRM", "Research company and decision makers"],
      opportunity: ["Create strategic plan to capitalize", "Assign to product/marketing team"],
      pain_point: ["Develop targeted messaging", "Create content addressing this pain"],
      threat: ["Assess competitive response needed", "Brief leadership team"],
      trend: ["Analyze market impact", "Update positioning strategy"],
      competitor: ["Monitor competitive landscape", "Identify differentiation opportunities"],
      insight: ["Document strategic insight", "Share with relevant teams"],
    };

    return actionMap[signalType] || ["Review and determine next steps"];
  }

  private static generateLeadReasoning(
    lead: Lead,
    compositeScore: number,
    action: string
  ): string {
    const reasons: string[] = [];

    reasons.push(`Quality: ${lead.quality}`);
    reasons.push(
      `Composite score: ${compositeScore}/100 (fit: ${lead.fit_score}, urgency: ${lead.urgency_score})`
    );

    if (lead.title) {
      reasons.push(`Title: ${lead.title}`);
    }

    if (lead.budget_indicator) {
      reasons.push(`Budget tier: ${lead.budget_indicator}`);
    }

    if (lead.pain_points.length > 0) {
      reasons.push(`${lead.pain_points.length} pain points identified`);
    }

    if (lead.intent_signals.length > 0) {
      reasons.push(`${lead.intent_signals.length} intent signals detected`);
    }

    return reasons.join(". ");
  }

  private static generateLeadActions(lead: Lead, action: string): string[] {
    const actions: string[] = [];

    if (action === "pursue") {
      actions.push(...this.getLeadQualityActions(lead.quality));

      if (lead.pain_points.length > 0) {
        actions.push(`Address pain points: ${lead.pain_points[0]}`);
      }

      actions.push(`Next action: ${lead.next_action}`);
    } else if (action === "monitor") {
      actions.push("Add to nurture sequence");
      actions.push("Monitor for intent signal increase");
    } else {
      actions.push("Archive (low fit or urgency)");
    }

    return actions;
  }

  private static getLeadQualityActions(quality: LeadQuality): string[] {
    const actionMap: Record<LeadQuality, string[]> = {
      hot: [
        "Reach out within 24 hours",
        "Personalized outreach (no templates)",
        "Offer executive demo/consultation",
      ],
      warm: [
        "Research company thoroughly",
        "Craft personalized email sequence",
        "Connect on LinkedIn",
      ],
      cold: ["Add to general nurture campaign", "Monitor for quality improvement"],
    };

    return actionMap[quality];
  }
}

// ============================================================
// INTELLIGENCE ROUTER
// ============================================================

export class IntelligenceRouter {
  /**
   * Route signals to appropriate action queues
   */
  static async routeSignals(signals: MarketSignal[]): Promise<{
    urgent: MarketSignal[];
    high: MarketSignal[];
    medium: MarketSignal[];
    low: MarketSignal[];
  }> {
    const urgent: MarketSignal[] = [];
    const high: MarketSignal[] = [];
    const medium: MarketSignal[] = [];
    const low: MarketSignal[] = [];

    for (const signal of signals) {
      const decision = await DecisionEngine.decideOnSignal(signal);

      if (decision.action === "ignore") {
        low.push(signal);
      } else {
        switch (decision.priority) {
          case "urgent":
            urgent.push(signal);
            break;
          case "high":
            high.push(signal);
            break;
          case "medium":
            medium.push(signal);
            break;
          default:
            low.push(signal);
        }
      }
    }

    return { urgent, high, medium, low };
  }

  /**
   * Route leads to appropriate action queues
   */
  static async routeLeads(leads: Lead[]): Promise<{
    hot: Lead[];
    warm: Lead[];
    cold: Lead[];
  }> {
    const hot: Lead[] = [];
    const warm: Lead[] = [];
    const cold: Lead[] = [];

    for (const lead of leads) {
      const decision = await DecisionEngine.decideOnLead(lead);

      if (lead.quality === "hot" || decision.priority === "urgent") {
        hot.push(lead);
      } else if (lead.quality === "warm" || decision.priority === "high") {
        warm.push(lead);
      } else {
        cold.push(lead);
      }
    }

    return { hot, warm, cold };
  }
}
