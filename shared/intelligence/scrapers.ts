/**
 * ============================================================
 * ZERO-COST WEB SCRAPERS - NØID LABS
 * ============================================================
 * Lean, efficient scrapers for free public data sources
 *
 * All data is publicly available. No paid APIs required.
 * Brand-aligned: Premium signals only, no noise.
 */

import { logger } from "../dev/tools";
import type { ScrapedContent, ScraperOptions, SignalSource } from "./types";
import {
  fetchWithRateLimit,
  withRetry,
  stripHTMLTags,
  parseRSSFeed,
  validateURL,
  sanitizeString,
  logScraperMetrics,
  DEFAULT_SCRAPER_OPTIONS,
  ScraperError,
} from "./utils";

// ============================================================
// BASE SCRAPER
// ============================================================

/**
 * Base scraper class with common functionality
 */
abstract class BaseScraper {
  protected source: SignalSource;

  constructor(source: SignalSource) {
    this.source = source;
  }

  /**
   * Fetch content with error handling and retries
   */
  protected async fetchContent(url: string, options: ScraperOptions = {}): Promise<string> {
    const opts = { ...DEFAULT_SCRAPER_OPTIONS, ...options };

    return withRetry(
      async () => {
        const response = await fetchWithRateLimit(
          url,
          { timeout: opts.timeout },
          this.source
        );
        return response.text();
      },
      {
        retryCount: opts.retryCount,
        retryDelay: opts.retryDelay,
        source: this.source,
      }
    );
  }

  /**
   * Fetch JSON content
   */
  protected async fetchJSON<T = unknown>(url: string, options: ScraperOptions = {}): Promise<T> {
    const opts = { ...DEFAULT_SCRAPER_OPTIONS, ...options };

    return withRetry(
      async () => {
        const response = await fetchWithRateLimit(
          url,
          { timeout: opts.timeout },
          this.source
        );
        return response.json() as Promise<T>;
      },
      {
        retryCount: opts.retryCount,
        retryDelay: opts.retryDelay,
        source: this.source,
      }
    );
  }

  /**
   * Log metrics for this scraper
   */
  protected logMetrics(metrics: {
    total: number;
    filtered: number;
    errors: number;
    duration: number;
  }): void {
    logScraperMetrics(this.source, metrics);
  }
}

// ============================================================
// TWITTER/X SCRAPER
// ============================================================

interface NitterTweet {
  content: string;
  author?: string;
  url?: string;
  timestamp?: string;
}

export class TwitterScraper extends BaseScraper {
  constructor() {
    super("twitter");
  }

  /**
   * Search Twitter without API using nitter.net
   */
  async search(query: string, options: ScraperOptions = {}): Promise<ScrapedContent[]> {
    const startTime = Date.now();
    const limit = options.limit || DEFAULT_SCRAPER_OPTIONS.limit;
    const sanitizedQuery = sanitizeString(query);

    try {
      const url = `https://nitter.net/search?f=tweets&q=${encodeURIComponent(sanitizedQuery)}`;
      const html = await this.fetchContent(url, options);
      const tweets = this.parseNitterHTML(html, limit);

      this.logMetrics({
        total: tweets.length,
        filtered: 0,
        errors: 0,
        duration: Date.now() - startTime,
      });

      return tweets;
    } catch (error) {
      logger.error("Twitter search failed", { query, error });
      return [];
    }
  }

  /**
   * Get profile tweets (for lead research)
   */
  async getProfileTweets(username: string, options: ScraperOptions = {}): Promise<ScrapedContent[]> {
    const limit = options.limit || 10;
    const sanitizedUsername = sanitizeString(username);

    try {
      validateURL(`https://nitter.net/${sanitizedUsername}`);
      const url = `https://nitter.net/${sanitizedUsername}`;
      const html = await this.fetchContent(url, options);

      return this.parseNitterHTML(html, limit);
    } catch (error) {
      logger.error("Twitter profile fetch failed", { username, error });
      return [];
    }
  }

  /**
   * Parse Nitter HTML to extract tweets
   */
  private parseNitterHTML(html: string, limit: number): ScrapedContent[] {
    const tweets: ScrapedContent[] = [];
    const tweetRegex = /<div class="tweet-content"[^>]*>([\s\S]*?)<\/div>/g;
    const matches = html.matchAll(tweetRegex);

    for (const match of matches) {
      if (tweets.length >= limit) break;

      const rawContent = match[1];
      const content = stripHTMLTags(rawContent);

      if (content.length >= 20) {
        tweets.push({
          title: content.substring(0, 100),
          content,
          url: "",
          timestamp: new Date().toISOString(),
        });
      }
    }

    return tweets;
  }
}

// ============================================================
// LINKEDIN SCRAPER
// ============================================================

export class LinkedInScraper extends BaseScraper {
  constructor() {
    super("linkedin");
  }

  /**
   * Search LinkedIn public profiles using Google
   */
  async searchProfiles(query: string, options: ScraperOptions = {}): Promise<ScrapedContent[]> {
    const limit = options.limit || 10;
    const sanitizedQuery = sanitizeString(query);

    try {
      const googleQuery = `site:linkedin.com/in/ ${sanitizedQuery}`;
      const url = `https://www.google.com/search?q=${encodeURIComponent(googleQuery)}`;
      const html = await this.fetchContent(url, options);

      const profileUrls = this.extractLinkedInUrls(html, limit);
      const profiles: ScrapedContent[] = [];

      for (const profileUrl of profileUrls) {
        const profile = await this.scrapePublicProfile(profileUrl, options);
        if (profile) profiles.push(profile);
      }

      return profiles;
    } catch (error) {
      logger.error("LinkedIn search failed", { query, error });
      return [];
    }
  }

  /**
   * Extract LinkedIn profile URLs from Google results
   */
  private extractLinkedInUrls(html: string, limit: number): string[] {
    const urls = new Set<string>();
    const urlRegex = /https?:\/\/[a-z]{2,3}\.linkedin\.com\/in\/[a-zA-Z0-9_-]+/g;
    const matches = html.matchAll(urlRegex);

    for (const match of matches) {
      if (urls.size >= limit) break;
      urls.add(match[0]);
    }

    return Array.from(urls);
  }

  /**
   * Scrape basic info from public LinkedIn profile
   */
  private async scrapePublicProfile(
    url: string,
    options: ScraperOptions = {}
  ): Promise<ScrapedContent | null> {
    try {
      validateURL(url);
      const html = await this.fetchContent(url, options);

      const nameMatch = html.match(/<title>([^|]+)/);
      const name = nameMatch ? stripHTMLTags(nameMatch[1]) : "Unknown";

      return {
        title: name,
        content: `LinkedIn profile: ${name}`,
        url,
        author: name,
        author_profile: url,
      };
    } catch (error) {
      logger.debug("LinkedIn profile scrape failed", { url, error });
      return null;
    }
  }
}

// ============================================================
// REDDIT SCRAPER
// ============================================================

interface RedditPost {
  data: {
    title: string;
    selftext: string;
    permalink: string;
    author: string;
    created_utc: number;
    ups: number;
    num_comments: number;
  };
}

interface RedditResponse {
  data: {
    children: RedditPost[];
  };
}

export class RedditScraper extends BaseScraper {
  constructor() {
    super("reddit");
  }

  /**
   * Search Reddit using JSON API (no auth required)
   */
  async searchPosts(
    subreddit: string,
    query: string,
    options: ScraperOptions = {}
  ): Promise<ScrapedContent[]> {
    const limit = options.limit || 25;
    const sanitizedSubreddit = sanitizeString(subreddit);
    const sanitizedQuery = sanitizeString(query);

    try {
      const url = `https://www.reddit.com/r/${sanitizedSubreddit}/search.json?q=${encodeURIComponent(sanitizedQuery)}&restrict_sr=1&limit=${limit}`;
      const data = await this.fetchJSON<RedditResponse>(url, options);

      return this.parseRedditPosts(data);
    } catch (error) {
      logger.error("Reddit search failed", { subreddit, query, error });
      return [];
    }
  }

  /**
   * Get top posts from subreddit
   */
  async getTopPosts(
    subreddit: string,
    timeframe: "day" | "week" | "month" = "week",
    options: ScraperOptions = {}
  ): Promise<ScrapedContent[]> {
    const limit = options.limit || 25;
    const sanitizedSubreddit = sanitizeString(subreddit);

    try {
      const url = `https://www.reddit.com/r/${sanitizedSubreddit}/top.json?t=${timeframe}&limit=${limit}`;
      const data = await this.fetchJSON<RedditResponse>(url, options);

      return this.parseRedditPosts(data);
    } catch (error) {
      logger.error("Reddit top posts fetch failed", { subreddit, error });
      return [];
    }
  }

  /**
   * Parse Reddit API response to scraped content
   */
  private parseRedditPosts(data: RedditResponse): ScrapedContent[] {
    const posts: ScrapedContent[] = [];

    for (const child of data.data.children || []) {
      const post = child.data;
      posts.push({
        title: post.title,
        content: post.selftext || post.title,
        url: `https://reddit.com${post.permalink}`,
        author: post.author,
        timestamp: new Date(post.created_utc * 1000).toISOString(),
        likes: post.ups,
        comments: post.num_comments,
      });
    }

    return posts;
  }
}

// ============================================================
// HACKER NEWS SCRAPER
// ============================================================

interface HackerNewsHit {
  title: string;
  story_text?: string;
  url?: string;
  objectID: string;
  author: string;
  created_at: string;
  points: number;
  num_comments: number;
}

interface HackerNewsResponse {
  hits: HackerNewsHit[];
}

export class HackerNewsScraper extends BaseScraper {
  constructor() {
    super("hackernews");
  }

  /**
   * Get top stories from Hacker News using Algolia API
   */
  async getTopStories(options: ScraperOptions = {}): Promise<ScrapedContent[]> {
    const limit = options.limit || 30;

    try {
      const url = `https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=${limit}`;
      const data = await this.fetchJSON<HackerNewsResponse>(url, options);

      return this.parseHackerNewsHits(data.hits);
    } catch (error) {
      logger.error("Hacker News top stories fetch failed", { error });
      return [];
    }
  }

  /**
   * Search Hacker News
   */
  async search(query: string, options: ScraperOptions = {}): Promise<ScrapedContent[]> {
    const limit = options.limit || 30;
    const sanitizedQuery = sanitizeString(query);

    try {
      const url = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(sanitizedQuery)}&hitsPerPage=${limit}`;
      const data = await this.fetchJSON<HackerNewsResponse>(url, options);

      return this.parseHackerNewsHits(data.hits);
    } catch (error) {
      logger.error("Hacker News search failed", { query, error });
      return [];
    }
  }

  /**
   * Parse Hacker News API hits to scraped content
   */
  private parseHackerNewsHits(hits: HackerNewsHit[]): ScrapedContent[] {
    return hits.map((hit) => ({
      title: hit.title,
      content: hit.story_text || hit.title,
      url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
      author: hit.author,
      timestamp: hit.created_at,
      likes: hit.points,
      comments: hit.num_comments,
    }));
  }
}

// ============================================================
// PRODUCT HUNT SCRAPER
// ============================================================

export class ProductHuntScraper extends BaseScraper {
  constructor() {
    super("producthunt");
  }

  /**
   * Get today's top products from RSS feed
   */
  async getTodayProducts(options: ScraperOptions = {}): Promise<ScrapedContent[]> {
    try {
      const url = "https://www.producthunt.com/feed";
      const xml = await this.fetchContent(url, options);

      return parseRSSFeed(xml);
    } catch (error) {
      logger.error("Product Hunt feed fetch failed", { error });
      return [];
    }
  }
}

// ============================================================
// GITHUB SCRAPER
// ============================================================

interface GitHubRepo {
  full_name: string;
  description?: string;
  html_url: string;
  owner: {
    login: string;
    html_url: string;
  };
  stargazers_count: number;
  language?: string;
  forks_count: number;
  open_issues_count: number;
}

interface GitHubSearchResponse {
  items: GitHubRepo[];
}

interface GitHubTrendingRepo {
  name: string;
  description?: string;
  url: string;
  author: string;
  stars: number;
  language?: string;
  currentPeriodStars: number;
}

export class GitHubScraper extends BaseScraper {
  constructor() {
    super("github");
  }

  /**
   * Search GitHub repos using public API
   */
  async searchRepos(query: string, options: ScraperOptions = {}): Promise<ScrapedContent[]> {
    const limit = options.limit || 30;
    const sanitizedQuery = sanitizeString(query);

    try {
      const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(sanitizedQuery)}&sort=stars&order=desc&per_page=${limit}`;
      const data = await this.fetchJSON<GitHubSearchResponse>(url, options);

      return this.parseGitHubRepos(data.items);
    } catch (error) {
      logger.error("GitHub search failed", { query, error });
      return [];
    }
  }

  /**
   * Get trending repos
   */
  async getTrending(
    language?: string,
    since: "daily" | "weekly" | "monthly" = "weekly",
    options: ScraperOptions = {}
  ): Promise<ScrapedContent[]> {
    try {
      const langParam = language ? `/${sanitizeString(language)}` : "";
      const url = `https://github-trending-api.now.sh/repositories${langParam}?since=${since}`;
      const repos = await this.fetchJSON<GitHubTrendingRepo[]>(url, options);

      return repos.map((repo) => ({
        title: repo.name,
        content: repo.description || repo.name,
        url: repo.url,
        author: repo.author,
        likes: repo.stars,
        metadata: {
          language: repo.language,
          currentPeriodStars: repo.currentPeriodStars,
        },
      }));
    } catch (error) {
      logger.error("GitHub trending fetch failed", { language, since, error });
      return [];
    }
  }

  /**
   * Parse GitHub repos to scraped content
   */
  private parseGitHubRepos(repos: GitHubRepo[]): ScrapedContent[] {
    return repos.map((repo) => ({
      title: repo.full_name,
      content: repo.description || repo.full_name,
      url: repo.html_url,
      author: repo.owner.login,
      author_profile: repo.owner.html_url,
      likes: repo.stargazers_count,
      metadata: {
        language: repo.language,
        forks: repo.forks_count,
        issues: repo.open_issues_count,
      },
    }));
  }
}

// ============================================================
// GOOGLE TRENDS SCRAPER
// ============================================================

export class GoogleTrendsScraper extends BaseScraper {
  constructor() {
    super("google_trends");
  }

  /**
   * Get trending searches from RSS feed
   */
  async getTrendingSearches(country: string = "US", options: ScraperOptions = {}): Promise<ScrapedContent[]> {
    try {
      const sanitizedCountry = sanitizeString(country).toUpperCase();
      const url = `https://trends.google.com/trending/rss?geo=${sanitizedCountry}`;
      const xml = await this.fetchContent(url, options);

      return this.parseGoogleTrendsRSS(xml);
    } catch (error) {
      logger.error("Google Trends fetch failed", { country, error });
      return [];
    }
  }

  /**
   * Parse Google Trends RSS feed
   */
  private parseGoogleTrendsRSS(xml: string): ScrapedContent[] {
    const trends: ScrapedContent[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    const titleRegex = /<title>(.*?)<\/title>/;
    const linkRegex = /<link>(.*?)<\/link>/;
    const trafficRegex = /<ht:approx_traffic>(.*?)<\/ht:approx_traffic>/;

    const matches = xml.matchAll(itemRegex);

    for (const match of matches) {
      const item = match[1];

      const titleMatch = item.match(titleRegex);
      const linkMatch = item.match(linkRegex);
      const trafficMatch = item.match(trafficRegex);

      if (titleMatch && linkMatch) {
        trends.push({
          title: titleMatch[1],
          content: titleMatch[1],
          url: linkMatch[1],
          views: trafficMatch ? parseInt(trafficMatch[1].replace(/[^0-9]/g, "")) : 0,
        });
      }
    }

    return trends;
  }
}

// ============================================================
// UNIFIED SCRAPER
// ============================================================

export class UnifiedScraper {
  private readonly twitter: TwitterScraper;
  private readonly reddit: RedditScraper;
  private readonly hackerNews: HackerNewsScraper;
  private readonly github: GitHubScraper;
  private readonly productHunt: ProductHuntScraper;
  private readonly googleTrends: GoogleTrendsScraper;

  constructor() {
    this.twitter = new TwitterScraper();
    this.reddit = new RedditScraper();
    this.hackerNews = new HackerNewsScraper();
    this.github = new GitHubScraper();
    this.productHunt = new ProductHuntScraper();
    this.googleTrends = new GoogleTrendsScraper();
  }

  /**
   * Search across all sources in parallel
   */
  async searchAll(query: string, options: ScraperOptions = {}): Promise<Map<SignalSource, ScrapedContent[]>> {
    const results = new Map<SignalSource, ScrapedContent[]>();

    const [twitter, reddit, hn, github] = await Promise.allSettled([
      this.twitter.search(query, { ...options, limit: 10 }),
      this.reddit.searchPosts("marketing", query, { ...options, limit: 10 }),
      this.hackerNews.search(query, { ...options, limit: 10 }),
      this.github.searchRepos(query, { ...options, limit: 10 }),
    ]);

    if (twitter.status === "fulfilled") results.set("twitter", twitter.value);
    if (reddit.status === "fulfilled") results.set("reddit", reddit.value);
    if (hn.status === "fulfilled") results.set("hackernews", hn.value);
    if (github.status === "fulfilled") results.set("github", github.value);

    return results;
  }

  /**
   * Get daily intelligence from all sources
   */
  async getDailyIntelligence(options: ScraperOptions = {}): Promise<{
    twitter: ScrapedContent[];
    reddit: ScrapedContent[];
    hackernews: ScrapedContent[];
    producthunt: ScrapedContent[];
    github: ScrapedContent[];
    trends: ScrapedContent[];
  }> {
    const [twitter, reddit, hn, ph, github, trends] = await Promise.allSettled([
      this.twitter.search("AI marketing OR social media automation", { ...options, limit: 20 }),
      this.reddit.getTopPosts("marketing", "week", { ...options, limit: 20 }),
      this.hackerNews.getTopStories({ ...options, limit: 30 }),
      this.productHunt.getTodayProducts(options),
      this.github.getTrending("typescript", "weekly", options),
      this.googleTrends.getTrendingSearches("US", options),
    ]);

    return {
      twitter: twitter.status === "fulfilled" ? twitter.value : [],
      reddit: reddit.status === "fulfilled" ? reddit.value : [],
      hackernews: hn.status === "fulfilled" ? hn.value : [],
      producthunt: ph.status === "fulfilled" ? ph.value : [],
      github: github.status === "fulfilled" ? github.value : [],
      trends: trends.status === "fulfilled" ? trends.value : [],
    };
  }
}
