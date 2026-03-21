import "server-only";

import { Candle, Timeframe } from "@/lib/aura-fx/types";
import {
  getPennyRuntimeConfig,
  PENNY_PRIMARY_MARKET_DATA_PROVIDER,
  type PennyMarketDataProviderName,
} from "./config";

export type PennyMarketDataFetchRequest = {
  ownerId: string;
  pair: string;
  timeframe: Timeframe | string;
  limit: number;
};

export interface PennyMarketDataProvider {
  readonly name: PennyMarketDataProviderName;
  fetchCandles(request: PennyMarketDataFetchRequest): Promise<Candle[]>;
}

export type PennyMarketDataIngestPayload = {
  ownerId: string;
  pair: string;
  timeframe: Timeframe | string;
  candles: Candle[];
  source: string;
  enqueueSignalRun: true;
};

class PendingVerifiedMarketDataProvider implements PennyMarketDataProvider {
  readonly name: PennyMarketDataProviderName;

  constructor(name: PennyMarketDataProviderName) {
    this.name = name;
  }

  async fetchCandles(_request: PennyMarketDataFetchRequest): Promise<Candle[]> {
    throw new Error(
      `Penny market data provider '${this.name}' is configured but live fetching is not enabled yet. Account coverage and API key setup must be verified before wiring a live fetch loop.`
    );
  }
}

export function getPennyMarketDataProvider(): PennyMarketDataProvider {
  const config = getPennyRuntimeConfig();

  // Fail closed: Penny does not silently pick a provider.
  if (!config.marketDataProvider) {
    throw new Error("No Penny market data provider is configured");
  }

  // Keep provider choice singular to avoid stack bloat in V1.
  // Polygon is the primary candidate; Twelve Data stays as fallback stub only.
  if (config.marketDataProvider === PENNY_PRIMARY_MARKET_DATA_PROVIDER) {
    if (!config.polygonApiKey) {
      throw new Error("POLYGON_API_KEY is required when PENNY_MARKET_DATA_PROVIDER=polygon");
    }
    return new PendingVerifiedMarketDataProvider("polygon");
  }

  if (!config.twelveDataApiKey) {
    throw new Error("TWELVE_DATA_API_KEY is required when PENNY_MARKET_DATA_PROVIDER=twelve_data");
  }

  return new PendingVerifiedMarketDataProvider("twelve_data");
}

export function buildPennyMarketDataIngestPayload(input: {
  ownerId: string;
  pair: string;
  timeframe: Timeframe | string;
  candles: Candle[];
  source?: string;
}): PennyMarketDataIngestPayload {
  return {
    ownerId: input.ownerId,
    pair: input.pair,
    timeframe: input.timeframe,
    candles: input.candles,
    source: input.source?.trim() || "market_data_provider",
    enqueueSignalRun: true,
  };
}

// Polygon is the primary Penny market-data candidate.
// Twelve Data is kept as an optional fallback stub only.
// Binance is intentionally not used for Penny AuraFX V1.
// Penny keeps one configured provider at a time to avoid multi-provider drift.
// This stub exists so the current ingest route can stay stable while live provider wiring waits for verified account-level symbol coverage.
