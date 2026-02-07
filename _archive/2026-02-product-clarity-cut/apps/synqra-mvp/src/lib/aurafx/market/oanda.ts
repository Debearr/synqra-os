/**
 * OANDA Market Data Adapter
 * 
 * Provides read-only access to OANDA FX market data (demo environment)
 * Normalizes OANDA pricing data into AuraFX internal formats
 * 
 * Production-safe features:
 * - Rate limiting (60-80 req/sec)
 * - TTL-based caching (prices: 5-15s, candles: 60-300s)
 * - Staleness guards (returns NO_DATA if data > 10s old)
 * 
 * TODO: Switch to production environment (api-fxtrade.oanda.com) when ready
 * TODO: Add authentication token from environment variables
 */

import type { Candle, Timeframe } from "@/lib/aura-fx/types";

/**
 * Supported OANDA instrument pairs
 */
export type OandaInstrument =
  | "EUR_USD"
  | "GBP_USD"
  | "USD_JPY"
  | "XAU_USD";

/**
 * MarketTick represents a single price point at a specific time
 */
export interface MarketTick {
  instrument: OandaInstrument;
  time: number; // unix ms
  bid: number;
  ask: number;
  mid: number; // (bid + ask) / 2
  spread: number; // ask - bid
  tradeable: boolean;
}

/**
 * OANDA API response types
 */
interface OandaPrice {
  instrument: string;
  time: string; // ISO 8601
  tradeable: boolean;
  bids: Array<{ price: string; liquidity: number }>;
  asks: Array<{ price: string; liquidity: number }>;
}

interface OandaPriceResponse {
  prices: OandaPrice[];
}

interface OandaCandle {
  time: string; // ISO 8601
  bid: {
    o: string; // open
    h: string; // high
    l: string; // low
    c: string; // close
  };
  ask: {
    o: string;
    h: string;
    l: string;
    c: string;
  };
  volume: number;
  complete: boolean;
}

interface OandaCandlesResponse {
  instrument: string;
  granularity: string;
  candles: OandaCandle[];
}

/**
 * OANDA granularity mapping to AuraFX timeframes
 */
const GRANULARITY_MAP: Record<Timeframe, string> = {
  M1: "M1",
  M5: "M5",
  M15: "M15",
  M30: "M30",
  H1: "H1",
  H4: "H4",
  D1: "D",
};

/**
 * OANDA API configuration
 */
const OANDA_DEMO_BASE_URL = "https://api-fxpractice.oanda.com";
// TODO: Switch to production: const OANDA_LIVE_BASE_URL = "https://api-fxtrade.oanda.com";

/**
 * Rate limiting configuration
 */
const MAX_REQUESTS_PER_SECOND = 70; // Safe ceiling between 60-80 req/sec
const RATE_LIMIT_WINDOW_MS = 1000; // 1 second window

/**
 * Cache TTL configuration (in milliseconds)
 */
const PRICE_CACHE_TTL_MS = 10 * 1000; // 10 seconds for prices
const CANDLE_CACHE_TTL_MS: Record<Timeframe, number> = {
  M1: 60 * 1000,   // 60 seconds for M1
  M5: 60 * 1000,   // 60 seconds for M5
  M15: 120 * 1000, // 120 seconds for M15
  M30: 180 * 1000, // 180 seconds for M30
  H1: 300 * 1000,  // 300 seconds for H1
  H4: 300 * 1000,  // 300 seconds for H4
  D1: 300 * 1000,  // 300 seconds for D1
};

/**
 * Staleness threshold (in milliseconds)
 */
const PRICE_STALENESS_THRESHOLD_MS = 10 * 1000; // 10 seconds

/**
 * Rate limiter: Token bucket implementation (lightweight, in-memory)
 */
class RateLimiter {
  private tokens: number = MAX_REQUESTS_PER_SECOND;
  private lastRefill: number = Date.now();

  async acquire(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRefill;

    // Refill tokens based on elapsed time
    if (elapsed >= RATE_LIMIT_WINDOW_MS) {
      this.tokens = MAX_REQUESTS_PER_SECOND;
      this.lastRefill = now;
    } else {
      // Refill proportionally
      const refillAmount = Math.floor((elapsed / RATE_LIMIT_WINDOW_MS) * MAX_REQUESTS_PER_SECOND);
      this.tokens = Math.min(MAX_REQUESTS_PER_SECOND, this.tokens + refillAmount);
      this.lastRefill = now;
    }

    // Wait if no tokens available
    if (this.tokens < 1) {
      const waitTime = RATE_LIMIT_WINDOW_MS - elapsed;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      return this.acquire(); // Retry after waiting
    }

    this.tokens--;
  }
}

/**
 * Cache entry with TTL
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

/**
 * In-memory cache with TTL support
 */
class TTLCache<T> {
  private cache = new Map<string, CacheEntry<T>>();

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const age = Date.now() - entry.timestamp;
    if (age >= entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set(key: string, data: T, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  clear(): void {
    this.cache.clear();
  }
}

// Global rate limiter instance
const rateLimiter = new RateLimiter();

// Global caches
const priceCache = new TTLCache<MarketTick>();
const candlesCache = new TTLCache<Candle[]>();

/**
 * Get OANDA API token from environment
 * TODO: Implement proper token management and environment switching
 */
function getOandaToken(): string {
  // TODO: Read from process.env.OANDA_API_TOKEN
  // For now, return empty string (will fail gracefully)
  return process.env.OANDA_API_TOKEN || "";
}

/**
 * Get OANDA account ID from environment
 * TODO: Implement proper account ID management
 */
function getOandaAccountId(): string {
  // TODO: Read from process.env.OANDA_ACCOUNT_ID
  // For now, return empty string (will fail gracefully)
  return process.env.OANDA_ACCOUNT_ID || "";
}

/**
 * Convert OANDA instrument format to API format
 * OANDA uses underscore format (EUR_USD) which matches our type
 */
function normalizeInstrument(instrument: OandaInstrument): string {
  return instrument; // Already in correct format
}

/**
 * Convert OANDA ISO timestamp to unix milliseconds
 */
function parseOandaTime(isoTime: string): number {
  return new Date(isoTime).getTime();
}

/**
 * Check if MarketTick is stale (older than threshold)
 */
function isPriceStale(tick: MarketTick): boolean {
  const age = Date.now() - tick.time;
  return age > PRICE_STALENESS_THRESHOLD_MS;
}

/**
 * Fetch current pricing for an instrument
 * 
 * @param instrument - OANDA instrument pair
 * @returns MarketTick or null if unavailable or stale
 */
export async function fetchCurrentPrice(
  instrument: OandaInstrument
): Promise<MarketTick | null> {
  try {
    // Check cache first
    const cacheKey = `price:${instrument}`;
    const cached = priceCache.get(cacheKey);
    if (cached) {
      // Check staleness before returning cached data
      if (!isPriceStale(cached)) {
        return cached;
      }
      // Cache hit but stale, remove from cache
      priceCache.clear();
    }

    // Rate limiting
    await rateLimiter.acquire();

    const token = getOandaToken();
    const accountId = getOandaAccountId();

    if (!token || !accountId) {
      console.warn(`[OANDA] Missing credentials for ${instrument}`);
      return null;
    }

    const url = `${OANDA_DEMO_BASE_URL}/v3/accounts/${accountId}/pricing?instruments=${normalizeInstrument(instrument)}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error(`[OANDA] Pricing request failed: ${response.status} ${response.statusText}`);
      return null;
    }

    const data: OandaPriceResponse = await response.json();

    if (!data.prices || data.prices.length === 0) {
      return null;
    }

    const price = data.prices[0];
    const bid = parseFloat(price.bids[0]?.price || "0");
    const ask = parseFloat(price.asks[0]?.price || "0");

    if (bid === 0 || ask === 0) {
      return null;
    }

    const tick: MarketTick = {
      instrument,
      time: parseOandaTime(price.time),
      bid,
      ask,
      mid: (bid + ask) / 2,
      spread: ask - bid,
      tradeable: price.tradeable,
    };

    // Staleness guard: return NO_DATA if data is too old
    if (isPriceStale(tick)) {
      console.warn(`[OANDA] Price data for ${instrument} is stale (${Date.now() - tick.time}ms old)`);
      return null; // NO_DATA fallback
    }

    // Cache the result
    priceCache.set(cacheKey, tick, PRICE_CACHE_TTL_MS);

    return tick;
  } catch (error) {
    console.error(`[OANDA] Error fetching price for ${instrument}:`, error);
    return null;
  }
}

/**
 * Fetch historical candles for an instrument
 * 
 * @param instrument - OANDA instrument pair
 * @param timeframe - AuraFX timeframe
 * @param count - Number of candles to fetch (max 5000)
 * @returns Array of normalized Candle objects
 */
export async function fetchCandles(
  instrument: OandaInstrument,
  timeframe: Timeframe,
  count: number = 100
): Promise<Candle[]> {
  try {
    // Check cache first
    const cacheKey = `candles:${instrument}:${timeframe}:${count}`;
    const cached = candlesCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Rate limiting
    await rateLimiter.acquire();

    const token = getOandaToken();

    if (!token) {
      console.warn(`[OANDA] Missing token for ${instrument}`);
      return [];
    }

    const granularity = GRANULARITY_MAP[timeframe];
    if (!granularity) {
      console.error(`[OANDA] Unsupported timeframe: ${timeframe}`);
      return [];
    }

    const url = `${OANDA_DEMO_BASE_URL}/v3/instruments/${normalizeInstrument(instrument)}/candles?granularity=${granularity}&count=${Math.min(count, 5000)}&price=BA`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error(`[OANDA] Candles request failed: ${response.status} ${response.statusText}`);
      return [];
    }

    const data: OandaCandlesResponse = await response.json();

    if (!data.candles || data.candles.length === 0) {
      return [];
    }

    // Normalize OANDA candles to AuraFX Candle format
    // Using mid prices (average of bid/ask) for OHLC
    const candles = data.candles
      .filter((candle) => candle.complete) // Only include complete candles
      .map((candle) => {
        const bidOpen = parseFloat(candle.bid.o);
        const bidHigh = parseFloat(candle.bid.h);
        const bidLow = parseFloat(candle.bid.l);
        const bidClose = parseFloat(candle.bid.c);

        const askOpen = parseFloat(candle.ask.o);
        const askHigh = parseFloat(candle.ask.h);
        const askLow = parseFloat(candle.ask.l);
        const askClose = parseFloat(candle.ask.c);

        // Use mid prices for OHLC
        const open = (bidOpen + askOpen) / 2;
        const high = (bidHigh + askHigh) / 2;
        const low = (bidLow + askLow) / 2;
        const close = (bidClose + askClose) / 2;

        return {
          time: parseOandaTime(candle.time),
          open,
          high,
          low,
          close,
          volume: candle.volume,
          timeframe,
        };
      });

    // Cache the result with timeframe-specific TTL
    const ttl = CANDLE_CACHE_TTL_MS[timeframe];
    candlesCache.set(cacheKey, candles, ttl);

    return candles;
  } catch (error) {
    console.error(`[OANDA] Error fetching candles for ${instrument}:`, error);
    return [];
  }
}

/**
 * Fetch current prices for all supported instruments (batched)
 * 
 * Uses batching to minimize API calls while respecting rate limits
 * 
 * @returns Map of instrument to MarketTick (or null if unavailable)
 */
export async function fetchAllPrices(): Promise<Map<OandaInstrument, MarketTick | null>> {
  const instruments: OandaInstrument[] = ["EUR_USD", "GBP_USD", "USD_JPY", "XAU_USD"];
  const results = new Map<OandaInstrument, MarketTick | null>();

  // Batch fetch: process in small batches to respect rate limits
  // Since we have 4 instruments and rate limit is 70/sec, we can fetch all in parallel
  // Rate limiter will handle throttling automatically
  const promises = instruments.map(async (instrument) => {
    const price = await fetchCurrentPrice(instrument);
    return { instrument, price };
  });

  const fetched = await Promise.all(promises);
  fetched.forEach(({ instrument, price }) => {
    results.set(instrument, price);
  });

  return results;
}

/**
 * Check if OANDA data is available (credentials configured)
 */
export function isOandaAvailable(): boolean {
  const token = getOandaToken();
  const accountId = getOandaAccountId();
  return !!(token && accountId);
}
