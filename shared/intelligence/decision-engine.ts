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
 */

import { getSupabaseClient } from "../db/supabase";
import { aiClient } from "../ai/client";
import { logger } from "../dev/tools";
import type { App } from "../types";
import type { MarketSignal, Lead, CompetitorActivity } from "./market-watch";

// ============================================================
// TYPES
// ============================================================

export interface FilterCriteria {
  minRelevance?: number; // 0-100
  minEngagement?: number; // 0-100
  requireActionable?: boolean;
  signalTypes?: string[];
  sources?: string[];
  sentiments?: string[];
  keywords?: string[];
}

export interface ScoringWeights {
  relevance: number; // 0-1
  engagement: number; // 0-1
  recency: number; // 0-1
  sentiment: number; // 0-1
  actionability: number; // 0-1
}

export interface DecisionOutput {
  action: "pursue" | "monitor" | "ignore";
  priority: "urgent" | "high" | "medium" | "low";
  reasoning: string;
  recommended_actions: string[];
  confidence: number; // 0-100
}

// ============================================================
// FILTER ENGINE
// ============================================================

export class FilterEngine {
  /**
   * Filter signals based on brand-aligned criteria
   */
  static filterSignals(signals: MarketSignal[], criteria: FilterCriteria): MarketSignal[] {
    return signals.filter((signal) => {
      // Relevance threshold (default: 70 = only high-quality signals)
      if (criteria.minRelevance && signal.relevance_score < criteria.minRelevance) {
        return false;
      }

      // Engagement threshold
      if (criteria.minEngagement && signal.engagement_score < criteria.minEngagement) {
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
        const hasKeyword = criteria.keywords.some((keyword) =>
          signal.keywords.includes(keyword) ||
          signal.title.toLowerCase().includes(keyword.toLowerCase()) ||
          signal.content.toLowerCase().includes(keyword.toLowerCase())
        );
        if (!hasKeyword) return false;
      }

      return true;
    });
  }

  /**
   * Filter leads based on ICP (Ideal Customer Profile)
   */
  static filterLeads(leads: Lead[], minFitScore: number = 60): Lead[] {
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
    const seen = new Set<string>();
    const unique: MarketSignal[] = [];

    for (const signal of signals) {
      // Create fingerprint: lowercase title + source
      const fingerprint = `${signal.title.toLowerCase()}_${signal.source}`;
      
      if (!seen.has(fingerprint)) {
        seen.add(fingerprint);
        unique.push(signal);
      }
    }

    return unique;
  }

  /**
   * Remove noise (low-value signals)
   */
  static removeNoise(signals: MarketSignal[]): MarketSignal[] {
    return signals.filter((signal) => {
      // Too short (likely spam or low-quality)
      if (signal.content.length < 50) return false;

      // No engagement and low relevance
      if (signal.engagement_score < 10 && signal.relevance_score < 60) return false;

      // Negative sentiment and not actionable
      if (signal.sentiment === "negative" && !signal.actionable) return false;

      return true;
    });
  }
}

// ============================================================
// SCORING ENGINE
// ============================================================

export class ScoringEngine {
  private static DEFAULT_WEIGHTS: ScoringWeights = {
    relevance: 0.40, // Most important: is it relevant to our business?
    engagement: 0.20, // Important: is it resonating with people?
    recency: 0.15, // Moderately important: is it timely?
    sentiment: 0.10, // Less important: sentiment matters but not critical
    actionability: 0.15, // Important: can we act on it?
  };

  /**
   * Calculate comprehensive signal score
   */
  static scoreSignal(signal: MarketSignal, weights?: Partial<ScoringWeights>): number {
    const w = { ...this.DEFAULT_WEIGHTS, ...weights };

    // Relevance score (0-100)
    const relevanceScore = signal.relevance_score;

    // Engagement score (0-100)
    const engagementScore = signal.engagement_score;

    // Recency score (0-100, exponential decay)
    const hoursAgo = (Date.now() - new Date(signal.detected_at).getTime()) / (1000 * 60 * 60);
    const recencyScore = Math.max(0, 100 * Math.exp(-hoursAgo / 24)); // Half-life: 24 hours

    // Sentiment score (0-100)
    const sentimentScore =
      signal.sentiment === "positive" ? 100 :
      signal.sentiment === "neutral" ? 50 :
      25; // negative

    // Actionability score (0-100)
    const actionabilityScore = signal.actionable ? 100 : 0;

    // Weighted composite score
    const compositeScore =
      relevanceScore * w.relevance +
      engagementScore * w.engagement +
      recencyScore * w.recency +
      sentimentScore * w.sentiment +
      actionabilityScore * w.actionability;

    return Math.round(compositeScore);
  }

  /**
   * Calculate lead score using dynamic rules
   */
  static async scoreLeadDynamic(lead: Lead, app: App): Promise<number> {
    const supabase = getSupabaseClient();

    // Get scoring rules
    const { data: rules } = await supabase
      .from("lead_scoring_rules")
      .select("*")
      .eq("app", app)
      .eq("enabled", true)
      .order("priority", { ascending: false });

    let score = 50; // Base score

    if (!rules) return score;

    for (const rule of rules) {
      let applies = false;

      switch (rule.rule_type) {
        case "title":
          if (lead.title) {
            const titles = rule.condition.titles || [];
            applies = titles.some((t: string) =>
              lead.title!.toLowerCase().includes(t.toLowerCase())
            );
          }
          break;

        case "pain_point":
          if (lead.pain_points && lead.pain_points.length > 0) {
            const keywords = rule.condition.keywords || [];
            applies = keywords.some((k: string) =>
              lead.pain_points.some((p) => p.toLowerCase().includes(k.toLowerCase()))
            );
          }
          break;

        case "intent_signal":
          if (lead.intent_signals && lead.intent_signals.length > 0) {
            const keywords = rule.condition.keywords || [];
            applies = keywords.some((k: string) =>
              lead.intent_signals.some((i) => i.toLowerCase().includes(k.toLowerCase()))
            );
          }
          break;

        case "industry":
          if (lead.company) {
            const industries = rule.condition.industries || [];
            applies = industries.some((ind: string) =>
              lead.company!.toLowerCase().includes(ind.toLowerCase())
            );
          }
          break;
      }

      if (applies) {
        score += rule.score_impact;
      }
    }

    // Clamp to 0-100
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Score competitor threat level
   */
  static scoreCompetitorThreat(activity: CompetitorActivity): number {
    let score = 0;

    // Impact level
    score += activity.impact_level === "high" ? 40 : activity.impact_level === "medium" ? 25 : 10;

    // Activity type
    const highThreatActivities = ["funding", "feature", "pricing"];
    if (highThreatActivities.includes(activity.activity_type)) {
      score += 30;
    }

    // Recency
    const hoursAgo = (Date.now() - new Date(activity.detected_at).getTime()) / (1000 * 60 * 60);
    score += Math.max(0, 30 * Math.exp(-hoursAgo / 48)); // Half-life: 48 hours

    return Math.min(100, Math.round(score));
  }
}

// ============================================================
// DECISION ENGINE
// ============================================================

export class DecisionEngine {
  /**
   * Make decision on a market signal
   */
  static async decideSignalAction(signal: MarketSignal): Promise<DecisionOutput> {
    const score = ScoringEngine.scoreSignal(signal);

    // Determine action based on score and characteristics
    let action: "pursue" | "monitor" | "ignore";
    let priority: "urgent" | "high" | "medium" | "low";
    let confidence = 75;

    if (score >= 80 && signal.actionable) {
      action = "pursue";
      priority = signal.type === "opportunity" || signal.type === "threat" ? "urgent" : "high";
      confidence = 90;
    } else if (score >= 60) {
      action = score >= 70 && signal.actionable ? "pursue" : "monitor";
      priority = "medium";
      confidence = 80;
    } else {
      action = "ignore";
      priority = "low";
      confidence = 70;
    }

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
   * Make decision on a lead
   */
  static async decideLeadAction(lead: Lead): Promise<DecisionOutput> {
    const compositeScore = Math.round((lead.fit_score + lead.urgency_score) / 2);

    let action: "pursue" | "monitor" | "ignore";
    let priority: "urgent" | "high" | "medium" | "low";
    let confidence = 75;

    if (lead.quality === "hot") {
      action = "pursue";
      priority = lead.urgency_score >= 80 ? "urgent" : "high";
      confidence = 90;
    } else if (lead.quality === "warm") {
      action = "pursue";
      priority = lead.urgency_score >= 70 ? "high" : "medium";
      confidence = 80;
    } else {
      action = compositeScore >= 50 ? "monitor" : "ignore";
      priority = "low";
      confidence = 70;
    }

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
   * Prioritize signals by strategic value
   */
  static prioritizeSignals(signals: MarketSignal[]): MarketSignal[] {
    const scored = signals.map((signal) => ({
      signal,
      score: ScoringEngine.scoreSignal(signal),
    }));

    // Sort by score (descending)
    scored.sort((a, b) => b.score - a.score);

    return scored.map((item) => item.signal);
  }

  /**
   * Prioritize leads by composite score
   */
  static prioritizeLeads(leads: Lead[]): Lead[] {
    return leads.sort((a, b) => {
      const scoreA = (a.fit_score + a.urgency_score) / 2;
      const scoreB = (b.fit_score + b.urgency_score) / 2;
      return scoreB - scoreA;
    });
  }

  // ============================================================
  // PRIVATE HELPERS
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
      if (signal.type === "lead") {
        actions.push("Qualify lead and add to CRM");
        actions.push("Research company and decision makers");
      } else if (signal.type === "opportunity") {
        actions.push("Create strategic plan to capitalize");
        actions.push("Assign to product/marketing team");
      } else if (signal.type === "pain_point") {
        actions.push("Develop targeted messaging");
        actions.push("Create content addressing this pain");
      } else if (signal.type === "threat") {
        actions.push("Assess competitive response needed");
        actions.push("Brief leadership team");
      }

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

  private static generateLeadReasoning(
    lead: Lead,
    compositeScore: number,
    action: string
  ): string {
    const reasons: string[] = [];

    reasons.push(`Quality: ${lead.quality}`);
    reasons.push(`Composite score: ${compositeScore}/100 (fit: ${lead.fit_score}, urgency: ${lead.urgency_score})`);

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
      if (lead.quality === "hot") {
        actions.push("Reach out within 24 hours");
        actions.push("Personalized outreach (no templates)");
        actions.push("Offer executive demo/consultation");
      } else if (lead.quality === "warm") {
        actions.push("Research company thoroughly");
        actions.push("Craft personalized email sequence");
        actions.push("Connect on LinkedIn");
      }

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
      const decision = await DecisionEngine.decideSignalAction(signal);

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
      const decision = await DecisionEngine.decideLeadAction(lead);

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
