/**
 * ============================================================
 * ZERO-COST WEB SCRAPERS - NØID LABS
 * ============================================================
 * Lean, efficient scrapers for free public data sources
 * 
 * No paid APIs required. All data is publicly available.
 * Brand-aligned: Premium signals only, no noise.
 */

import { logger } from "../dev/tools";

// ============================================================
// TYPES
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
  metadata?: Record<string, any>;
}

// ============================================================
// TWITTER/X SCRAPER (No API required)
// ============================================================

export class TwitterScraper {
  /**
   * Search Twitter without API using nitter.net (privacy-focused frontend)
   */
  static async search(query: string, limit: number = 20): Promise<ScrapedContent[]> {
    try {
      // Use nitter.net as a privacy-friendly Twitter frontend
      const url = `https://nitter.net/search?f=tweets&q=${encodeURIComponent(query)}`;
      
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; NOID-Bot/1.0; +https://noidlabs.com)",
        },
      });

      if (!response.ok) {
        logger.warn(`Twitter scrape failed: ${response.status}`);
        return [];
      }

      const html = await response.text();
      
      // Parse tweets from HTML (simple regex extraction)
      const tweets = this.parseNitterHTML(html, limit);
      
      return tweets;
    } catch (error) {
      logger.error("Twitter scraping error:", error);
      return [];
    }
  }

  private static parseNitterHTML(html: string, limit: number): ScrapedContent[] {
    const tweets: ScrapedContent[] = [];
    
    // Extract tweet content using regex (basic implementation)
    // In production, use a proper HTML parser like cheerio
    const tweetRegex = /<div class="tweet-content"[^>]*>([\s\S]*?)<\/div>/g;
    const matches = html.matchAll(tweetRegex);

    let count = 0;
    for (const match of matches) {
      if (count >= limit) break;
      
      const content = match[1]
        .replace(/<[^>]*>/g, "") // Strip HTML tags
        .trim();

      if (content.length > 20) {
        tweets.push({
          title: content.substring(0, 100),
          content,
          url: "", // Would extract from HTML
          timestamp: new Date().toISOString(),
        });
        count++;
      }
    }

    return tweets;
  }

  /**
   * Get profile tweets (for lead research)
   */
  static async getProfileTweets(username: string, limit: number = 10): Promise<ScrapedContent[]> {
    try {
      const url = `https://nitter.net/${username}`;
      
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; NOID-Bot/1.0)",
        },
      });

      if (!response.ok) return [];

      const html = await response.text();
      return this.parseNitterHTML(html, limit);
    } catch (error) {
      logger.error("Profile tweets scraping error:", error);
      return [];
    }
  }
}

// ============================================================
// LINKEDIN SCRAPER (Public profiles only)
// ============================================================

export class LinkedInScraper {
  /**
   * Search LinkedIn public profiles (no login required)
   */
  static async searchProfiles(query: string, limit: number = 10): Promise<ScrapedContent[]> {
    try {
      // Use Google to search LinkedIn profiles
      const googleQuery = `site:linkedin.com/in/ ${query}`;
      const url = `https://www.google.com/search?q=${encodeURIComponent(googleQuery)}`;
      
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; NOID-Bot/1.0)",
        },
      });

      if (!response.ok) return [];

      const html = await response.text();
      
      // Extract LinkedIn profile URLs
      const profileUrls = this.extractLinkedInUrls(html, limit);
      
      // Scrape basic info from each profile
      const profiles: ScrapedContent[] = [];
      for (const url of profileUrls) {
        const profile = await this.scrapePublicProfile(url);
        if (profile) profiles.push(profile);
      }

      return profiles;
    } catch (error) {
      logger.error("LinkedIn scraping error:", error);
      return [];
    }
  }

  private static extractLinkedInUrls(html: string, limit: number): string[] {
    const urls: string[] = [];
    const urlRegex = /https?:\/\/[a-z]{2,3}\.linkedin\.com\/in\/[a-zA-Z0-9_-]+/g;
    const matches = html.matchAll(urlRegex);

    for (const match of matches) {
      if (urls.length >= limit) break;
      const url = match[0];
      if (!urls.includes(url)) {
        urls.push(url);
      }
    }

    return urls;
  }

  private static async scrapePublicProfile(url: string): Promise<ScrapedContent | null> {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; NOID-Bot/1.0)",
        },
      });

      if (!response.ok) return null;

      const html = await response.text();
      
      // Extract basic info (name, title, company)
      // This is a simplified version - in production, use proper parsing
      const nameMatch = html.match(/<title>([^|]+)/);
      const name = nameMatch ? nameMatch[1].trim() : "Unknown";

      return {
        title: name,
        content: `LinkedIn profile: ${name}`,
        url,
        author: name,
        author_profile: url,
      };
    } catch (error) {
      return null;
    }
  }
}

// ============================================================
// REDDIT SCRAPER
// ============================================================

export class RedditScraper {
  /**
   * Search Reddit (JSON API, no auth required)
   */
  static async searchPosts(subreddit: string, query: string, limit: number = 25): Promise<ScrapedContent[]> {
    try {
      // Use Reddit's JSON API (no auth required for public data)
      const url = `https://www.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent(query)}&restrict_sr=1&limit=${limit}`;
      
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; NOID-Bot/1.0)",
        },
      });

      if (!response.ok) return [];

      const data = await response.json();
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
    } catch (error) {
      logger.error("Reddit scraping error:", error);
      return [];
    }
  }

  /**
   * Get top posts from subreddit
   */
  static async getTopPosts(subreddit: string, timeframe: "day" | "week" | "month" = "week", limit: number = 25): Promise<ScrapedContent[]> {
    try {
      const url = `https://www.reddit.com/r/${subreddit}/top.json?t=${timeframe}&limit=${limit}`;
      
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; NOID-Bot/1.0)",
        },
      });

      if (!response.ok) return [];

      const data = await response.json();
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
    } catch (error) {
      logger.error("Reddit scraping error:", error);
      return [];
    }
  }
}

// ============================================================
// HACKER NEWS SCRAPER
// ============================================================

export class HackerNewsScraper {
  /**
   * Get top stories from Hacker News (Algolia API)
   */
  static async getTopStories(limit: number = 30): Promise<ScrapedContent[]> {
    try {
      const url = `https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=${limit}`;
      
      const response = await fetch(url);
      if (!response.ok) return [];

      const data = await response.json();
      const stories: ScrapedContent[] = [];

      for (const hit of data.hits || []) {
        stories.push({
          title: hit.title,
          content: hit.story_text || hit.title,
          url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
          author: hit.author,
          timestamp: hit.created_at,
          likes: hit.points,
          comments: hit.num_comments,
        });
      }

      return stories;
    } catch (error) {
      logger.error("Hacker News scraping error:", error);
      return [];
    }
  }

  /**
   * Search Hacker News
   */
  static async search(query: string, limit: number = 30): Promise<ScrapedContent[]> {
    try {
      const url = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&hitsPerPage=${limit}`;
      
      const response = await fetch(url);
      if (!response.ok) return [];

      const data = await response.json();
      const stories: ScrapedContent[] = [];

      for (const hit of data.hits || []) {
        stories.push({
          title: hit.title,
          content: hit.story_text || hit.title,
          url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
          author: hit.author,
          timestamp: hit.created_at,
          likes: hit.points,
          comments: hit.num_comments,
        });
      }

      return stories;
    } catch (error) {
      logger.error("Hacker News scraping error:", error);
      return [];
    }
  }
}

// ============================================================
// PRODUCT HUNT SCRAPER
// ============================================================

export class ProductHuntScraper {
  /**
   * Get today's top products (public RSS feed)
   */
  static async getTodayProducts(): Promise<ScrapedContent[]> {
    try {
      // Product Hunt has a public RSS feed
      const url = "https://www.producthunt.com/feed";
      
      const response = await fetch(url);
      if (!response.ok) return [];

      const xml = await response.text();
      
      // Parse RSS (simple regex, in production use XML parser)
      const products = this.parseRSS(xml);
      
      return products;
    } catch (error) {
      logger.error("Product Hunt scraping error:", error);
      return [];
    }
  }

  private static parseRSS(xml: string): ScrapedContent[] {
    const products: ScrapedContent[] = [];
    
    // Extract items from RSS
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    const titleRegex = /<title><!\[CDATA\[(.*?)\]\]><\/title>/;
    const linkRegex = /<link>(.*?)<\/link>/;
    const descRegex = /<description><!\[CDATA\[(.*?)\]\]><\/description>/;

    const matches = xml.matchAll(itemRegex);

    for (const match of matches) {
      const item = match[1];
      
      const titleMatch = item.match(titleRegex);
      const linkMatch = item.match(linkRegex);
      const descMatch = item.match(descRegex);

      if (titleMatch && linkMatch) {
        products.push({
          title: titleMatch[1],
          content: descMatch ? descMatch[1].replace(/<[^>]*>/g, "") : titleMatch[1],
          url: linkMatch[1],
        });
      }
    }

    return products;
  }
}

// ============================================================
// GITHUB SCRAPER
// ============================================================

export class GitHubScraper {
  /**
   * Search GitHub repos (public API, no auth for basic search)
   */
  static async searchRepos(query: string, limit: number = 30): Promise<ScrapedContent[]> {
    try {
      const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=${limit}`;
      
      const response = await fetch(url, {
        headers: {
          "Accept": "application/vnd.github.v3+json",
          "User-Agent": "NOID-Bot/1.0",
        },
      });

      if (!response.ok) return [];

      const data = await response.json();
      const repos: ScrapedContent[] = [];

      for (const repo of data.items || []) {
        repos.push({
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
        });
      }

      return repos;
    } catch (error) {
      logger.error("GitHub scraping error:", error);
      return [];
    }
  }

  /**
   * Get trending repos
   */
  static async getTrending(language?: string, since: "daily" | "weekly" | "monthly" = "weekly"): Promise<ScrapedContent[]> {
    try {
      // Use GitHub trending scraper (no official API)
      const langParam = language ? `/${language}` : "";
      const url = `https://github-trending-api.now.sh/repositories${langParam}?since=${since}`;
      
      const response = await fetch(url);
      if (!response.ok) return [];

      const repos = await response.json();
      
      return repos.map((repo: any) => ({
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
      logger.error("GitHub trending scraping error:", error);
      return [];
    }
  }
}

// ============================================================
// GOOGLE TRENDS SCRAPER
// ============================================================

export class GoogleTrendsScraper {
  /**
   * Get trending searches (RSS feed)
   */
  static async getTrendingSearches(country: string = "US"): Promise<ScrapedContent[]> {
    try {
      const url = `https://trends.google.com/trending/rss?geo=${country}`;
      
      const response = await fetch(url);
      if (!response.ok) return [];

      const xml = await response.text();
      
      // Parse RSS
      const trends = this.parseRSS(xml);
      
      return trends;
    } catch (error) {
      logger.error("Google Trends scraping error:", error);
      return [];
    }
  }

  private static parseRSS(xml: string): ScrapedContent[] {
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
// AGGREGATED SCRAPER
// ============================================================

export class UnifiedScraper {
  /**
   * Search across all sources
   */
  static async searchAll(query: string): Promise<Map<string, ScrapedContent[]>> {
    const results = new Map<string, ScrapedContent[]>();

    const [twitter, reddit, hn, github] = await Promise.allSettled([
      TwitterScraper.search(query, 10),
      RedditScraper.searchPosts("marketing", query, 10),
      HackerNewsScraper.search(query, 10),
      GitHubScraper.searchRepos(query, 10),
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
  static async getDailyIntelligence(): Promise<{
    twitter: ScrapedContent[];
    reddit: ScrapedContent[];
    hackernews: ScrapedContent[];
    producthunt: ScrapedContent[];
    github: ScrapedContent[];
    trends: ScrapedContent[];
  }> {
    const [twitter, reddit, hn, ph, github, trends] = await Promise.allSettled([
      TwitterScraper.search("AI marketing OR social media automation", 20),
      RedditScraper.getTopPosts("marketing", "week", 20),
      HackerNewsScraper.getTopStories(30),
      ProductHuntScraper.getTodayProducts(),
      GitHubScraper.getTrending("typescript", "weekly"),
      GoogleTrendsScraper.getTrendingSearches("US"),
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
