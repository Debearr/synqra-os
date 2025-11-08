/**
 * Centralised configuration helpers for the Autonomous Sales Engine.
 *
 * All configuration values are resolved lazily from environment variables at runtime.
 * The helpers below intentionally avoid throwing on missing values so the engine
 * can degrade gracefully in non-production environments while still logging
 * actionable diagnostics for operators.
 */

type EnvValueOptions = {
  required?: boolean;
  fallback?: string;
};

const cache = new Map<string, string | undefined>();

const ENV_KEYS = {
  SUPABASE_URL: "SUPABASE_URL",
  SUPABASE_SERVICE_ROLE_KEY: "SUPABASE_SERVICE_ROLE_KEY",
  SUPABASE_ANON_KEY: "SUPABASE_ANON_KEY",
  TELEGRAM_BOT_TOKEN: "TELEGRAM_BOT_TOKEN",
  TELEGRAM_SALES_CHAT_ID: "TELEGRAM_SALES_CHAT_ID",
  STRIPE_API_KEY: "STRIPE_SECRET_KEY",
  STRIPE_PRICING_TABLE_ID: "STRIPE_PRICING_TABLE_ID",
  N8N_BASE_URL: "N8N_BASE_URL",
  N8N_AUTH_TOKEN: "N8N_AUTH_TOKEN",
  KIE_AI_API_KEY: "KIE_AI_API_KEY",
  DEEPSEEK_ROUTER_URL: "DEEPSEEK_ROUTER_URL",
  DEEPSEEK_ROUTER_TOKEN: "DEEPSEEK_ROUTER_TOKEN",
};

function readEnvValue(key: string, options: EnvValueOptions = {}): string | undefined {
  if (cache.has(key)) {
    return cache.get(key);
  }

  const value = process.env[key] ?? options.fallback;

  if (!value && options.required) {
    console.warn(`[sales-engine] Missing required environment variable: ${key}`);
  }

  cache.set(key, value);
  return value;
}

export function getSupabaseUrl() {
  return readEnvValue(ENV_KEYS.SUPABASE_URL, { required: true });
}

export function getSupabaseServiceKey() {
  return (
    readEnvValue(ENV_KEYS.SUPABASE_SERVICE_ROLE_KEY) ??
    readEnvValue(ENV_KEYS.SUPABASE_ANON_KEY, { required: true })
  );
}

export function getTelegramConfig() {
  return {
    token: readEnvValue(ENV_KEYS.TELEGRAM_BOT_TOKEN),
    salesChatId: readEnvValue(ENV_KEYS.TELEGRAM_SALES_CHAT_ID),
  };
}

export function getStripeConfig() {
  return {
    apiKey: readEnvValue(ENV_KEYS.STRIPE_API_KEY),
    pricingTableId: readEnvValue(ENV_KEYS.STRIPE_PRICING_TABLE_ID),
  };
}

export function getN8nConfig() {
  return {
    baseUrl: readEnvValue(ENV_KEYS.N8N_BASE_URL),
    authToken: readEnvValue(ENV_KEYS.N8N_AUTH_TOKEN),
  };
}

export function getKieAiKey() {
  return readEnvValue(ENV_KEYS.KIE_AI_API_KEY);
}

export function getDeepSeekConfig() {
  return {
    url: readEnvValue(ENV_KEYS.DEEPSEEK_ROUTER_URL),
    token: readEnvValue(ENV_KEYS.DEEPSEEK_ROUTER_TOKEN),
  };
}

export function resetConfigCache() {
  cache.clear();
}

export type SalesEngineConfigSnapshot = {
  supabaseUrl?: string;
  telegramToken?: string;
  telegramSalesChatId?: string;
  stripeApiKey?: string;
  stripePricingTableId?: string;
  n8nBaseUrl?: string;
  kieAiKey?: string;
  deepSeekUrl?: string;
};

export function snapshotConfig(): SalesEngineConfigSnapshot {
  return {
    supabaseUrl: getSupabaseUrl(),
    telegramToken: getTelegramConfig().token,
    telegramSalesChatId: getTelegramConfig().salesChatId,
    stripeApiKey: getStripeConfig().apiKey,
    stripePricingTableId: getStripeConfig().pricingTableId,
    n8nBaseUrl: getN8nConfig().baseUrl,
    kieAiKey: getKieAiKey(),
    deepSeekUrl: getDeepSeekConfig().url,
  };
}

export const SALES_ENGINE_VERSION = "1.0.0";
