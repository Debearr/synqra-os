/**
 * ============================================================
 * INTELLIGENT CACHE - NØID LABS
 * ============================================================
 * Smart caching to avoid regenerating identical content
 * 
 * Apple/Tesla principle:
 * - Don't compute what you already know
 * - Learn from past requests
 * - Zero additional infrastructure (uses Supabase)
 * 
 * Cache Strategy:
 * 1. **Semantic matching** - Similar prompts = cache hit
 * 2. **Content fingerprinting** - Hash-based deduplication
 * 3. **Performance-based TTL** - Good results stay longer
 * 4. **Auto-eviction** - Remove low-performers
 */

import { getSupabaseClient } from "../db/supabase";
import { createHash } from "crypto";

// ============================================================
// TYPES
// ============================================================

export interface CacheEntry<T = any> {
  id?: string;
  key: string;
  fingerprint: string;
  value: T;
  hits: number;
  success_rate: number; // 0-100
  performance_score: number; // 0-100
  metadata?: Record<string, any>;
  created_at?: string;
  last_accessed?: string;
  expires_at?: string;
}

export interface CacheOptions {
  ttl?: number; // Time to live in seconds (default: 1 hour)
  namespace?: string; // Cache namespace (e.g., "content", "prompts")
  similarityThreshold?: number; // 0-1, for semantic matching (default: 0.9)
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number; // percentage
  totalEntries: number;
  avgPerformanceScore: number;
}

// ============================================================
// CACHE CLASS
// ============================================================

export class IntelligentCache {
  private namespace: string;
  private defaultTTL: number;
  private inMemoryCache: Map<string, CacheEntry> = new Map();
  private stats = { hits: 0, misses: 0 };

  constructor(namespace: string = "default", ttlSeconds: number = 3600) {
    this.namespace = namespace;
    this.defaultTTL = ttlSeconds;
  }

  /**
   * Get value from cache
   */
  async get<T = any>(key: string, options?: CacheOptions): Promise<T | null> {
    const fingerprint = this.createFingerprint(key);

    // Try in-memory first
    const memEntry = this.inMemoryCache.get(fingerprint);
    if (memEntry && !this.isExpired(memEntry)) {
      this.stats.hits++;
      await this.updateHitCount(fingerprint);
      return memEntry.value as T;
    }

    // Try database
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from("cache_entries")
        .select("*")
        .eq("namespace", this.namespace)
        .eq("fingerprint", fingerprint)
        .gte("expires_at", new Date().toISOString())
        .single();

      if (error || !data) {
        this.stats.misses++;
        return null;
      }

      // Update in-memory cache
      this.inMemoryCache.set(fingerprint, data);
      this.stats.hits++;

      // Update hit count in background
      this.updateHitCount(fingerprint);

      return data.value as T;
    } catch (error) {
      this.stats.misses++;
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set<T = any>(
    key: string,
    value: T,
    options?: CacheOptions & {
      performanceScore?: number;
      metadata?: Record<string, any>;
    }
  ): Promise<void> {
    const fingerprint = this.createFingerprint(key);
    const ttl = options?.ttl || this.defaultTTL;
    const expiresAt = new Date(Date.now() + ttl * 1000).toISOString();

    const entry: CacheEntry<T> = {
      key,
      fingerprint,
      value,
      hits: 0,
      success_rate: 100,
      performance_score: options?.performanceScore || 80,
      metadata: options?.metadata,
      created_at: new Date().toISOString(),
      last_accessed: new Date().toISOString(),
      expires_at: expiresAt,
    };

    // Store in memory
    this.inMemoryCache.set(fingerprint, entry);

    // Store in database (non-blocking)
    this.persistToDatabase(entry).catch((err) =>
      console.warn("Cache persistence failed:", err)
    );
  }

  /**
   * Find similar cached entries (semantic matching)
   */
  async findSimilar<T = any>(
    key: string,
    threshold: number = 0.9
  ): Promise<Array<{ entry: CacheEntry<T>; similarity: number }>> {
    try {
      const supabase = getSupabaseClient();
      
      // Get recent high-performing entries
      const { data, error } = await supabase
        .from("cache_entries")
        .select("*")
        .eq("namespace", this.namespace)
        .gte("expires_at", new Date().toISOString())
        .gte("performance_score", 70)
        .order("performance_score", { ascending: false })
        .limit(50);

      if (error || !data) return [];

      // Calculate similarity (simple word overlap for now)
      const keyWords = new Set(key.toLowerCase().split(/\s+/));
      const results = data
        .map((entry) => {
          const entryWords = new Set(entry.key.toLowerCase().split(/\s+/));
          const intersection = new Set([...keyWords].filter((w) => entryWords.has(w)));
          const union = new Set([...keyWords, ...entryWords]);
          const similarity = intersection.size / union.size;

          return { entry, similarity };
        })
        .filter((r) => r.similarity >= threshold)
        .sort((a, b) => b.similarity - a.similarity);

      return results;
    } catch (error) {
      console.warn("Similar entry search failed:", error);
      return [];
    }
  }

  /**
   * Update performance score based on user feedback
   */
  async updatePerformance(
    key: string,
    score: number,
    userSelected?: boolean
  ): Promise<void> {
    const fingerprint = this.createFingerprint(key);

    try {
      const supabase = getSupabaseClient();
      
      // Get current entry
      const { data: current } = await supabase
        .from("cache_entries")
        .select("performance_score, hits")
        .eq("fingerprint", fingerprint)
        .single();

      if (!current) return;

      // Calculate new performance score (weighted average)
      const newScore = Math.round(
        (current.performance_score * 0.7 + score * 0.3)
      );

      // Update
      await supabase
        .from("cache_entries")
        .update({
          performance_score: newScore,
          success_rate: userSelected ? 100 : current.hits > 0 ? 95 : 80,
        })
        .eq("fingerprint", fingerprint);

      // Update in-memory
      const memEntry = this.inMemoryCache.get(fingerprint);
      if (memEntry) {
        memEntry.performance_score = newScore;
      }
    } catch (error) {
      console.warn("Performance update failed:", error);
    }
  }

  /**
   * Clear expired entries
   */
  async clearExpired(): Promise<number> {
    try {
      const supabase = getSupabaseClient();
      const { count } = await supabase
        .from("cache_entries")
        .delete()
        .eq("namespace", this.namespace)
        .lt("expires_at", new Date().toISOString());

      // Clear in-memory
      for (const [key, entry] of this.inMemoryCache.entries()) {
        if (this.isExpired(entry)) {
          this.inMemoryCache.delete(key);
        }
      }

      return count || 0;
    } catch (error) {
      console.warn("Failed to clear expired entries:", error);
      return 0;
    }
  }

  /**
   * Clear low-performing entries
   */
  async clearLowPerformers(threshold: number = 50): Promise<number> {
    try {
      const supabase = getSupabaseClient();
      const { count } = await supabase
        .from("cache_entries")
        .delete()
        .eq("namespace", this.namespace)
        .lt("performance_score", threshold);

      return count || 0;
    } catch (error) {
      console.warn("Failed to clear low performers:", error);
      return 0;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from("cache_entries")
        .select("performance_score, hits")
        .eq("namespace", this.namespace);

      if (error || !data) {
        return {
          hits: this.stats.hits,
          misses: this.stats.misses,
          hitRate: this.calculateHitRate(),
          totalEntries: 0,
          avgPerformanceScore: 0,
        };
      }

      const totalHits = data.reduce((sum, e) => sum + e.hits, 0);
      const avgScore = data.reduce((sum, e) => sum + e.performance_score, 0) / data.length;

      return {
        hits: totalHits,
        misses: this.stats.misses,
        hitRate: this.calculateHitRate(),
        totalEntries: data.length,
        avgPerformanceScore: Math.round(avgScore),
      };
    } catch (error) {
      return {
        hits: this.stats.hits,
        misses: this.stats.misses,
        hitRate: this.calculateHitRate(),
        totalEntries: 0,
        avgPerformanceScore: 0,
      };
    }
  }

  // ============================================================
  // PRIVATE HELPERS
  // ============================================================

  private createFingerprint(key: string): string {
    // Normalize key (lowercase, trim, remove extra spaces)
    const normalized = key.toLowerCase().trim().replace(/\s+/g, " ");
    return createHash("sha256").update(normalized).digest("hex").substring(0, 16);
  }

  private isExpired(entry: CacheEntry): boolean {
    if (!entry.expires_at) return false;
    return new Date(entry.expires_at) < new Date();
  }

  private async updateHitCount(fingerprint: string): Promise<void> {
    try {
      const supabase = getSupabaseClient();
      await supabase.rpc("increment_cache_hits", { cache_fingerprint: fingerprint });
    } catch (error) {
      // Silent fail
    }
  }

  private async persistToDatabase(entry: CacheEntry): Promise<void> {
    const supabase = getSupabaseClient();
    await supabase.from("cache_entries").upsert({
      namespace: this.namespace,
      ...entry,
    });
  }

  private calculateHitRate(): number {
    const total = this.stats.hits + this.stats.misses;
    if (total === 0) return 0;
    return Math.round((this.stats.hits / total) * 100);
  }
}

// ============================================================
// CACHE MANAGER (Global Instance)
// ============================================================

class CacheManager {
  private caches: Map<string, IntelligentCache> = new Map();

  getCache(namespace: string, ttl?: number): IntelligentCache {
    if (!this.caches.has(namespace)) {
      this.caches.set(namespace, new IntelligentCache(namespace, ttl));
    }
    return this.caches.get(namespace)!;
  }

  async clearAll(): Promise<void> {
    for (const cache of this.caches.values()) {
      await cache.clearExpired();
    }
  }

  async getGlobalStats(): Promise<Record<string, CacheStats>> {
    const stats: Record<string, CacheStats> = {};
    for (const [namespace, cache] of this.caches.entries()) {
      stats[namespace] = await cache.getStats();
    }
    return stats;
  }
}

export const cacheManager = new CacheManager();

// ============================================================
// CONVENIENCE EXPORTS
// ============================================================

export const contentCache = cacheManager.getCache("content", 3600); // 1 hour
export const promptCache = cacheManager.getCache("prompts", 7200); // 2 hours
export const campaignCache = cacheManager.getCache("campaigns", 86400); // 24 hours

/**
 * Cache decorator for functions
 */
export function cached<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options?: CacheOptions & { keyExtractor?: (...args: Parameters<T>) => string }
): T {
  const cache = cacheManager.getCache(options?.namespace || "default", options?.ttl);

  return (async (...args: Parameters<T>) => {
    const key = options?.keyExtractor
      ? options.keyExtractor(...args)
      : JSON.stringify(args);

    // Try cache first
    const cached = await cache.get(key);
    if (cached !== null) {
      return cached;
    }

    // Execute function
    const result = await fn(...args);

    // Cache result
    await cache.set(key, result, options);

    return result;
  }) as T;
}
