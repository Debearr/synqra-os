/**
 * ============================================================
 * INTELLIGENCE LAYER - SHARED TYPES
 * ============================================================
 * Centralized type definitions for the intelligence layer
 */

import type { App } from "../types";

// ============================================================
// SIGNAL TYPES
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
  | "trend"
  | "pain_point"
  | "competitor"
  | "lead"
  | "opportunity"
  | "threat"
  | "insight";

export type SignalSentiment = "positive" | "neutral" | "negative";

export type LeadQuality = "hot" | "warm" | "cold";

export type LeadStatus = "new" | "contacted" | "qualified" | "converted" | "discarded";

export type ActivityType = "launch" | "funding" | "hiring" | "marketing" | "feature" | "pricing";

export type ImpactLevel = "high" | "medium" | "low";

export type TrendMomentum = "rising" | "stable" | "declining";

export type DecisionAction = "pursue" | "monitor" | "ignore";

export type DecisionPriority = "urgent" | "high" | "medium" | "low";

// ============================================================
// CORE INTERFACES
// ============================================================

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
  engagement_score: number;
  relevance_score: number;
  sentiment: SignalSentiment;
  keywords: string[];
  entities: string[];
  actionable: boolean;
  action_items?: string[];
  metadata?: Record<string, unknown>;
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
  fit_score: number;
  urgency_score: number;
  budget_indicator?: string;
  next_action: string;
  enriched_data?: Record<string, unknown>;
  status: LeadStatus;
  assigned_to?: string;
  metadata?: Record<string, unknown>;
  created_at?: string;
}

export interface CompetitorActivity {
  id?: string;
  app: App;
  competitor_name: string;
  activity_type: ActivityType;
  description: string;
  impact_level: ImpactLevel;
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
  momentum: TrendMomentum;
  search_volume_change?: number;
  relevant_keywords: string[];
  target_audience: string;
  opportunity_description: string;
  recommended_positioning: string;
  confidence: number;
  detected_at: string;
  created_at?: string;
}

// ============================================================
// DECISION TYPES
// ============================================================

export interface FilterCriteria {
  minRelevance?: number;
  minEngagement?: number;
  requireActionable?: boolean;
  signalTypes?: SignalType[];
  sources?: SignalSource[];
  sentiments?: SignalSentiment[];
  keywords?: string[];
}

export interface ScoringWeights {
  relevance: number;
  engagement: number;
  recency: number;
  sentiment: number;
  actionability: number;
}

export interface DecisionOutput {
  action: DecisionAction;
  priority: DecisionPriority;
  reasoning: string;
  recommended_actions: string[];
  confidence: number;
}

// ============================================================
// SCRAPER TYPES
// ============================================================

export interface ScrapedContent {
  title: string;
  text?: string;
  content?: string;
  url: string;
  author?: string;
  author_profile?: string;
  timestamp?: string;
  likes?: number;
  comments?: number;
  shares?: number;
  views?: number;
  metadata?: Record<string, unknown>;
}

export interface ScraperOptions {
  limit?: number;
  timeout?: number;
  retryCount?: number;
  retryDelay?: number;
}

export interface HTTPRequestOptions {
  method?: "GET" | "POST";
  headers?: Record<string, string>;
  body?: string;
  timeout?: number;
}

// ============================================================
// ERROR TYPES
// ============================================================

export class IntelligenceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = "IntelligenceError";
  }
}

export class ScraperError extends IntelligenceError {
  constructor(
    message: string,
    public readonly source: SignalSource,
    context?: Record<string, unknown>
  ) {
    super(message, "SCRAPER_ERROR", { ...context, source });
    this.name = "ScraperError";
  }
}

export class ValidationError extends IntelligenceError {
  constructor(
    message: string,
    public readonly field: string,
    context?: Record<string, unknown>
  ) {
    super(message, "VALIDATION_ERROR", { ...context, field });
    this.name = "ValidationError";
  }
}

// ============================================================
// VALIDATION SCHEMAS
// ============================================================

export const SCORE_RANGE = { min: 0, max: 100 } as const;
export const CONFIDENCE_RANGE = { min: 0, max: 100 } as const;
export const WEIGHT_RANGE = { min: 0, max: 1 } as const;

export const DEFAULT_SCRAPER_OPTIONS: Required<ScraperOptions> = {
  limit: 20,
  timeout: 10000,
  retryCount: 3,
  retryDelay: 1000,
} as const;

export const DEFAULT_SCORING_WEIGHTS: ScoringWeights = {
  relevance: 0.4,
  engagement: 0.2,
  recency: 0.15,
  sentiment: 0.1,
  actionability: 0.15,
} as const;
