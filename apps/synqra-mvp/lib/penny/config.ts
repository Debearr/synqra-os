import "server-only";

export type PennyRuntimeConfig = {
  enabled: boolean;
  telegramBotToken: string | null;
  telegramBotUsername: string | null;
  founderUserId: string | null;
  founderTelegramUserId: string | null;
  allowedTelegramChatIds: string[];
  founderToken: string | null;
  shutdownToken: string | null;
  marketDataProvider: PennyMarketDataProviderName | null;
  polygonApiKey: string | null;
  twelveDataApiKey: string | null;
};

export type PennyMarketDataProviderName = "polygon" | "twelve_data";
export const PENNY_PRIMARY_MARKET_DATA_PROVIDER: PennyMarketDataProviderName = "polygon";

let cachedConfig: PennyRuntimeConfig | null = null;

function normalizeString(value: string | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseBoolean(value: string | undefined, fallback = false): boolean {
  const normalized = normalizeString(value)?.toLowerCase();
  if (!normalized) return fallback;
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return fallback;
}

function parseCsvValues(value: string | undefined): string[] {
  const normalized = normalizeString(value);
  if (!normalized) return [];

  return normalized
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function parsePennyMarketDataProvider(
  value: string | undefined
): PennyMarketDataProviderName | null {
  const normalized = normalizeString(value)?.toLowerCase();
  if (!normalized) return null;
  if (normalized === "polygon") return "polygon";
  if (normalized === "twelve_data") return "twelve_data";
  throw new Error("PENNY_MARKET_DATA_PROVIDER must be 'polygon' or 'twelve_data'");
}

function buildConfig(): PennyRuntimeConfig {
  return {
    enabled: parseBoolean(process.env.PENNY_ENABLED, false),
    telegramBotToken: normalizeString(process.env.PENNY_TELEGRAM_BOT_TOKEN),
    telegramBotUsername: normalizeString(process.env.PENNY_TELEGRAM_BOT_USERNAME),
    founderUserId: normalizeString(process.env.PENNY_FOUNDER_USER_ID),
    founderTelegramUserId: normalizeString(process.env.PENNY_FOUNDER_TELEGRAM_USER_ID),
    allowedTelegramChatIds: parseCsvValues(process.env.PENNY_TELEGRAM_ALLOWED_CHAT_IDS),
    founderToken: normalizeString(process.env.PENNY_FOUNDER_TOKEN),
    shutdownToken: normalizeString(process.env.PENNY_SHUTDOWN_TOKEN),
    marketDataProvider: parsePennyMarketDataProvider(process.env.PENNY_MARKET_DATA_PROVIDER),
    polygonApiKey: normalizeString(process.env.POLYGON_API_KEY),
    twelveDataApiKey: normalizeString(process.env.TWELVE_DATA_API_KEY),
  };
}

export function getPennyRuntimeConfig(options?: { forceReload?: boolean }): PennyRuntimeConfig {
  if (!cachedConfig || options?.forceReload) {
    cachedConfig = buildConfig();
  }

  return cachedConfig;
}

export function isPennyEnabled(): boolean {
  return getPennyRuntimeConfig().enabled;
}

export function getPennyRuntimeConfigSummary() {
  const config = getPennyRuntimeConfig();

  return {
    enabled: config.enabled,
    founderOnly: true,
    privateByDefault: true,
    botConfigured: Boolean(config.telegramBotToken),
    botUsernameConfigured: Boolean(config.telegramBotUsername),
    founderUserIdConfigured: Boolean(config.founderUserId),
    founderTelegramUserIdConfigured: Boolean(config.founderTelegramUserId),
    allowedTelegramChatCount: config.allowedTelegramChatIds.length,
    founderTokenConfigured: Boolean(config.founderToken),
    shutdownTokenConfigured: Boolean(config.shutdownToken),
    marketDataProvider: config.marketDataProvider,
    primaryMarketDataCandidate: PENNY_PRIMARY_MARKET_DATA_PROVIDER,
    polygonApiKeyConfigured: Boolean(config.polygonApiKey),
    twelveDataApiKeyConfigured: Boolean(config.twelveDataApiKey),
  };
}
