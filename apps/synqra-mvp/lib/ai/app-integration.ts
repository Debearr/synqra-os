/**
 * ============================================================
 * APP INTEGRATION WRAPPER
 * ============================================================
 * Unified interface for Synqra, NØID, AuraFX to use the AI system
 * Handles routing, guardrails, cost tracking, and brand consistency
 */

import { executeWithGuardrails, BrandProfile, SystemHealth, checkSystemHealth, UsageStats, getUsageStats } from './unified-router';
import { AITask } from './types';

// ============================================================
// APP-SPECIFIC INTERFACES
// ============================================================

export interface SynqraContentRequest {
  prompt: string;
  platform?: 'instagram' | 'youtube' | 'tiktok' | 'linkedin';
  style?: 'professional' | 'creative' | 'educational';
  length?: 'short' | 'medium' | 'long';
  maxBudget?: number;
}

export interface NoidDriverRequest {
  query: string;
  driverProfile?: {
    name: string;
    preferences: string[];
    history: string[];
  };
  priority?: 'high' | 'normal' | 'low';
}

export interface AuraFXAnalysisRequest {
  marketData: string;
  analysisType: 'technical' | 'fundamental' | 'sentiment';
  timeframe?: string;
  requiresChart?: boolean;
}

// ============================================================
// SYNQRA CONTENT GENERATION
// ============================================================

export async function generateSynqraContent(
  request: SynqraContentRequest
): Promise<{
  content: string;
  platform: string;
  quality: number;
  cost: number;
  metadata: any;
}> {
  console.log('📱 Synqra Content Generation');
  console.log(`   Platform: ${request.platform || 'general'}`);
  console.log(`   Style: ${request.style || 'creative'}`);
  
  // Build enhanced prompt
  const enhancedPrompt = buildSynqraPrompt(request);
  
  // Execute with Synqra brand guardrails
  const result = await executeWithGuardrails({
    type: 'generation',
    input: enhancedPrompt,
    brand: 'synqra',
    isClientFacing: true,
    maxBudget: request.maxBudget || 0.02,
    guardrails: {
      enableBrandAlignment: true,
      enableToxicityCheck: true,
      enableHallucinationGate: true,
      minQualityScore: 0.75,
      maxRetries: 3,
    },
    enableSelfHealing: true,
  });
  
  return {
    content: result.output,
    platform: request.platform || 'general',
    quality: result.quality,
    cost: result.cost,
    metadata: {
      model: result.model,
      attempts: result.metadata.attempts,
      brandAligned: result.metadata.guardrailsPassed,
      issues: result.metadata.issues,
    },
  };
}

function buildSynqraPrompt(request: SynqraContentRequest): string {
  const basePrompt = request.prompt;
  
  let context = '';
  
  if (request.platform) {
    context += `\nPlatform: ${request.platform}`;
    context += `\nOptimize for ${request.platform} best practices.`;
  }
  
  if (request.style) {
    context += `\nStyle: ${request.style}`;
  }
  
  if (request.length) {
    const lengthGuide = {
      short: '50-100 words',
      medium: '100-300 words',
      long: '300-500 words',
    };
    context += `\nLength: ${lengthGuide[request.length]}`;
  }
  
  context += `\n\nBrand Guidelines:
- Creative and intelligent tone
- Premium quality language
- Focus on automation and time-saving
- Sophisticated yet accessible
- No generic or cliché phrases`;
  
  return `${basePrompt}${context}`;
}

// ============================================================
// NØID DRIVER ASSISTANT
// ============================================================

export async function processNoidDriverQuery(
  request: NoidDriverRequest
): Promise<{
  response: string;
  confidence: number;
  suggestions: string[];
  quality: number;
  cost: number;
}> {
  console.log('🚗 NØID Driver Assistant');
  console.log(`   Priority: ${request.priority || 'normal'}`);
  
  // Build driver-aware prompt
  const enhancedQuery = buildNoidPrompt(request);
  
  // Execute with NØID brand guardrails
  const result = await executeWithGuardrails({
    type: 'generation',
    input: enhancedQuery,
    brand: 'noid',
    isClientFacing: true,
    maxBudget: 0.01, // NØID targets efficiency
    guardrails: {
      enableBrandAlignment: true,
      enableToxicityCheck: true,
      enableHallucinationGate: true,
      minQualityScore: 0.70,
      maxRetries: 2, // Faster response for drivers
    },
    enableSelfHealing: true,
  });
  
  // Extract suggestions from response
  const suggestions = extractSuggestions(result.output);
  
  return {
    response: result.output,
    confidence: result.quality,
    suggestions,
    quality: result.quality,
    cost: result.cost,
  };
}

function buildNoidPrompt(request: NoidDriverRequest): string {
  let prompt = request.query;
  
  if (request.driverProfile) {
    prompt += `\n\nDriver Context:
- Name: ${request.driverProfile.name}
- Preferences: ${request.driverProfile.preferences.join(', ')}
- Recent: ${request.driverProfile.history.slice(-3).join('; ')}`;
  }
  
  prompt += `\n\nBrand Guidelines:
- Professional and helpful tone
- Clear and actionable advice
- Efficient and reliable information
- No complicated jargon
- Focus on driver safety and efficiency`;
  
  return prompt;
}

function extractSuggestions(response: string): string[] {
  // Extract bullet points or numbered lists as suggestions
  const suggestions: string[] = [];
  
  const bulletPoints = response.match(/^[-•*]\s+(.+)$/gm);
  if (bulletPoints) {
    suggestions.push(...bulletPoints.map(s => s.replace(/^[-•*]\s+/, '').trim()));
  }
  
  const numberedPoints = response.match(/^\d+\.\s+(.+)$/gm);
  if (numberedPoints) {
    suggestions.push(...numberedPoints.map(s => s.replace(/^\d+\.\s+/, '').trim()));
  }
  
  return suggestions.slice(0, 5); // Max 5 suggestions
}

// ============================================================
// AURAFX TRADING ANALYSIS
// ============================================================

export async function generateAuraFXAnalysis(
  request: AuraFXAnalysisRequest
): Promise<{
  analysis: string;
  signals: string[];
  confidence: number;
  quality: number;
  cost: number;
  metadata: any;
}> {
  console.log('📊 AuraFX Trading Analysis');
  console.log(`   Type: ${request.analysisType}`);
  
  // Build analysis prompt
  const enhancedPrompt = buildAuraFXPrompt(request);
  
  // Execute with AuraFX brand guardrails
  const result = await executeWithGuardrails({
    type: 'reasoning',
    input: enhancedPrompt,
    brand: 'aurafx',
    isClientFacing: true,
    requiresReasoning: true,
    maxBudget: 0.03, // Higher budget for financial analysis
    guardrails: {
      enableBrandAlignment: true,
      enableToxicityCheck: false, // Not needed for market data
      enableHallucinationGate: true, // Critical for financial data
      minQualityScore: 0.80, // High quality required
      maxRetries: 3,
    },
    enableSelfHealing: true,
  });
  
  // Extract trading signals
  const signals = extractTradingSignals(result.output);
  
  return {
    analysis: result.output,
    signals,
    confidence: result.quality,
    quality: result.quality,
    cost: result.cost,
    metadata: result.metadata,
  };
}

function buildAuraFXPrompt(request: AuraFXAnalysisRequest): string {
  let prompt = `Analyze the following market data:

${request.marketData}

Analysis Type: ${request.analysisType}`;
  
  if (request.timeframe) {
    prompt += `\nTimeframe: ${request.timeframe}`;
  }
  
  if (request.requiresChart) {
    prompt += `\nInclude chart pattern analysis.`;
  }
  
  prompt += `\n\nBrand Guidelines:
- Precise and analytical tone
- Data-driven insights only
- No emotional language
- Systematic and disciplined approach
- Clear risk assessment
- No speculative predictions without data
- Focus on probability and risk management`;
  
  return prompt;
}

function extractTradingSignals(analysis: string): string[] {
  const signals: string[] = [];
  
  // Look for signal patterns
  const signalPatterns = [
    /\b(buy|long|bullish)\b/gi,
    /\b(sell|short|bearish)\b/gi,
    /\b(hold|neutral|sideways)\b/gi,
  ];
  
  signalPatterns.forEach(pattern => {
    const matches = analysis.match(pattern);
    if (matches && matches.length > 0) {
      signals.push(matches[0].toLowerCase());
    }
  });
  
  return Array.from(new Set(signals)); // Remove duplicates
}

// ============================================================
// UNIFIED API FOR ALL APPS
// ============================================================

export interface UnifiedAIRequest {
  app: 'synqra' | 'noid' | 'aurafx';
  prompt: string;
  context?: any;
  options?: {
    maxBudget?: number;
    priority?: 'high' | 'normal' | 'low';
    enableGuardrails?: boolean;
  };
}

export async function processUnifiedRequest(request: UnifiedAIRequest): Promise<any> {
  console.log(`\n🎯 Processing ${request.app.toUpperCase()} request`);
  
  const brand: BrandProfile = request.app === 'noid' ? 'noid' : request.app === 'aurafx' ? 'aurafx' : 'synqra';
  
  const result = await executeWithGuardrails({
    type: 'generation',
    input: request.prompt,
    brand,
    isClientFacing: true,
    maxBudget: request.options?.maxBudget || 0.02,
    guardrails: request.options?.enableGuardrails !== false ? {
      enableBrandAlignment: true,
      enableToxicityCheck: true,
      enableHallucinationGate: true,
      minQualityScore: 0.75,
      maxRetries: 3,
    } : undefined,
    enableSelfHealing: true,
  });
  
  return {
    app: request.app,
    output: result.output,
    quality: result.quality,
    cost: result.cost,
    metadata: result.metadata,
  };
}

// ============================================================
// SYSTEM STATUS & HEALTH
// ============================================================

export async function getSystemStatus(): Promise<{
  health: SystemHealth;
  stats: UsageStats;
  recommendations: string[];
}> {
  console.log('📊 Checking system status...');
  
  const health = await checkSystemHealth();
  const stats = getUsageStats();
  
  const recommendations: string[] = [...health.recommendations];
  
  // Add usage-based recommendations
  if (stats.totalRequests > 0) {
    const successRate = (stats.successfulRequests / stats.totalRequests) * 100;
    if (successRate < 80) {
      recommendations.push(`⚠️  Success rate is low (${successRate.toFixed(1)}%) - check model quality`);
    }
    
    if (stats.averageCost > 0.01) {
      recommendations.push(`💰 Average cost is high ($${stats.averageCost.toFixed(4)}) - optimize routing`);
    }
    
    if (stats.guardrailsTriggered / stats.totalRequests > 0.3) {
      recommendations.push(`🚨 High guardrail trigger rate (${((stats.guardrailsTriggered / stats.totalRequests) * 100).toFixed(1)}%) - review content quality`);
    }
  }
  
  return { health, stats, recommendations };
}

// ============================================================
// BATCH PROCESSING
// ============================================================

export async function batchProcess(requests: UnifiedAIRequest[]): Promise<any[]> {
  console.log(`📦 Batch processing ${requests.length} requests`);
  
  const results: any[] = [];
  
  for (const request of requests) {
    try {
      const result = await processUnifiedRequest(request);
      results.push(result);
    } catch (error: any) {
      console.error(`❌ Batch item failed:`, error.message);
      results.push({
        app: request.app,
        output: `Error: ${error.message}`,
        quality: 0,
        cost: 0,
        metadata: { error: error.message },
      });
    }
  }
  
  return results;
}

// ============================================================
// EXPORT CONVENIENT ALIASES
// ============================================================

export const Synqra = {
  generateContent: generateSynqraContent,
  brand: 'synqra' as BrandProfile,
};

export const Noid = {
  processQuery: processNoidDriverQuery,
  brand: 'noid' as BrandProfile,
};

export const AuraFX = {
  analyze: generateAuraFXAnalysis,
  brand: 'aurafx' as BrandProfile,
};
