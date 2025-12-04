/**
 * ============================================================
 * INTELLIGENCE LAYER - PUBLIC API
 * ============================================================
 * Centralized exports for the intelligence layer
 */

// Core types
export type {
  SignalSource,
  SignalType,
  SignalSentiment,
  LeadQuality,
  LeadStatus,
  ActivityType,
  ImpactLevel,
  TrendMomentum,
  DecisionAction,
  DecisionPriority,
  MarketSignal,
  Lead,
  CompetitorActivity,
  TrendInsight,
  FilterCriteria,
  ScoringWeights,
  DecisionOutput,
  ScrapedContent,
  ScraperOptions,
} from "./types";

// Error types
export { IntelligenceError, ScraperError, ValidationError } from "./types";

// Utilities
export {
  validateScore,
  validateScoringWeights,
  validateFilterCriteria,
  validateURL,
  sanitizeString,
  clamp,
  sleep,
  withRetry,
  stripHTMLTags,
  parseRSSFeed,
  calculateEngagementScore,
  calculateRecencyScore,
  matchesKeywords,
  deduplicateContent,
  filterLowQualitySignals,
} from "./utils";

// Scrapers
export {
  TwitterScraper,
  LinkedInScraper,
  RedditScraper,
  HackerNewsScraper,
  ProductHuntScraper,
  GitHubScraper,
  GoogleTrendsScraper,
  UnifiedScraper,
} from "./scrapers";

// Signal analyzer
export { SignalAnalyzer } from "./signal-analyzer";

// Market intelligence
export {
  MarketIntelligenceEngine,
  IntelligenceAggregator,
  getMarketIntelligence,
  startMarketIntelligence,
  stopMarketIntelligence,
} from "./market-watch";

// Decision engine
export {
  FilterEngine,
  ScoringEngine,
  DecisionEngine,
  IntelligenceRouter,
} from "./decision-engine";
