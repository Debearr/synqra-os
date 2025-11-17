/**
 * ============================================================
 * ENVIRONMENT VARIABLES SCHEMA
 * ============================================================
 * Strongly-typed, validated environment configuration
 * Prevents runtime errors from missing or invalid env vars
 * 
 * RPRD DNA: Type-safe, clear errors, no surprises
 */

export type EnvironmentTier = "production" | "staging" | "development" | "pr";

export type EnvSchema = {
  // Supabase (supports multiple naming conventions)
  NEXT_PUBLIC_SUPABASE_URL: string;
  SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_KEY: string; // Primary
  SUPABASE_SERVICE_ROLE_KEY: string; // Legacy fallback
  
  // AI
  ANTHROPIC_API_KEY: string;
  
  // Railway
  RAILWAY_WEBHOOK_SECRET?: string;
  RAILWAY_API_TOKEN?: string;
  RAILWAY_PROJECT_ID?: string;
  RAILWAY_ENVIRONMENT?: EnvironmentTier;
  
  // App URLs (for health checks)
  SYNQRA_HEALTH_URL?: string;
  NOID_HEALTH_URL?: string;
  AURAFX_HEALTH_URL?: string;
  
  // Notifications (optional)
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CHAT_ID?: string;
  DISCORD_WEBHOOK_URL?: string;
  SLACK_WEBHOOK_URL?: string;
  
  // n8n (optional)
  N8N_WEBHOOK_URL?: string;
  N8N_API_KEY?: string;
  
  // Feature Flags
  ENABLE_AUTO_REPAIR?: string; // "true" | "false"
  ENABLE_HEALTH_WEBHOOKS?: string;
  ENABLE_MARKET_INTELLIGENCE?: string;
  
  // Node environment
  NODE_ENV: "production" | "development" | "test";
  PORT?: string;
};

/**
 * Required variables per environment tier
 */
const REQUIRED_VARS_BY_TIER: Record<EnvironmentTier, (keyof EnvSchema)[]> = {
  production: [
    "SUPABASE_URL",
    "SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_KEY",
    "ANTHROPIC_API_KEY",
    "NODE_ENV",
  ],
  
  staging: [
    "SUPABASE_URL",
    "SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_KEY",
    "NODE_ENV",
  ],
  
  development: [
    "SUPABASE_URL",
    "SUPABASE_ANON_KEY",
    "NODE_ENV",
  ],
  
  pr: [
    "SUPABASE_URL",
    "SUPABASE_ANON_KEY",
    "NODE_ENV",
  ],
};

/**
 * Validate environment variables
 */
export function validateEnv(
  tier: EnvironmentTier = "development"
): {
  valid: boolean;
  missing: string[];
  invalid: string[];
  warnings: string[];
} {
  const missing: string[] = [];
  const invalid: string[] = [];
  const warnings: string[] = [];
  
  const required = REQUIRED_VARS_BY_TIER[tier];
  
  // Check required variables
  for (const key of required) {
    const value = process.env[key];
    
    if (!value || value.trim() === "") {
      missing.push(key);
    }
  }
  
  // Validate specific formats
  
  // Supabase URL should be a valid URL
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl) {
    try {
      new URL(supabaseUrl);
    } catch {
      invalid.push("SUPABASE_URL (not a valid URL)");
    }
  }
  
  // API keys should not be placeholder values
  const placeholderPatterns = ["your-", "example", "placeholder", "xxx", "mock"];
  const apiKeyVars = ["ANTHROPIC_API_KEY", "SUPABASE_SERVICE_KEY"];
  
  for (const key of apiKeyVars) {
    const value = process.env[key];
    if (value && placeholderPatterns.some((pattern) => value.toLowerCase().includes(pattern))) {
      warnings.push(`${key} appears to be a placeholder value`);
    }
  }
  
  // Port should be a number
  if (process.env.PORT && isNaN(parseInt(process.env.PORT, 10))) {
    invalid.push("PORT (not a number)");
  }
  
  // Feature flags should be "true" or "false"
  const featureFlags = [
    "ENABLE_AUTO_REPAIR",
    "ENABLE_HEALTH_WEBHOOKS",
    "ENABLE_MARKET_INTELLIGENCE",
  ];
  
  for (const flag of featureFlags) {
    const value = process.env[flag];
    if (value && value !== "true" && value !== "false") {
      warnings.push(`${flag} should be "true" or "false", got "${value}"`);
    }
  }
  
  return {
    valid: missing.length === 0 && invalid.length === 0,
    missing,
    invalid,
    warnings,
  };
}

/**
 * Get typed environment variables
 */
export function getEnv(): EnvSchema {
  return {
    // Supabase (with fallbacks for both naming conventions)
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "",
    SUPABASE_URL: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "",
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE || "",
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || "",
    
    // AI
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || "",
    
    // Railway
    RAILWAY_WEBHOOK_SECRET: process.env.RAILWAY_WEBHOOK_SECRET,
    RAILWAY_API_TOKEN: process.env.RAILWAY_API_TOKEN,
    RAILWAY_PROJECT_ID: process.env.RAILWAY_PROJECT_ID,
    RAILWAY_ENVIRONMENT: (process.env.RAILWAY_ENVIRONMENT as EnvironmentTier) || "development",
    
    // Health URLs
    SYNQRA_HEALTH_URL: process.env.SYNQRA_HEALTH_URL,
    NOID_HEALTH_URL: process.env.NOID_HEALTH_URL,
    AURAFX_HEALTH_URL: process.env.AURAFX_HEALTH_URL,
    
    // Notifications
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
    TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID,
    DISCORD_WEBHOOK_URL: process.env.DISCORD_WEBHOOK_URL,
    SLACK_WEBHOOK_URL: process.env.SLACK_WEBHOOK_URL,
    
    // n8n
    N8N_WEBHOOK_URL: process.env.N8N_WEBHOOK_URL,
    N8N_API_KEY: process.env.N8N_API_KEY,
    
    // Feature Flags
    ENABLE_AUTO_REPAIR: process.env.ENABLE_AUTO_REPAIR,
    ENABLE_HEALTH_WEBHOOKS: process.env.ENABLE_HEALTH_WEBHOOKS,
    ENABLE_MARKET_INTELLIGENCE: process.env.ENABLE_MARKET_INTELLIGENCE,
    
    // Node
    NODE_ENV: (process.env.NODE_ENV as any) || "development",
    PORT: process.env.PORT,
  };
}

/**
 * Check if feature flag is enabled
 */
export function isFeatureEnabled(flag: keyof Pick<EnvSchema, "ENABLE_AUTO_REPAIR" | "ENABLE_HEALTH_WEBHOOKS" | "ENABLE_MARKET_INTELLIGENCE">): boolean {
  return process.env[flag] === "true";
}

/**
 * Get environment tier
 */
export function getEnvironmentTier(): EnvironmentTier {
  const railwayEnv = process.env.RAILWAY_ENVIRONMENT;
  if (railwayEnv === "production" || railwayEnv === "staging" || railwayEnv === "pr") {
    return railwayEnv;
  }
  
  return process.env.NODE_ENV === "production" ? "production" : "development";
}

/**
 * Validate and throw error if invalid (use at startup)
 */
export function validateEnvOrThrow(): void {
  const tier = getEnvironmentTier();
  const validation = validateEnv(tier);
  
  if (!validation.valid) {
    const errors = [
      ...validation.missing.map((key) => `Missing required env var: ${key}`),
      ...validation.invalid.map((key) => `Invalid env var: ${key}`),
    ];
    
    console.error("❌ Environment validation failed:");
    errors.forEach((error) => console.error(`  - ${error}`));
    
    if (validation.warnings.length > 0) {
      console.warn("\n⚠️  Environment warnings:");
      validation.warnings.forEach((warning) => console.warn(`  - ${warning}`));
    }
    
    throw new Error(
      `Environment validation failed. Missing or invalid variables: ${errors.join(", ")}`
    );
  }
  
  if (validation.warnings.length > 0) {
    console.warn("\n⚠️  Environment warnings:");
    validation.warnings.forEach((warning) => console.warn(`  - ${warning}`));
  }
  
  console.log(`✅ Environment validated for ${tier} tier`);
}
