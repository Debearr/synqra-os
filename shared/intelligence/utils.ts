/**
 * ============================================================
 * INTELLIGENCE LAYER - SHARED UTILITIES
 * ============================================================
 * Reusable utility functions for the intelligence layer
 */

import { logger } from "../dev/tools";
import type {
  ScraperOptions,
  HTTPRequestOptions,
  ScrapedContent,
  SignalSource,
  ScoringWeights,
  FilterCriteria,
  MarketSignal,
} from "./types";
import {
  ValidationError,
  ScraperError,
  SCORE_RANGE,
  WEIGHT_RANGE,
  DEFAULT_SCRAPER_OPTIONS,
} from "./types";

// ============================================================
// VALIDATION UTILITIES
// ============================================================

/**
 * Validate score is within valid range (0-100)
 */
export function validateScore(score: number, fieldName: string): void {
  if (typeof score !== "number" || isNaN(score)) {
    throw new ValidationError(`${fieldName} must be a valid number`, fieldName);
  }
  if (score < SCORE_RANGE.min || score > SCORE_RANGE.max) {
    throw new ValidationError(
      `${fieldName} must be between ${SCORE_RANGE.min} and ${SCORE_RANGE.max}`,
      fieldName,
      { value: score }
    );
  }
}

/**
 * Validate scoring weights sum to 1.0 and are in valid range
 */
export function validateScoringWeights(weights: Partial<ScoringWeights>): void {
  const entries = Object.entries(weights) as [keyof ScoringWeights, number][];

  for (const [key, value] of entries) {
    if (typeof value !== "number" || isNaN(value)) {
      throw new ValidationError(`Weight ${key} must be a valid number`, key);
    }
    if (value < WEIGHT_RANGE.min || value > WEIGHT_RANGE.max) {
      throw new ValidationError(
        `Weight ${key} must be between ${WEIGHT_RANGE.min} and ${WEIGHT_RANGE.max}`,
        key,
        { value }
      );
    }
  }

  const sum = entries.reduce((acc, [, value]) => acc + value, 0);
  const tolerance = 0.01; // Allow small floating point errors

  if (Math.abs(sum - 1.0) > tolerance) {
    throw new ValidationError(
      "Scoring weights must sum to 1.0",
      "weights",
      { sum, weights }
    );
  }
}

/**
 * Validate URL format
 */
export function validateURL(url: string, fieldName: string = "url"): void {
  if (typeof url !== "string" || url.trim().length === 0) {
    throw new ValidationError("URL cannot be empty", fieldName);
  }

  try {
    new URL(url);
  } catch {
    throw new ValidationError(`Invalid URL format: ${url}`, fieldName, { url });
  }
}

/**
 * Validate filter criteria
 */
export function validateFilterCriteria(criteria: FilterCriteria): void {
  if (criteria.minRelevance !== undefined) {
    validateScore(criteria.minRelevance, "minRelevance");
  }
  if (criteria.minEngagement !== undefined) {
    validateScore(criteria.minEngagement, "minEngagement");
  }
  if (criteria.keywords) {
    if (!Array.isArray(criteria.keywords)) {
      throw new ValidationError("keywords must be an array", "keywords");
    }
    if (criteria.keywords.some((k) => typeof k !== "string" || k.trim().length === 0)) {
      throw new ValidationError("All keywords must be non-empty strings", "keywords");
    }
  }
}

/**
 * Sanitize string input (prevent injection attacks)
 */
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, "") // Remove potential HTML/XML tags
    .replace(/['"]/g, "") // Remove quotes
    .substring(0, 1000); // Limit length
}

/**
 * Clamp number to range
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// ============================================================
// HTTP UTILITIES
// ============================================================

/**
 * Sleep utility for rate limiting
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry wrapper with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    retryCount?: number;
    retryDelay?: number;
    source?: SignalSource;
  } = {}
): Promise<T> {
  const { retryCount = 3, retryDelay = 1000, source } = options;
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= retryCount; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt < retryCount) {
        const delay = retryDelay * Math.pow(2, attempt);
        logger.warn(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`, {
          source,
          error: lastError.message,
        });
        await sleep(delay);
      }
    }
  }

  throw new ScraperError(
    `Failed after ${retryCount + 1} attempts: ${lastError?.message}`,
    source || "unknown",
    { originalError: lastError }
  );
}

/**
 * Rate-limited fetch wrapper
 */
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_WINDOW = 1000; // 1 second

export async function fetchWithRateLimit(
  url: string,
  options: HTTPRequestOptions = {},
  source: SignalSource
): Promise<Response> {
  validateURL(url);

  // Extract domain for rate limiting
  const domain = new URL(url).hostname;
  const now = Date.now();
  const lastRequest = rateLimitMap.get(domain) || 0;
  const timeSinceLastRequest = now - lastRequest;

  if (timeSinceLastRequest < RATE_LIMIT_WINDOW) {
    await sleep(RATE_LIMIT_WINDOW - timeSinceLastRequest);
  }

  rateLimitMap.set(domain, Date.now());

  const controller = new AbortController();
  const timeout = options.timeout || DEFAULT_SCRAPER_OPTIONS.timeout;
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      method: options.method || "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; NOID-Bot/1.0; +https://noidlabs.com)",
        ...options.headers,
      },
      body: options.body,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new ScraperError(
        `HTTP ${response.status}: ${response.statusText}`,
        source,
        { url, status: response.status }
      );
    }

    return response;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof ScraperError) {
      throw error;
    }

    throw new ScraperError(
      `Fetch failed: ${(error as Error).message}`,
      source,
      { url, originalError: error }
    );
  }
}

// ============================================================
// PARSING UTILITIES
// ============================================================

/**
 * Strip HTML tags from content
 */
export function stripHTMLTags(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

/**
 * Extract text from CDATA sections
 */
export function extractCDATA(text: string): string {
  const cdataMatch = text.match(/<!\[CDATA\[(.*?)\]\]>/);
  return cdataMatch ? cdataMatch[1] : text;
}

/**
 * Parse RSS feed to scraped content
 */
export function parseRSSFeed(
  xml: string,
  options: {
    titleRegex?: RegExp;
    linkRegex?: RegExp;
    descRegex?: RegExp;
  } = {}
): ScrapedContent[] {
  const {
    titleRegex = /<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/,
    linkRegex = /<link>(.*?)<\/link>/,
    descRegex = /<description>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/description>/,
  } = options;

  const items: ScrapedContent[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  const matches = xml.matchAll(itemRegex);

  for (const match of matches) {
    const item = match[1];

    const titleMatch = item.match(titleRegex);
    const linkMatch = item.match(linkRegex);
    const descMatch = item.match(descRegex);

    if (titleMatch && linkMatch) {
      items.push({
        title: stripHTMLTags(titleMatch[1]),
        content: descMatch ? stripHTMLTags(descMatch[1]) : titleMatch[1],
        url: linkMatch[1],
      });
    }
  }

  return items;
}

/**
 * Calculate engagement score from metrics
 */
export function calculateEngagementScore(metrics: {
  likes?: number;
  comments?: number;
  shares?: number;
  views?: number;
}): number {
  const { likes = 0, comments = 0, shares = 0, views = 0 } = metrics;

  // Weighted scoring: shares > comments > likes > views
  const rawScore = (likes * 1) + (comments * 2) + (shares * 3) + (views * 0.01);

  // Normalize to 0-100 scale
  const normalizedScore = Math.min(100, Math.round(rawScore / 10));

  return clamp(normalizedScore, SCORE_RANGE.min, SCORE_RANGE.max);
}

/**
 * Calculate recency score with exponential decay
 */
export function calculateRecencyScore(timestamp: string | Date, halfLifeHours: number = 24): number {
  const detectedAt = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
  const hoursAgo = (Date.now() - detectedAt.getTime()) / (1000 * 60 * 60);
  const score = Math.max(0, 100 * Math.exp(-hoursAgo / halfLifeHours));

  return clamp(Math.round(score), SCORE_RANGE.min, SCORE_RANGE.max);
}

// ============================================================
// FILTERING UTILITIES
// ============================================================

/**
 * Check if content matches keywords
 */
export function matchesKeywords(
  content: { title: string; content: string; keywords?: string[] },
  keywords: string[]
): boolean {
  if (keywords.length === 0) return true;

  const lowerTitle = content.title.toLowerCase();
  const lowerContent = content.content.toLowerCase();
  const contentKeywords = content.keywords?.map((k) => k.toLowerCase()) || [];

  return keywords.some((keyword) => {
    const lowerKeyword = keyword.toLowerCase();
    return (
      lowerTitle.includes(lowerKeyword) ||
      lowerContent.includes(lowerKeyword) ||
      contentKeywords.includes(lowerKeyword)
    );
  });
}

/**
 * Deduplicate content by fingerprint
 */
export function deduplicateContent<T extends { title: string; url?: string }>(
  items: T[]
): T[] {
  const seen = new Set<string>();
  const unique: T[] = [];

  for (const item of items) {
    // Create fingerprint: lowercase title (or URL if title is generic)
    const fingerprint = item.title.length > 10
      ? item.title.toLowerCase().substring(0, 100)
      : (item.url || item.title).toLowerCase();

    if (!seen.has(fingerprint)) {
      seen.add(fingerprint);
      unique.push(item);
    }
  }

  return unique;
}

/**
 * Filter low-quality signals
 */
export function filterLowQualitySignals(signals: MarketSignal[]): MarketSignal[] {
  return signals.filter((signal) => {
    // Too short (likely spam)
    if (signal.content.length < 50) return false;

    // No engagement and low relevance
    if (signal.engagement_score < 10 && signal.relevance_score < 60) return false;

    // Negative sentiment without actionable insights
    if (signal.sentiment === "negative" && !signal.actionable) return false;

    return true;
  });
}

// ============================================================
// LOGGING UTILITIES
// ============================================================

/**
 * Log intelligence operation
 */
export function logIntelligenceOperation(
  operation: string,
  source: SignalSource,
  data: Record<string, unknown>
): void {
  logger.info(`Intelligence: ${operation}`, {
    source,
    ...data,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Log scraper metrics
 */
export function logScraperMetrics(
  source: SignalSource,
  metrics: {
    total: number;
    filtered: number;
    errors: number;
    duration: number;
  }
): void {
  logger.info(`Scraper metrics: ${source}`, {
    ...metrics,
    successRate: metrics.total > 0 ? ((metrics.total - metrics.errors) / metrics.total * 100).toFixed(1) + "%" : "N/A",
  });
}
