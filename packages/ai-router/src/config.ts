/**
 * ============================================================
 * AI ROUTER CONFIGURATION
 * ============================================================
 * Central configuration for AI routing system
 */

export const AI_ROUTER_CONFIG = {
  // Cost targets
  costTarget: {
    perInference: 0.01, // $0.01 per inference
    daily: 100, // $100 per day max
    monthly: 3000, // $3000 per month max
  },
  
  // Model split (80% local / 20% external)
  targetSplit: {
    local: 0.80,
    external: 0.20,
  },
  
  // Complexity thresholds
  complexity: {
    simpleMaxTokens: 100,
    mediumMaxTokens: 500,
  },
  
  // Routing thresholds
  routing: {
    confidenceThreshold: 0.7, // Min confidence to use local
    brandAlignmentThreshold: 0.7, // Min brand similarity
    safetyThreshold: 0.3, // Max toxicity score
    hallucinationThreshold: 0.6, // Min consistency for truth
  },
  
  // Caching
  cache: {
    inMemoryTTL: 300000, // 5 minutes
    redisTTL: 3600, // 1 hour
    databaseTTL: 86400, // 24 hours
    maxInMemorySize: 1000, // Max entries
  },
  
  // Model health
  health: {
    disableThreshold: 0.3, // Disable model if health < 30%
    recoveryDelay: 300000, // 5 minutes before retry
    healthDecayFactor: 0.5, // How fast health degrades on failure
    healthRecoveryFactor: 0.9, // How fast health recovers on success
  },
  
  // Timeouts (milliseconds)
  timeouts: {
    deepseek: 10000, // 10 seconds
    claude: 30000, // 30 seconds
    gpt4: 30000, // 30 seconds
    openclip: 5000, // 5 seconds
    toxicBert: 5000, // 5 seconds
  },
  
  // Model pricing (per 1K tokens)
  pricing: {
    deepseek: { input: 0, output: 0 }, // Free (local)
    claude: { input: 0.003, output: 0.015 },
    gpt4: { input: 0.01, output: 0.03 },
    openclip: { input: 0, output: 0 }, // Free (local)
    toxicBert: { input: 0, output: 0 }, // Free (local)
  },
  
  // Hugging Face models
  models: {
    deepseek: 'deepseek-ai/deepseek-coder-6.7b-instruct',
    sentenceTransformers: 'sentence-transformers/all-MiniLM-L6-v2',
    openclip: 'laion/CLIP-ViT-B-32-laion2B-s34B-b79K',
    toxicBert: 'unitary/toxic-bert',
  },
  
  // Feature flags
  features: {
    enableLocalModels: true,
    enableExternalAPIs: true,
    enableCaching: true,
    enableBrandAlignment: true,
    enableSafetyChecks: true,
    enableHallucinationDetection: false, // Expensive, enable for critical tasks only
    enableSelfHealing: true,
  },
  
  // Logging
  logging: {
    logAllInferences: true,
    logCosts: true,
    logErrors: true,
    logPerformance: true,
  },
} as const;

export type AIRouterConfig = typeof AI_ROUTER_CONFIG;
