/**
 * ============================================================
 * MARKET INTELLIGENCE ENGINE - NØID LABS
 * ============================================================
 * Autonomous market watching, lead generation, and competitive analysis
 * 
 * Sources (Zero Cost):
 * - Twitter/X (trending topics, influencers, conversations)
 * - LinkedIn (decision makers, company updates, job postings)
 * - Reddit (pain points, sentiment, discussions)
 * - Hacker News (tech trends, launches, debates)
 * - Product Hunt (competitor launches, trends)
 * - GitHub (open source activity, tech stack analysis)
 * - Google Trends (search interest over time)
 * - RSS Feeds (industry blogs, news)
 * 
 * NØID Labs Brand Alignment:
 * - Premium positioning focus
 * - Luxury market signals only
 * - Executive decision-maker targeting
 * - Strategic insights, not noise
 * - Clean, actionable intelligence
 */

import { getSupabaseClient, logIntelligence } from "../db/supabase";
import { aiClient } from "../ai/client";
import { logger } from "../dev/tools";
import type { App } from "../types";

// ============================================================
// TYPES
// ============================================================

export type SignalSource = 
  | "twitter" 
  | "linkedin" 
  | "reddit" 
  | "hackernews" 
  | "producthunt" 
  | "github"
  | "google_trends"
  | "rss";

export type SignalType = 
  | "trend"           // Emerging trend
  | "pain_point"      // Customer problem
  | "competitor"      // Competitor activity
  | "lead"            // Potential customer
  | "opportunity"     // Market opportunity
  | "threat"          // Competitive threat
  | "insight";        // Strategic insight

export type LeadQuality = "hot" | "warm" | "cold";

export interface MarketSignal {
  id?: string;
  app: App;
  source: SignalSource;
  type: SignalType;
  title: string;
  content: string;
  url: string;
  author?: string;
  author_profile?: string;
  engagement_score: number; // 0-100 (reach, likes, shares, etc.)
  relevance_score: number; // 0-100 (how relevant to our business)
  sentiment: "positive" | "neutral" | "negative";
  keywords: string[];
  entities: string[]; // Companies, people, products mentioned
  actionable: boolean; // Can we act on this?
  action_items?: string[];
  metadata?: Record<string, any>;
  detected_at: string;
  created_at?: string;
}

export interface Lead {
  id?: string;
  app: App;
  source: SignalSource;
  quality: LeadQuality;
  name?: string;
  company?: string;
  title?: string;
  profile_url?: string;
  contact_email?: string;
  pain_points: string[];
  intent_signals: string[];
  fit_score: number; // 0-100 (how well they match ICP)
  urgency_score: number; // 0-100 (how urgent their need is)
  budget_indicator?: string; // Enterprise, SMB, Startup
  next_action: string;
  enriched_data?: Record<string, any>;
  status: "new" | "contacted" | "qualified" | "converted" | "discarded";
  assigned_to?: string;
  metadata?: Record<string, any>;
  created_at?: string;
}

export interface CompetitorActivity {
  id?: string;
  app: App;
  competitor_name: string;
  activity_type: "launch" | "funding" | "hiring" | "marketing" | "feature" | "pricing";
  description: string;
  impact_level: "high" | "medium" | "low";
  threat_assessment: string;
  opportunity_assessment?: string;
  recommended_response?: string;
  detected_at: string;
  created_at?: string;
}

export interface TrendInsight {
  id?: string;
  app: App;
  trend_name: string;
  category: string;
  momentum: "rising" | "stable" | "declining";
  search_volume_change?: number; // Percentage change
  relevant_keywords: string[];
  target_audience: string;
  opportunity_description: string;
  recommended_positioning: string;
  confidence: number; // 0-100
  detected_at: string;
  created_at?: string;
}

// ============================================================
// MARKET INTELLIGENCE ENGINE
// ============================================================

export class MarketIntelligenceEngine {
  private app: App;
  private isRunning: boolean = false;
  private scanInterval: number = 3600000; // 1 hour (configurable)

  constructor(app: App, options?: { scanInterval?: number }) {
    this.app = app;
    this.scanInterval = options?.scanInterval || 3600000;
  }

  /**
   * Start continuous market monitoring
   */
  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    logger.info(`Market intelligence engine started for ${this.app}`);
    this.runScans();
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    this.isRunning = false;
    logger.info(`Market intelligence engine stopped for ${this.app}`);
  }

  /**
   * Run all intelligence scans
   */
  private async runScans(): Promise<void> {
    while (this.isRunning) {
      try {
        logger.info("Running market intelligence scan...");

        await Promise.all([
          this.scanTwitter(),
          this.scanLinkedIn(),
          this.scanReddit(),
          this.scanHackerNews(),
          this.scanProductHunt(),
          this.scanGitHub(),
        ]);

        await this.sleep(this.scanInterval);
      } catch (error) {
        logger.error("Market scan error:", error);
        await this.sleep(this.scanInterval);
      }
    }
  }

  /**
   * Scan Twitter/X for signals
   */
  private async scanTwitter(): Promise<void> {
    logger.debug("Scanning Twitter/X...");

    // Define search queries aligned with NØID brand
    const queries = [
      // Pain points
      "need social media automation",
      "struggling with content creation",
      "looking for AI marketing tool",
      
      // Decision makers
      "CMO looking for",
      "VP Marketing seeking",
      "Head of Growth needs",
      
      // Competitor mentions
      "alternative to [competitor]",
      "better than [competitor]",
      
      // Premium/luxury signals
      "premium marketing tool",
      "executive social media",
      "enterprise content automation",
    ];

    for (const query of queries) {
      try {
        // In production, use Twitter API or web scraping
        const tweets = await this.fetchTwitter(query);
        
        for (const tweet of tweets) {
          const signal = await this.analyzeSignal(tweet, "twitter");
          
          if (signal.relevance_score >= 70) {
            await this.processSignal(signal);
          }
        }
      } catch (error) {
        logger.error(`Twitter scan error for "${query}":`, error);
      }
    }
  }

  /**
   * Scan LinkedIn for high-value leads
   */
  private async scanLinkedIn(): Promise<void> {
    logger.debug("Scanning LinkedIn...");

    // Focus on executive decision-makers (NØID brand alignment)
    const targetTitles = [
      "CMO", "Chief Marketing Officer",
      "VP Marketing", "Vice President Marketing",
      "Head of Growth", "Growth Lead",
      "Director of Marketing",
      "CEO", "Founder", // Small/medium companies
    ];

    const targetIndustries = [
      "SaaS", "Technology", "Media", "E-commerce", "Professional Services"
    ];

    // In production, use LinkedIn Sales Navigator or web scraping
    const profiles = await this.fetchLinkedInProfiles(targetTitles, targetIndustries);

    for (const profile of profiles) {
      const lead = await this.qualifyLead(profile, "linkedin");
      
      if (lead.quality === "hot" || lead.quality === "warm") {
        await this.saveLead(lead);
      }
    }
  }

  /**
   * Scan Reddit for pain points and discussions
   */
  private async scanReddit(): Promise<void> {
    logger.debug("Scanning Reddit...");

    // Target subreddits with our ICP (premium, executive focus)
    const subreddits = [
      "marketing",
      "socialmedia",
      "entrepreneur",
      "startups",
      "SaaS",
      "growthhacking",
    ];

    const keywords = [
      "social media automation",
      "content scheduling",
      "AI marketing",
      "brand management",
    ];

    for (const subreddit of subreddits) {
      const posts = await this.fetchRedditPosts(subreddit, keywords);
      
      for (const post of posts) {
        const signal = await this.analyzeSignal(post, "reddit");
        
        // Focus on pain points and opportunities
        if (signal.type === "pain_point" || signal.type === "opportunity") {
          await this.processSignal(signal);
        }
      }
    }
  }

  /**
   * Scan Hacker News for tech trends
   */
  private async scanHackerNews(): Promise<void> {
    logger.debug("Scanning Hacker News...");

    const keywords = [
      "AI marketing",
      "social media automation",
      "content generation",
      "SaaS launch",
    ];

    const posts = await this.fetchHackerNewsPosts(keywords);

    for (const post of posts) {
      const signal = await this.analyzeSignal(post, "hackernews");
      
      if (signal.type === "trend" || signal.type === "competitor") {
        await this.processSignal(signal);
      }
    }
  }

  /**
   * Scan Product Hunt for competitor launches
   */
  private async scanProductHunt(): Promise<void> {
    logger.debug("Scanning Product Hunt...");

    const categories = [
      "Marketing",
      "Social Media",
      "AI",
      "Automation",
    ];

    for (const category of categories) {
      const products = await this.fetchProductHuntLaunches(category);
      
      for (const product of products) {
        const activity = await this.analyzeCompetitorActivity(product);
        
        if (activity.impact_level === "high" || activity.impact_level === "medium") {
          await this.saveCompetitorActivity(activity);
        }
      }
    }
  }

  /**
   * Scan GitHub for tech stack insights
   */
  private async scanGitHub(): Promise<void> {
    logger.debug("Scanning GitHub...");

    // Monitor relevant technologies and frameworks
    const topics = [
      "social-media-automation",
      "content-generation",
      "marketing-automation",
    ];

    for (const topic of topics) {
      const repos = await this.fetchGitHubRepos(topic);
      
      for (const repo of repos) {
        const signal = await this.analyzeSignal(repo, "github");
        
        if (signal.type === "trend" || signal.type === "competitor") {
          await this.processSignal(signal);
        }
      }
    }
  }

  /**
   * Analyze signal with AI to extract insights
   */
  private async analyzeSignal(
    rawData: any,
    source: SignalSource
  ): Promise<MarketSignal> {
    const prompt = `Analyze this ${source} content for market intelligence:

Content: ${JSON.stringify(rawData, null, 2)}

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

    try {
      const result = await aiClient.generate({
        prompt,
        taskType: "structural",
        mode: "polished",
        maxTokens: 1000,
      });

      const analysis = JSON.parse(result.content);

      return {
        app: this.app,
        source,
        type: analysis.type,
        title: analysis.title,
        content: rawData.text || rawData.content || JSON.stringify(rawData),
        url: rawData.url || "",
        author: rawData.author,
        author_profile: rawData.author_profile,
        engagement_score: this.calculateEngagement(rawData),
        relevance_score: analysis.relevance_score,
        sentiment: analysis.sentiment,
        keywords: analysis.keywords || [],
        entities: analysis.entities || [],
        actionable: analysis.actionable,
        action_items: analysis.action_items,
        detected_at: new Date().toISOString(),
      };
    } catch (error) {
      logger.error("Signal analysis error:", error);
      // Return basic signal without AI analysis
      return {
        app: this.app,
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
   * Qualify lead based on profile data
   */
  private async qualifyLead(profile: any, source: SignalSource): Promise<Lead> {
    const prompt = `Qualify this lead for premium social media automation SaaS (Synqra/NØID):

Profile: ${JSON.stringify(profile, null, 2)}

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

    try {
      const result = await aiClient.generate({
        prompt,
        taskType: "strategic",
        mode: "polished",
        maxTokens: 800,
      });

      const qualification = JSON.parse(result.content);

      return {
        app: this.app,
        source,
        ...qualification,
        profile_url: profile.url,
        status: "new",
        created_at: new Date().toISOString(),
      };
    } catch (error) {
      logger.error("Lead qualification error:", error);
      return {
        app: this.app,
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
  private async analyzeCompetitorActivity(data: any): Promise<CompetitorActivity> {
    const prompt = `Analyze this competitor activity:

Data: ${JSON.stringify(data, null, 2)}

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

    try {
      const result = await aiClient.generate({
        prompt,
        taskType: "strategic",
        mode: "polished",
        maxTokens: 800,
      });

      const analysis = JSON.parse(result.content);

      return {
        app: this.app,
        ...analysis,
        detected_at: new Date().toISOString(),
      };
    } catch (error) {
      logger.error("Competitor analysis error:", error);
      return {
        app: this.app,
        competitor_name: data.name || "Unknown",
        activity_type: "marketing",
        description: data.description || "",
        impact_level: "low",
        threat_assessment: "Unknown",
        detected_at: new Date().toISOString(),
      };
    }
  }

  /**
   * Calculate engagement score from raw data
   */
  private calculateEngagement(data: any): number {
    const likes = data.likes || data.upvotes || 0;
    const comments = data.comments || data.replies || 0;
    const shares = data.shares || data.retweets || 0;
    const views = data.views || 0;

    // Weighted scoring
    const score = (likes * 1) + (comments * 2) + (shares * 3) + (views * 0.01);
    
    // Normalize to 0-100
    return Math.min(100, Math.round(score / 10));
  }

  /**
   * Process and store signal
   */
  private async processSignal(signal: MarketSignal): Promise<void> {
    try {
      const supabase = getSupabaseClient();
      await supabase.from("market_signals").insert(signal);

      logger.info(`Processed ${signal.type} signal from ${signal.source}`, {
        relevance: signal.relevance_score,
        actionable: signal.actionable,
      });

      // Log intelligence
      await logIntelligence({
        app: this.app,
        operation: "market_intelligence",
        success: true,
        metadata: {
          source: signal.source,
          type: signal.type,
          relevance: signal.relevance_score,
        },
      });
    } catch (error) {
      logger.error("Failed to process signal:", error);
    }
  }

  /**
   * Save qualified lead
   */
  private async saveLead(lead: Lead): Promise<void> {
    try {
      const supabase = getSupabaseClient();
      await supabase.from("leads").insert(lead);

      logger.info(`Saved ${lead.quality} lead from ${lead.source}`, {
        company: lead.company,
        fit: lead.fit_score,
      });
    } catch (error) {
      logger.error("Failed to save lead:", error);
    }
  }

  /**
   * Save competitor activity
   */
  private async saveCompetitorActivity(activity: CompetitorActivity): Promise<void> {
    try {
      const supabase = getSupabaseClient();
      await supabase.from("competitor_activity").insert(activity);

      logger.info(`Logged competitor activity: ${activity.competitor_name}`, {
        type: activity.activity_type,
        impact: activity.impact_level,
      });
    } catch (error) {
      logger.error("Failed to save competitor activity:", error);
    }
  }

  // ============================================================
  // MOCK FETCH FUNCTIONS (Replace with real implementations)
  // ============================================================

  private async fetchTwitter(query: string): Promise<any[]> {
    // TODO: Implement Twitter API or web scraping
    // For now, return empty array
    return [];
  }

  private async fetchLinkedInProfiles(titles: string[], industries: string[]): Promise<any[]> {
    // TODO: Implement LinkedIn scraping (Sales Navigator or web scraping)
    return [];
  }

  private async fetchRedditPosts(subreddit: string, keywords: string[]): Promise<any[]> {
    // TODO: Implement Reddit API
    return [];
  }

  private async fetchHackerNewsPosts(keywords: string[]): Promise<any[]> {
    // TODO: Implement Hacker News API
    return [];
  }

  private async fetchProductHuntLaunches(category: string): Promise<any[]> {
    // TODO: Implement Product Hunt API
    return [];
  }

  private async fetchGitHubRepos(topic: string): Promise<any[]> {
    // TODO: Implement GitHub API
    return [];
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ============================================================
// INTELLIGENCE AGGREGATOR
// ============================================================

export class IntelligenceAggregator {
  /**
   * Get daily intelligence digest
   */
  static async getDailyDigest(app: App): Promise<{
    hot_leads: Lead[];
    key_signals: MarketSignal[];
    competitor_moves: CompetitorActivity[];
    trend_insights: TrendInsight[];
  }> {
    const supabase = getSupabaseClient();
    const since = new Date(Date.now() - 86400000).toISOString(); // Last 24h

    const [leadsData, signalsData, competitorData] = await Promise.all([
      supabase
        .from("leads")
        .select("*")
        .eq("app", app)
        .in("quality", ["hot", "warm"])
        .eq("status", "new")
        .gte("created_at", since)
        .order("fit_score", { ascending: false })
        .limit(10),

      supabase
        .from("market_signals")
        .select("*")
        .eq("app", app)
        .gte("relevance_score", 70)
        .eq("actionable", true)
        .gte("detected_at", since)
        .order("relevance_score", { ascending: false })
        .limit(20),

      supabase
        .from("competitor_activity")
        .select("*")
        .eq("app", app)
        .in("impact_level", ["high", "medium"])
        .gte("detected_at", since)
        .order("impact_level", { ascending: false })
        .limit(10),
    ]);

    return {
      hot_leads: leadsData.data || [],
      key_signals: signalsData.data || [],
      competitor_moves: competitorData.data || [],
      trend_insights: [], // TODO: Implement trend analysis
    };
  }

  /**
   * Get executive summary (clean, actionable)
   */
  static async getExecutiveSummary(app: App): Promise<string> {
    const digest = await this.getDailyDigest(app);

    const prompt = `Create an executive summary of market intelligence for ${app}:

Hot Leads: ${digest.hot_leads.length}
Key Signals: ${digest.key_signals.length}
Competitor Moves: ${digest.competitor_moves.length}

Data:
${JSON.stringify(digest, null, 2)}

Create a concise executive summary:
- 3-5 key insights only
- Strategic focus (what matters)
- Action items (what to do)
- Premium tone (C-suite audience)

Format: Clean markdown, max 300 words.`;

    const result = await aiClient.generate({
      prompt,
      taskType: "strategic",
      mode: "polished",
      maxTokens: 500,
    });

    return result.content;
  }
}

// ============================================================
// GLOBAL INSTANCES
// ============================================================

const engines = new Map<App, MarketIntelligenceEngine>();

export function getMarketIntelligence(app: App): MarketIntelligenceEngine {
  if (!engines.has(app)) {
    engines.set(app, new MarketIntelligenceEngine(app));
  }
  return engines.get(app)!;
}

/**
 * Start market intelligence monitoring
 */
export function startMarketIntelligence(app: App): void {
  const engine = getMarketIntelligence(app);
  engine.start();
  logger.info(`✅ Market intelligence enabled for ${app}`);
}
