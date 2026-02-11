/**
 * AuraFX Market Data Adapters
 * 
 * Provides unified interface for fetching market data from various providers
 * Currently supports: OANDA (demo environment)
 */

export {
  type OandaInstrument,
  type MarketTick,
  fetchCurrentPrice,
  fetchCandles,
  fetchAllPrices,
  isOandaAvailable,
} from "./oanda";

/**
 * NO_DATA constant for graceful fallback
 */
export const NO_DATA = null;
