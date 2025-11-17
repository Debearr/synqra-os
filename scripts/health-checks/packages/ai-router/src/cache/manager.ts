/**
 * ============================================================
 * CACHE MANAGER
 * ============================================================
 * Multi-layer caching: Memory → Redis → Database
 */

import type { CachedResult } from '../types';
import { AI_ROUTER_CONFIG } from '../config';
import { createHash } from 'crypto';

export class CacheManager {
  private memoryCache: Map<string, CachedResult> = new Map();
  private hitStats = {
    memory: 0,
    redis: 0,
    database: 0,
    miss: 0,
  };
  
  /**
   * Generate cache key from input
   */
  private generateKey(input: string, context?: Record<string, any>): string {
    const data = JSON.stringify({ input, context });
    return createHash('sha256').update(data).digest('hex');
  }
  
  /**
   * Check if cached result is still valid
   */
  private isValid(result: CachedResult): boolean {
    return Date.now() < result.expiresAt;
  }
  
  /**
   * Get from memory cache (Layer 1)
   */
  private getFromMemory(key: string): string | null {
    const result = this.memoryCache.get(key);
    
    if (!result) return null;
    
    if (!this.isValid(result)) {
      this.memoryCache.delete(key);
      return null;
    }
    
    this.hitStats.memory++;
    return result.value;
  }
  
  /**
   * Store in memory cache (Layer 1)
   */
  private setInMemory(key: string, value: string, ttlMs: number): void {
    // Enforce max size
    if (this.memoryCache.size >= AI_ROUTER_CONFIG.cache.maxInMemorySize) {
      // Remove oldest entry
      const firstKey = this.memoryCache.keys().next().value;
      if (firstKey) {
        this.memoryCache.delete(firstKey);
      }
    }
    
    this.memoryCache.set(key, {
      value,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttlMs,
    });
  }
  
  /**
   * Get from Redis cache (Layer 2) - Optional
   */
  private async getFromRedis(key: string): Promise<string | null> {
    // TODO: Implement Redis client
    // For now, skip Redis layer
    return null;
  }
  
  /**
   * Store in Redis cache (Layer 2) - Optional
   */
  private async setInRedis(key: string, value: string, ttlSeconds: number): Promise<void> {
    // TODO: Implement Redis client
    // For now, skip Redis layer
  }
  
  /**
   * Get from database cache (Layer 3)
   */
  private async getFromDatabase(key: string): Promise<string | null> {
    try {
      // TODO: Implement Supabase query
      // const { data } = await supabase
      //   .from('ai_cache')
      //   .select('output, expires_at')
      //   .eq('input_hash', key)
      //   .single();
      
      // if (data && new Date(data.expires_at) > new Date()) {
      //   this.hitStats.database++;
      //   return data.output;
      // }
      
      return null;
    } catch (error) {
      console.error('Database cache error:', error);
      return null;
    }
  }
  
  /**
   * Store in database cache (Layer 3)
   */
  private async setInDatabase(key: string, value: string, expiresAt: Date): Promise<void> {
    try {
      // TODO: Implement Supabase insert
      // await supabase.from('ai_cache').upsert({
      //   input_hash: key,
      //   output: value,
      //   expires_at: expiresAt.toISOString(),
      //   created_at: new Date().toISOString(),
      // });
    } catch (error) {
      console.error('Database cache write error:', error);
    }
  }
  
  /**
   * Get cached result (checks all layers)
   */
  async get(input: string, context?: Record<string, any>): Promise<string | null> {
    if (!AI_ROUTER_CONFIG.features.enableCaching) {
      return null;
    }
    
    const key = this.generateKey(input, context);
    
    // Layer 1: Memory cache (fastest)
    const memoryResult = this.getFromMemory(key);
    if (memoryResult) {
      return memoryResult;
    }
    
    // Layer 2: Redis cache (fast)
    const redisResult = await this.getFromRedis(key);
    if (redisResult) {
      this.hitStats.redis++;
      // Promote to memory
      this.setInMemory(key, redisResult, AI_ROUTER_CONFIG.cache.inMemoryTTL);
      return redisResult;
    }
    
    // Layer 3: Database cache (persistent)
    const dbResult = await this.getFromDatabase(key);
    if (dbResult) {
      this.hitStats.database++;
      // Promote to memory and Redis
      this.setInMemory(key, dbResult, AI_ROUTER_CONFIG.cache.inMemoryTTL);
      await this.setInRedis(key, dbResult, AI_ROUTER_CONFIG.cache.redisTTL);
      return dbResult;
    }
    
    // Cache miss
    this.hitStats.miss++;
    return null;
  }
  
  /**
   * Store result in all cache layers
   */
  async set(input: string, value: string, context?: Record<string, any>): Promise<void> {
    if (!AI_ROUTER_CONFIG.features.enableCaching) {
      return;
    }
    
    const key = this.generateKey(input, context);
    const now = Date.now();
    
    // Layer 1: Memory (5 min TTL)
    this.setInMemory(key, value, AI_ROUTER_CONFIG.cache.inMemoryTTL);
    
    // Layer 2: Redis (1 hour TTL)
    await this.setInRedis(key, value, AI_ROUTER_CONFIG.cache.redisTTL);
    
    // Layer 3: Database (24 hour TTL)
    const expiresAt = new Date(now + AI_ROUTER_CONFIG.cache.databaseTTL * 1000);
    await this.setInDatabase(key, value, expiresAt);
  }
  
  /**
   * Clear all caches
   */
  async clear(): Promise<void> {
    this.memoryCache.clear();
    // TODO: Clear Redis
    // TODO: Clear database cache table
  }
  
  /**
   * Get cache statistics
   */
  getStats(): Record<string, any> {
    const total = this.hitStats.memory + this.hitStats.redis + this.hitStats.database + this.hitStats.miss;
    const hits = this.hitStats.memory + this.hitStats.redis + this.hitStats.database;
    
    return {
      totalRequests: total,
      cacheHits: hits,
      cacheMisses: this.hitStats.miss,
      hitRate: total > 0 ? (hits / total * 100).toFixed(2) + '%' : '0%',
      breakdown: {
        memory: this.hitStats.memory,
        redis: this.hitStats.redis,
        database: this.hitStats.database,
        miss: this.hitStats.miss,
      },
      memoryCacheSize: this.memoryCache.size,
      memoryCacheMaxSize: AI_ROUTER_CONFIG.cache.maxInMemorySize,
    };
  }
  
  /**
   * Reset statistics
   */
  resetStats(): void {
    this.hitStats = {
      memory: 0,
      redis: 0,
      database: 0,
      miss: 0,
    };
  }
}

// Singleton instance
export const cacheManager = new CacheManager();
