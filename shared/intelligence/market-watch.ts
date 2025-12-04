/**
 * ============================================================
 * MARKET INTELLIGENCE ENGINE - NØID LABS
 * ============================================================
 * Autonomous market watching, lead generation, and competitive analysis
 *
 * Creator Engine → Intelligence Layer Integration:
 * - Scrapers collect raw data from public sources
 * - SignalAnalyzer processes data with AI
 * - MarketIntelligenceEngine orchestrates and stores insights
 * - DecisionEngine prioritizes and routes signals
 */

import { getSupabaseClient, logIntelligence } from "../db/supabase";
import { aiClient } from "../ai/client";
import { logger } from "../dev/tools";
import type { App } from "../types";
import type {
  MarketSignal,
  Lead,
  CompetitorActivity,
  TrendInsight,
  ScrapedContent,
  ScraperOptions,
} from "./types";
import {
  TwitterScraper,
  LinkedInScraper,
  RedditScraper,
  HackerNewsScraper,
  ProductHuntScraper,
  GitHubScraper,
  UnifiedScraper,
} from "./scrapers";
import { SignalAnalyzer } from "./signal-analyzer";
import { deduplicateContent, filterLowQualitySignals, sleep } from "./utils";

// Re-export types for backward compatibility
export type { MarketSignal, Lead, CompetitorActivity, TrendInsight };

// ============================================================
// CONFIGURATION
// ============================================================

interface MarketIntelligenceConfig {
  scanInterval?: number;
  minRelevanceScore?: number;
  enableTwitter?: boolean;
  enableLinkedIn?: boolean;
  enableReddit?: boolean;
  enableHackerNews?: boolean;
  enableProductHunt?: boolean;
  enableGitHub?: boolean;
}

const DEFAULT_CONFIG: Required<MarketIntelligenceConfig> = {
  scanInterval: 3600000, // 1 hour
  minRelevanceScore: 70,
  enableTwitter: true,
  enableLinkedIn: true,
  enableReddit: true,
  enableHackerNews: true,
  enableProductHunt: true,
  enableGitHub: true,
};

// ============================================================
// SEARCH QUERIES (NØID Brand-Aligned)
// ============================================================

const TWITTER_QUERIES = [
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

const LINKEDIN_TARGET_TITLES = [
  "CMO",
  "Chief Marketing Officer",
  "VP Marketing",
  "Vice President Marketing",
  "Head of Growth",
  "Growth Lead",
  "Director of Marketing",
  "CEO",
  "Founder",
];

const LINKEDIN_TARGET_INDUSTRIES = [
  "SaaS",
  "Technology",
  "Media",
  "E-commerce",
  "Professional Services",
];

const REDDIT_SUBREDDITS = [
  "marketing",
  "socialmedia",
  "entrepreneur",
  "startups",
  "SaaS",
  "growthhacking",
];

const REDDIT_KEYWORDS = [
  "social media automation",
  "content scheduling",
  "AI marketing",
  "brand management",
];

// ============================================================
// MARKET INTELLIGENCE ENGINE
// ============================================================

export class MarketIntelligenceEngine {
  private app: App;
  private config: Required<MarketIntelligenceConfig>;
  private isRunning: boolean = false;
  private scanIntervalId?: NodeJS.Timeout;

  // Scrapers
  private readonly twitter: TwitterScraper;
  private readonly linkedin: LinkedInScraper;
  private readonly reddit: RedditScraper;
  private readonly hackerNews: HackerNewsScraper;
  private readonly productHunt: ProductHuntScraper;
  private readonly github: GitHubScraper;

  constructor(app: App, config: MarketIntelligenceConfig = {}) {
    this.app = app;
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Initialize scrapers
    this.twitter = new TwitterScraper();
    this.linkedin = new LinkedInScraper();
    this.reddit = new RedditScraper();
    this.hackerNews = new HackerNewsScraper();
    this.productHunt = new ProductHuntScraper();
    this.github = new GitHubScraper();
  }

  /**
   * Start continuous market monitoring
   */
  start(): void {
    if (this.isRunning) {
      logger.warn(`Market intelligence already running for ${this.app}`);
      return;
    }

    this.isRunning = true;
    logger.info(`Market intelligence engine started for ${this.app}`);

    // Run immediately
    this.runFullScan();

    // Schedule recurring scans
    this.scanIntervalId = setInterval(() => {
      this.runFullScan();
    }, this.config.scanInterval);
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (this.scanIntervalId) {
      clearInterval(this.scanIntervalId);
      this.scanIntervalId = undefined;
    }

    this.isRunning = false;
    logger.info(`Market intelligence engine stopped for ${this.app}`);
  }

  /**
   * Run full intelligence scan across all enabled sources
   */
  private async runFullScan(): Promise<void> {
    if (!this.isRunning) return;

    logger.info("Running full market intelligence scan...");
    const startTime = Date.now();

    try {
      const scanPromises: Promise<void>[] = [];

      if (this.config.enableTwitter) scanPromises.push(this.scanTwitter());
      if (this.config.enableLinkedIn) scanPromises.push(this.scanLinkedIn());
      if (this.config.enableReddit) scanPromises.push(this.scanReddit());
      if (this.config.enableHackerNews) scanPromises.push(this.scanHackerNews());
      if (this.config.enableProductHunt) scanPromises.push(this.scanProductHunt());
      if (this.config.enableGitHub) scanPromises.push(this.scanGitHub());

      await Promise.allSettled(scanPromises);

      const duration = Date.now() - startTime;
      logger.info(`Market scan completed in ${duration}ms`);

      await logIntelligence({
        app: this.app,
        operation: "market_scan",
        success: true,
        metadata: { duration, sources: scanPromises.length },
      });
    } catch (error) {
      logger.error("Market scan failed", { error });

      await logIntelligence({
        app: this.app,
        operation: "market_scan",
        success: false,
        metadata: { error: (error as Error).message },
      });
    }
  }

  /**
   * Scan Twitter/X for signals
   */
  private async scanTwitter(): Promise<void> {
    logger.debug("Scanning Twitter/X...");

    for (const query of TWITTER_QUERIES) {
      try {
        const tweets = await this.twitter.search(query, { limit: 10 });

        for (const tweet of tweets) {
          const signal = await SignalAnalyzer.analyzeSignal(tweet, "twitter", this.app);

          if (signal.relevance_score >= this.config.minRelevanceScore) {
            await this.storeSignal(signal);
          }
        }
      } catch (error) {
        logger.error(`Twitter scan failed for query: ${query}`, { error });
      }
    }
  }

  /**
   * Scan LinkedIn for high-value leads
   */
  private async scanLinkedIn(): Promise<void> {
    logger.debug("Scanning LinkedIn...");

    for (const title of LINKEDIN_TARGET_TITLES) {
      try {
        const profiles = await this.linkedin.searchProfiles(
          `${title} ${LINKEDIN_TARGET_INDUSTRIES.join(" OR ")}`,
          { limit: 5 }
        );

        for (const profile of profiles) {
          const lead = await SignalAnalyzer.qualifyLead(profile, "linkedin", this.app);

          if (lead.quality === "hot" || lead.quality === "warm") {
            await this.storeLead(lead);
          }
        }
      } catch (error) {
        logger.error(`LinkedIn scan failed for title: ${title}`, { error });
      }
    }
  }

  /**
   * Scan Reddit for pain points and discussions
   */
  private async scanReddit(): Promise<void> {
    logger.debug("Scanning Reddit...");

    for (const subreddit of REDDIT_SUBREDDITS) {
      try {
        const posts = await this.reddit.getTopPosts(subreddit, "week", { limit: 10 });

        // Filter for relevant keywords
        const relevantPosts = posts.filter((post) =>
          REDDIT_KEYWORDS.some(
            (keyword) =>
              post.title.toLowerCase().includes(keyword.toLowerCase()) ||
              (post.content && post.content.toLowerCase().includes(keyword.toLowerCase()))
          )
        );

        for (const post of relevantPosts) {
          const signal = await SignalAnalyzer.analyzeSignal(post, "reddit", this.app);

          if (
            (signal.type === "pain_point" || signal.type === "opportunity") &&
            signal.relevance_score >= this.config.minRelevanceScore
          ) {
            await this.storeSignal(signal);
          }
        }
      } catch (error) {
        logger.error(`Reddit scan failed for subreddit: ${subreddit}`, { error });
      }
    }
  }

  /**
   * Scan Hacker News for tech trends
   */
  private async scanHackerNews(): Promise<void> {
    logger.debug("Scanning Hacker News...");

    try {
      const stories = await this.hackerNews.getTopStories({ limit: 20 });

      const relevantStories = stories.filter((story) =>
        ["AI", "marketing", "automation", "SaaS", "social media"].some((keyword) =>
          story.title.toLowerCase().includes(keyword.toLowerCase())
        )
      );

      for (const story of relevantStories) {
        const signal = await SignalAnalyzer.analyzeSignal(story, "hackernews", this.app);

        if (
          (signal.type === "trend" || signal.type === "competitor") &&
          signal.relevance_score >= this.config.minRelevanceScore
        ) {
          await this.storeSignal(signal);
        }
      }
    } catch (error) {
      logger.error("Hacker News scan failed", { error });
    }
  }

  /**
   * Scan Product Hunt for competitor launches
   */
  private async scanProductHunt(): Promise<void> {
    logger.debug("Scanning Product Hunt...");

    try {
      const products = await this.productHunt.getTodayProducts();

      for (const product of products) {
        const activity = await SignalAnalyzer.analyzeCompetitorActivity(product, this.app);

        if (activity.impact_level === "high" || activity.impact_level === "medium") {
          await this.storeCompetitorActivity(activity);
        }
      }
    } catch (error) {
      logger.error("Product Hunt scan failed", { error });
    }
  }

  /**
   * Scan GitHub for tech stack insights
   */
  private async scanGitHub(): Promise<void> {
    logger.debug("Scanning GitHub...");

    const topics = ["social-media-automation", "content-generation", "marketing-automation"];

    for (const topic of topics) {
      try {
        const repos = await this.github.searchRepos(topic, { limit: 10 });

        for (const repo of repos) {
          const signal = await SignalAnalyzer.analyzeSignal(repo, "github", this.app);

          if (
            (signal.type === "trend" || signal.type === "competitor") &&
            signal.relevance_score >= this.config.minRelevanceScore
          ) {
            await this.storeSignal(signal);
          }
        }
      } catch (error) {
        logger.error(`GitHub scan failed for topic: ${topic}`, { error });
      }
    }
  }

  /**
   * Store market signal in database
   */
  private async storeSignal(signal: MarketSignal): Promise<void> {
    try {
      const supabase = getSupabaseClient();

      // Check for duplicates
      const { data: existing } = await supabase
        .from("market_signals")
        .select("id")
        .eq("title", signal.title)
        .eq("source", signal.source)
        .single();

      if (existing) {
        logger.debug("Duplicate signal ignored", { title: signal.title });
        return;
      }

      await supabase.from("market_signals").insert(signal);

      logger.info(`Stored ${signal.type} signal from ${signal.source}`, {
        relevance: signal.relevance_score,
        actionable: signal.actionable,
      });

      await logIntelligence({
        app: this.app,
        operation: "signal_stored",
        success: true,
        metadata: {
          source: signal.source,
          type: signal.type,
          relevance: signal.relevance_score,
        },
      });
    } catch (error) {
      logger.error("Failed to store signal", { error, signal });
    }
  }

  /**
   * Store qualified lead in database
   */
  private async storeLead(lead: Lead): Promise<void> {
    try {
      const supabase = getSupabaseClient();

      // Check for duplicates
      if (lead.profile_url) {
        const { data: existing } = await supabase
          .from("leads")
          .select("id")
          .eq("profile_url", lead.profile_url)
          .single();

        if (existing) {
          logger.debug("Duplicate lead ignored", { profile: lead.profile_url });
          return;
        }
      }

      await supabase.from("leads").insert(lead);

      logger.info(`Stored ${lead.quality} lead from ${lead.source}`, {
        company: lead.company,
        fit: lead.fit_score,
      });
    } catch (error) {
      logger.error("Failed to store lead", { error, lead });
    }
  }

  /**
   * Store competitor activity in database
   */
  private async storeCompetitorActivity(activity: CompetitorActivity): Promise<void> {
    try {
      const supabase = getSupabaseClient();
      await supabase.from("competitor_activity").insert(activity);

      logger.info(`Stored competitor activity: ${activity.competitor_name}`, {
        type: activity.activity_type,
        impact: activity.impact_level,
      });
    } catch (error) {
      logger.error("Failed to store competitor activity", { error, activity });
    }
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

export function getMarketIntelligence(
  app: App,
  config?: MarketIntelligenceConfig
): MarketIntelligenceEngine {
  if (!engines.has(app)) {
    engines.set(app, new MarketIntelligenceEngine(app, config));
  }
  return engines.get(app)!;
}

/**
 * Start market intelligence monitoring
 */
export function startMarketIntelligence(
  app: App,
  config?: MarketIntelligenceConfig
): void {
  const engine = getMarketIntelligence(app, config);
  engine.start();
  logger.info(`✅ Market intelligence enabled for ${app}`);
}

/**
 * Stop market intelligence monitoring
 */
export function stopMarketIntelligence(app: App): void {
  const engine = engines.get(app);
  if (engine) {
    engine.stop();
    engines.delete(app);
    logger.info(`🛑 Market intelligence disabled for ${app}`);
  }
}
