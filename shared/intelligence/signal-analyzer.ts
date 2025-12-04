/**
 * ============================================================
 * SIGNAL ANALYZER - AI-POWERED INTELLIGENCE
 * ============================================================
 * AI-driven analysis of scraped content to extract market intelligence
 */

import { aiClient } from "../ai/client";
import { logger } from "../dev/tools";
import type {
  MarketSignal,
  Lead,
  CompetitorActivity,
  ScrapedContent,
  SignalSource,
  App,
} from "./types";
import { calculateEngagementScore, IntelligenceError } from "./utils";

// ============================================================
// AI ANALYSIS PROMPTS
// ============================================================

const SIGNAL_ANALYSIS_PROMPT = `Analyze this content for market intelligence:

Content: {{CONTENT}}

Extract:
1. Main topic/theme
2. Signal type (trend, pain_point, competitor, lead, opportunity, threat, insight)
3. Relevance to premium social media automation/content management (0-100)
4. Sentiment (positive, neutral, negative)
5. Key entities (companies, people, products)
6. Actionable insights
7. Keywords

Focus on: Executive/premium market, SaaS, content automation, social media management.

Return JSON:
{
  "type": "...",
  "title": "...",
  "relevance_score": 0-100,
  "sentiment": "...",
  "keywords": [...],
  "entities": [...],
  "actionable": true/false,
  "action_items": [...]
}`;

const LEAD_QUALIFICATION_PROMPT = `Qualify this lead for premium social media automation SaaS (Synqra/NØID):

Profile: {{PROFILE}}

Ideal Customer Profile (ICP):
- Title: CMO, VP Marketing, Head of Growth, Director Marketing, CEO/Founder (small/medium)
- Company: SaaS, Tech, Media, E-commerce, 10-500 employees
- Pain points: Content creation, social media management, brand consistency
- Budget: $500-5000/month range
- Signals: Hiring for marketing, fundraising, product launches

Return JSON:
{
  "quality": "hot" | "warm" | "cold",
  "name": "...",
  "company": "...",
  "title": "...",
  "pain_points": [...],
  "intent_signals": [...],
  "fit_score": 0-100,
  "urgency_score": 0-100,
  "budget_indicator": "Enterprise" | "SMB" | "Startup",
  "next_action": "..."
}`;

const COMPETITOR_ANALYSIS_PROMPT = `Analyze this competitor activity:

Data: {{DATA}}

Our position: Premium social media automation (Synqra/NØID)
Brand: Luxury street × quiet luxury, executive-focused

Assess:
1. Activity type (launch, funding, hiring, marketing, feature, pricing)
2. Impact level (high, medium, low)
3. Threat to our business
4. Opportunity we can leverage
5. Recommended response

Return JSON:
{
  "competitor_name": "...",
  "activity_type": "...",
  "description": "...",
  "impact_level": "...",
  "threat_assessment": "...",
  "opportunity_assessment": "...",
  "recommended_response": "..."
}`;

// ============================================================
// SIGNAL ANALYZER
// ============================================================

export class SignalAnalyzer {
  /**
   * Analyze scraped content to create market signal
   */
  static async analyzeSignal(
    rawData: ScrapedContent,
    source: SignalSource,
    app: App
  ): Promise<MarketSignal> {
    try {
      const prompt = SIGNAL_ANALYSIS_PROMPT.replace(
        "{{CONTENT}}",
        JSON.stringify(rawData, null, 2)
      );

      const result = await aiClient.generate({
        prompt,
        taskType: "structural",
        mode: "polished",
        maxTokens: 1000,
      });

      const analysis = JSON.parse(result.content);

      return {
        app,
        source,
        type: analysis.type,
        title: analysis.title,
        content: rawData.text || rawData.content || JSON.stringify(rawData),
        url: rawData.url || "",
        author: rawData.author,
        author_profile: rawData.author_profile,
        engagement_score: calculateEngagementScore({
          likes: rawData.likes,
          comments: rawData.comments,
          shares: rawData.shares,
          views: rawData.views,
        }),
        relevance_score: analysis.relevance_score,
        sentiment: analysis.sentiment,
        keywords: analysis.keywords || [],
        entities: analysis.entities || [],
        actionable: analysis.actionable,
        action_items: analysis.action_items,
        detected_at: new Date().toISOString(),
      };
    } catch (error) {
      logger.error("Signal analysis failed", { source, error });

      // Return basic signal without AI analysis
      return {
        app,
        source,
        type: "insight",
        title: rawData.title || "Untitled",
        content: rawData.text || rawData.content || "",
        url: rawData.url || "",
        engagement_score: 0,
        relevance_score: 50,
        sentiment: "neutral",
        keywords: [],
        entities: [],
        actionable: false,
        detected_at: new Date().toISOString(),
      };
    }
  }

  /**
   * Qualify lead using AI analysis
   */
  static async qualifyLead(
    profile: ScrapedContent,
    source: SignalSource,
    app: App
  ): Promise<Lead> {
    try {
      const prompt = LEAD_QUALIFICATION_PROMPT.replace(
        "{{PROFILE}}",
        JSON.stringify(profile, null, 2)
      );

      const result = await aiClient.generate({
        prompt,
        taskType: "strategic",
        mode: "polished",
        maxTokens: 800,
      });

      const qualification = JSON.parse(result.content);

      return {
        app,
        source,
        quality: qualification.quality,
        name: qualification.name,
        company: qualification.company,
        title: qualification.title,
        pain_points: qualification.pain_points || [],
        intent_signals: qualification.intent_signals || [],
        fit_score: qualification.fit_score,
        urgency_score: qualification.urgency_score,
        budget_indicator: qualification.budget_indicator,
        next_action: qualification.next_action,
        profile_url: profile.url,
        status: "new",
        created_at: new Date().toISOString(),
      };
    } catch (error) {
      logger.error("Lead qualification failed", { source, error });

      return {
        app,
        source,
        quality: "cold",
        pain_points: [],
        intent_signals: [],
        fit_score: 0,
        urgency_score: 0,
        next_action: "Review manually",
        status: "new",
        created_at: new Date().toISOString(),
      };
    }
  }

  /**
   * Analyze competitor activity
   */
  static async analyzeCompetitorActivity(
    data: ScrapedContent,
    app: App
  ): Promise<CompetitorActivity> {
    try {
      const prompt = COMPETITOR_ANALYSIS_PROMPT.replace(
        "{{DATA}}",
        JSON.stringify(data, null, 2)
      );

      const result = await aiClient.generate({
        prompt,
        taskType: "strategic",
        mode: "polished",
        maxTokens: 800,
      });

      const analysis = JSON.parse(result.content);

      return {
        app,
        competitor_name: analysis.competitor_name,
        activity_type: analysis.activity_type,
        description: analysis.description,
        impact_level: analysis.impact_level,
        threat_assessment: analysis.threat_assessment,
        opportunity_assessment: analysis.opportunity_assessment,
        recommended_response: analysis.recommended_response,
        detected_at: new Date().toISOString(),
      };
    } catch (error) {
      logger.error("Competitor analysis failed", { error });

      return {
        app,
        competitor_name: data.author || "Unknown",
        activity_type: "marketing",
        description: data.content || "",
        impact_level: "low",
        threat_assessment: "Unknown",
        detected_at: new Date().toISOString(),
      };
    }
  }

  /**
   * Batch analyze signals
   */
  static async analyzeBatch(
    items: ScrapedContent[],
    source: SignalSource,
    app: App
  ): Promise<MarketSignal[]> {
    const signals: MarketSignal[] = [];

    for (const item of items) {
      try {
        const signal = await this.analyzeSignal(item, source, app);
        signals.push(signal);
      } catch (error) {
        logger.error("Batch signal analysis failed", { source, item: item.title, error });
      }
    }

    return signals;
  }

  /**
   * Batch qualify leads
   */
  static async qualifyBatch(
    profiles: ScrapedContent[],
    source: SignalSource,
    app: App
  ): Promise<Lead[]> {
    const leads: Lead[] = [];

    for (const profile of profiles) {
      try {
        const lead = await this.qualifyLead(profile, source, app);
        leads.push(lead);
      } catch (error) {
        logger.error("Batch lead qualification failed", { source, profile: profile.title, error });
      }
    }

    return leads;
  }
}
