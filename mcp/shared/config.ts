/**
 * ============================================================
 * SHARED CONFIGURATION - MCP FLEET
 * ============================================================
 * Environment and configuration management
 */

import { config as dotenvConfig } from 'dotenv';
import { EnvConfig, RetryConfig } from './types';

// Load environment variables
dotenvConfig();

/**
 * Validate and load environment configuration
 */
export function loadEnvConfig(requiredKeys: string[] = []): EnvConfig {
  const config: EnvConfig = {
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY || '',
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
    openaiApiKey: process.env.OPENAI_API_KEY,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    deepseekApiKey: process.env.DEEPSEEK_API_KEY,
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
    telegramChannelId: process.env.TELEGRAM_CHANNEL_ID,
  };
  
  // Validate required keys
  const missing: string[] = [];
  
  requiredKeys.forEach(key => {
    const envKey = key.toUpperCase().replace(/-/g, '_');
    if (!process.env[envKey]) {
      missing.push(key);
    }
  });
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      `Please ensure these are set in your .env file.`
    );
  }
  
  return config;
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
};

/**
 * Platform specifications
 */
export const PLATFORM_SPECS = {
  youtube: {
    thumbnail: {
      width: 1280,
      height: 720,
      aspectRatio: '16:9',
      maxFileSize: 2 * 1024 * 1024, // 2MB
      format: ['jpg', 'jpeg', 'png'],
    },
    video: {
      maxDuration: 12 * 60 * 60, // 12 hours
      maxFileSize: 256 * 1024 * 1024 * 1024, // 256GB
      formats: ['mp4', 'mov', 'avi', 'wmv', 'flv', 'webm'],
    },
  },
  instagram: {
    thumbnail: {
      width: 1080,
      height: 1080,
      aspectRatio: '1:1',
      maxFileSize: 8 * 1024 * 1024, // 8MB
      format: ['jpg', 'jpeg', 'png'],
    },
    video: {
      maxDuration: 60,
      maxFileSize: 4 * 1024 * 1024 * 1024, // 4GB
      formats: ['mp4', 'mov'],
    },
  },
  tiktok: {
    thumbnail: {
      width: 1080,
      height: 1920,
      aspectRatio: '9:16',
      maxFileSize: 10 * 1024 * 1024, // 10MB
      format: ['jpg', 'jpeg', 'png'],
    },
    video: {
      maxDuration: 10 * 60, // 10 minutes
      maxFileSize: 4 * 1024 * 1024 * 1024, // 4GB
      formats: ['mp4', 'mov'],
    },
  },
  facebook: {
    thumbnail: {
      width: 1200,
      height: 630,
      aspectRatio: '1.91:1',
      maxFileSize: 8 * 1024 * 1024, // 8MB
      format: ['jpg', 'jpeg', 'png'],
    },
    video: {
      maxDuration: 240 * 60, // 240 minutes
      maxFileSize: 10 * 1024 * 1024 * 1024, // 10GB
      formats: ['mp4', 'mov'],
    },
  },
  twitter: {
    thumbnail: {
      width: 1200,
      height: 675,
      aspectRatio: '16:9',
      maxFileSize: 5 * 1024 * 1024, // 5MB
      format: ['jpg', 'jpeg', 'png'],
    },
    video: {
      maxDuration: 2 * 60 + 20, // 2m20s
      maxFileSize: 512 * 1024 * 1024, // 512MB
      formats: ['mp4', 'mov'],
    },
  },
  linkedin: {
    thumbnail: {
      width: 1200,
      height: 627,
      aspectRatio: '1.91:1',
      maxFileSize: 5 * 1024 * 1024, // 5MB
      format: ['jpg', 'jpeg', 'png'],
    },
    video: {
      maxDuration: 10 * 60, // 10 minutes
      maxFileSize: 5 * 1024 * 1024 * 1024, // 5GB
      formats: ['mp4', 'mov', 'avi'],
    },
  },
};

/**
 * Brand DNA definitions
 */
export const BRAND_DNA = {
  'synqra': {
    name: 'Synqra',
    tone: 'confident and innovative',
    keywords: ['creative', 'premium', 'intelligent', 'automation'],
    colors: ['#D4AF37', '#0A0E27', '#E5E4E2'],
    avoidWords: ['cheap', 'basic', 'simple'],
  },
  'noid': {
    name: 'NØID',
    tone: 'direct and supportive',
    keywords: ['efficient', 'reliable', 'professional', 'driver'],
    colors: ['#10B981', '#1A1D2E', '#C0C0C0'],
    avoidWords: ['luxury', 'premium', 'exclusive'],
  },
  'aurafx': {
    name: 'AuraFX',
    tone: 'authoritative and measured',
    keywords: ['precise', 'analytical', 'disciplined', 'trading'],
    colors: ['#3B82F6', '#0A0E27', '#E5E4E2'],
    avoidWords: ['guaranteed', 'easy money', 'get rich'],
  },
  'de-bear': {
    name: 'De Bear',
    tone: 'confident with subtle edge',
    keywords: ['refined', 'premium', 'rebellious', 'disruptive'],
    colors: ['#D4AF37', '#0A0E27', '#E5E4E2'],
    avoidWords: ['traditional', 'boring', 'safe'],
  },
};

/**
 * Cost tracking
 */
export const COST_LIMITS = {
  monthly: 200,
  daily: 7,
  hourly: 0.5,
  perRequest: 0.05,
};
