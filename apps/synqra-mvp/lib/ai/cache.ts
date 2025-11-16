/**
 * ============================================================
 * CACHING LAYER
 * ============================================================
 * Caches AI responses to avoid redundant API calls
 */

import { CachedResponse, ModelProvider } from './types';

/**
 * IN-MEMORY CACHE
 * In production, this would use Redis or Supabase
 */
const cache = new Map<string, CachedResponse>();

/**
 * DEFAULT TTL (Time To Live)
 * 24 hours for most responses
 */
const DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 hours in ms

/**
 * GET CACHED RESPONSE
 */
export async function getCachedResponse(
  key: string
): Promise<CachedResponse | null> {
  const cached = cache.get(key);
  
  if (!cached) {
    return null;
  }
  
  // Check if expired
  const ttl = cached.ttl || DEFAULT_TTL;
  const age = Date.now() - cached.timestamp;
  
  if (age > ttl) {
    // Expired - remove from cache
    cache.delete(key);
    return null;
  }
  
  console.log(`✅ Cache hit: ${key}`);
  return cached;
}

/**
 * SET CACHED RESPONSE
 */
export async function setCachedResponse(
  key: string,
  response: CachedResponse
): Promise<void> {
  cache.set(key, {
    ...response,
    timestamp: response.timestamp || Date.now(),
    ttl: response.ttl || DEFAULT_TTL,
  });
  
  console.log(`💾 Cached response: ${key}`);
}

/**
 * INVALIDATE CACHE
 */
export async function invalidateCache(key: string): Promise<void> {
  cache.delete(key);
  console.log(`🗑️  Invalidated cache: ${key}`);
}

/**
 * CLEAR CACHE
 */
export async function clearCache(): Promise<void> {
  cache.clear();
  console.log(`🗑️  Cleared all cache`);
}

/**
 * GET CACHE STATS
 */
export function getCacheStats(): {
  size: number;
  keys: string[];
  oldestEntry: number;
  newestEntry: number;
} {
  const entries = Array.from(cache.entries());
  const timestamps = entries.map(([_, v]) => v.timestamp);
  
  return {
    size: cache.size,
    keys: entries.map(([k]) => k),
    oldestEntry: timestamps.length > 0 ? Math.min(...timestamps) : 0,
    newestEntry: timestamps.length > 0 ? Math.max(...timestamps) : 0,
  };
}

/**
 * CACHE WARMING
 * Pre-populate cache with common responses
 */
export async function warmCache(entries: Array<{ key: string; response: CachedResponse }>): Promise<void> {
  for (const entry of entries) {
    await setCachedResponse(entry.key, entry.response);
  }
  console.log(`🔥 Warmed cache with ${entries.length} entries`);
}

/**
 * CACHE CLEANUP
 * Remove expired entries
 */
export async function cleanupCache(): Promise<number> {
  const now = Date.now();
  let removed = 0;
  
  for (const [key, response] of cache.entries()) {
    const ttl = response.ttl || DEFAULT_TTL;
    const age = now - response.timestamp;
    
    if (age > ttl) {
      cache.delete(key);
      removed++;
    }
  }
  
  if (removed > 0) {
    console.log(`🧹 Cleaned up ${removed} expired cache entries`);
  }
  
  return removed;
}

/**
 * SCHEDULE CLEANUP
 * Run cleanup every hour
 */
let cleanupInterval: NodeJS.Timeout | null = null;

export function startCacheCleanup(): void {
  if (cleanupInterval) return;
  
  cleanupInterval = setInterval(() => {
    cleanupCache();
  }, 60 * 60 * 1000); // Every hour
  
  console.log('🕐 Started cache cleanup scheduler');
}

export function stopCacheCleanup(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
    console.log('⏸️  Stopped cache cleanup scheduler');
  }
}

/**
 * CACHE KEY HELPERS
 */
export function generateCacheKey(parts: string[]): string {
  return parts.join(':');
}

export function parseCacheKey(key: string): string[] {
  return key.split(':');
}
