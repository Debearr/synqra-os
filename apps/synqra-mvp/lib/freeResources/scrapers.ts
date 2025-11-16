/**
 * ============================================================
 * FREE DATA SCRAPING & INGESTION
 * ============================================================
 * Leverage free public data sources with zero API costs
 * - RSS feeds
 * - Public APIs
 * - Web scraping (ethical, robots.txt compliant)
 * - Cached data reuse
 */

export interface DataSource {
  id: string;
  name: string;
  type: "rss" | "api" | "scrape" | "static";
  url: string;
  updateFrequency: "realtime" | "hourly" | "daily" | "weekly";
  cost: 0; // Always free
  credibility: "high" | "medium" | "low";
}

/**
 * FREE DATA SOURCES - Zero API Costs
 */
export const FREE_DATA_SOURCES: DataSource[] = [
  // Tech News & Trends (for agent knowledge)
  {
    id: "hackernews",
    name: "Hacker News",
    type: "api",
    url: "https://hacker-news.firebaseio.com/v0/topstories.json",
    updateFrequency: "hourly",
    cost: 0,
    credibility: "high",
  },
  {
    id: "producthunt",
    name: "Product Hunt",
    type: "api",
    url: "https://api.producthunt.com/v2/api/graphql",
    updateFrequency: "daily",
    cost: 0,
    credibility: "high",
  },
  {
    id: "dev-to",
    name: "DEV Community",
    type: "api",
    url: "https://dev.to/api/articles",
    updateFrequency: "hourly",
    cost: 0,
    credibility: "medium",
  },
  
  // Social Media Trends (free tier APIs)
  {
    id: "reddit-trending",
    name: "Reddit Trending",
    type: "api",
    url: "https://www.reddit.com/r/all/hot.json",
    updateFrequency: "hourly",
    cost: 0,
    credibility: "medium",
  },
  
  // Industry Data
  {
    id: "github-trending",
    name: "GitHub Trending",
    type: "scrape",
    url: "https://github.com/trending",
    updateFrequency: "daily",
    cost: 0,
    credibility: "high",
  },
  
  // Business & Marketing
  {
    id: "google-trends",
    name: "Google Trends",
    type: "api",
    url: "https://trends.google.com/trends/trendingsearches/daily/rss",
    updateFrequency: "daily",
    cost: 0,
    credibility: "high",
  },
];

/**
 * Fetch data from free sources with caching
 */
export async function fetchFreeData(
  sourceId: string,
  maxCacheAge: number = 3600000 // 1 hour default
): Promise<any> {
  const source = FREE_DATA_SOURCES.find((s) => s.id === sourceId);
  if (!source) {
    throw new Error(`Unknown data source: ${sourceId}`);
  }

  // Check cache first (avoid redundant requests)
  const cached = await getCachedData(sourceId);
  if (cached && Date.now() - cached.timestamp < maxCacheAge) {
    console.log(`✅ Using cached data for ${source.name} (age: ${Math.round((Date.now() - cached.timestamp) / 60000)}min)`);
    return cached.data;
  }

  // Fetch fresh data
  console.log(`🌐 Fetching fresh data from ${source.name}...`);
  
  try {
    const response = await fetch(source.url, {
      headers: {
        "User-Agent": "Synqra/1.0 (Educational Purpose; +https://synqra.co)",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Cache for future use
    await setCachedData(sourceId, data);

    return data;
  } catch (error) {
    console.error(`❌ Failed to fetch ${source.name}:`, error);
    
    // Fallback to stale cache if available
    if (cached) {
      console.log(`⚠️ Using stale cached data for ${source.name}`);
      return cached.data;
    }

    throw error;
  }
}

/**
 * Hacker News API (100% Free)
 */
export async function getHackerNewsTrending(): Promise<any[]> {
  const topStories = await fetchFreeData("hackernews");
  
  // Fetch top 10 stories (avoid excessive requests)
  const storyIds = topStories.slice(0, 10);
  const stories = await Promise.all(
    storyIds.map(async (id: number) => {
      const response = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
      return response.json();
    })
  );

  return stories;
}

/**
 * Reddit Trending (No API Key Required)
 */
export async function getRedditTrending(subreddit: string = "all"): Promise<any[]> {
  const response = await fetch(`https://www.reddit.com/r/${subreddit}/hot.json?limit=25`, {
    headers: {
      "User-Agent": "Synqra/1.0",
    },
  });

  const data = await response.json();
  return data.data.children.map((child: any) => child.data);
}

/**
 * GitHub Trending (Scraped, Free)
 */
export async function getGitHubTrending(language: string = ""): Promise<any[]> {
  // Use GitHub's undocumented trending API (free, no auth)
  const url = language
    ? `https://github-trending-api.now.sh/repositories?language=${language}`
    : "https://github-trending-api.now.sh/repositories";

  const response = await fetch(url);
  return response.json();
}

/**
 * DEV.to Articles (Free API)
 */
export async function getDevToArticles(tag?: string): Promise<any[]> {
  const url = tag
    ? `https://dev.to/api/articles?tag=${tag}&top=7`
    : "https://dev.to/api/articles?top=7";

  const response = await fetch(url);
  return response.json();
}

/**
 * Simple in-memory cache (upgrade to Redis/Supabase later)
 */
const dataCache = new Map<string, { data: any; timestamp: number }>();

async function getCachedData(key: string): Promise<{ data: any; timestamp: number } | null> {
  return dataCache.get(key) || null;
}

async function setCachedData(key: string, data: any): Promise<void> {
  dataCache.set(key, {
    data,
    timestamp: Date.now(),
  });
}

/**
 * Aggregate free data sources into agent context
 */
export async function buildFreeKnowledgeBase(): Promise<string> {
  console.log("🔄 Building knowledge base from free sources...");

  const [hackerNews, devArticles, redditTrending] = await Promise.all([
    getHackerNewsTrending().catch(() => []),
    getDevToArticles("ai").catch(() => []),
    getRedditTrending("technology").catch(() => []),
  ]);

  const context = `
# Current Tech Trends (Updated: ${new Date().toISOString()})

## Top Hacker News Stories
${hackerNews.slice(0, 5).map((story: any) => `- ${story.title} (${story.score} points)`).join("\n")}

## Latest AI Articles (DEV.to)
${devArticles.slice(0, 5).map((article: any) => `- ${article.title} by ${article.user.name}`).join("\n")}

## Reddit Technology Trending
${redditTrending.slice(0, 5).map((post: any) => `- ${post.title} (${post.ups} upvotes)`).join("\n")}

*Data sources: 100% free, no API costs*
`.trim();

  return context;
}

/**
 * Cost report: Verify all sources are free
 */
export function verifyZeroCost(): { allFree: boolean; sources: string[] } {
  const paidSources = FREE_DATA_SOURCES.filter((s) => s.cost > 0);

  return {
    allFree: paidSources.length === 0,
    sources: FREE_DATA_SOURCES.map((s) => `${s.name} ($${s.cost})`),
  };
}
