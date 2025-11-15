/**
 * ============================================================
 * TOXICITY GUARD MCP
 * ============================================================
 * RoBERTa toxicity detection with incident logging
 */

import { loadEnvConfig } from '../../shared/config';
import { MCPResponse } from '../../shared/types';
import { wrapResponse, wrapError, Logger, validateRequired } from '../../shared/utils';
import { createClient } from '@supabase/supabase-js';

const logger = new Logger('toxicity-guard');

export interface ToxicityRequest {
  text: string;
  threshold?: number;
  logIncidents?: boolean;
}

export interface ToxicityResult {
  isToxic: boolean;
  score: number;
  categories: {
    hate: number;
    threat: number;
    profanity: number;
    harassment: number;
  };
  blocked: boolean;
}

export class ToxicityGuard {
  private supabase: any;
  private threshold: number;
  
  constructor() {
    const config = loadEnvConfig(['supabase-url', 'supabase-service-key']);
    this.supabase = createClient(config.supabaseUrl, config.supabaseServiceKey);
    this.threshold = 0.7;
  }
  
  async check(request: ToxicityRequest): Promise<MCPResponse<ToxicityResult>> {
    const startTime = Date.now();
    
    try {
      logger.info('Checking toxicity', { textLength: request.text.length });
      
      validateRequired(request, ['text']);
      
      const threshold = request.threshold || this.threshold;
      const logIncidents = request.logIncidents !== false;
      
      // Run toxicity detection (would integrate with RoBERTa model)
      const result = await this.detectToxicity(request.text);
      
      // Determine if blocked
      const blocked = result.score > threshold;
      
      // Log incident if toxic and logging enabled
      if (blocked && logIncidents) {
        await this.logIncident(request.text, result);
      }
      
      logger.info('Toxicity check complete', { isToxic: result.isToxic, blocked });
      
      return wrapResponse(
        { ...result, blocked },
        'toxicity-guard',
        startTime
      );
    } catch (error) {
      logger.error('Toxicity check failed', { error });
      return wrapError(error as Error, 'toxicity-guard', startTime);
    }
  }
  
  private async detectToxicity(text: string): Promise<Omit<ToxicityResult, 'blocked'>> {
    // Integration point with RoBERTa toxicity model
    // For now, using keyword-based fallback
    
    const toxicKeywords = {
      hate: ['hate', 'racist', 'sexist'],
      threat: ['kill', 'die', 'threat'],
      profanity: ['damn', 'hell', 'shit', 'fuck'],
      harassment: ['stupid', 'idiot', 'loser'],
    };
    
    const lowerText = text.toLowerCase();
    
    const categories = {
      hate: 0,
      threat: 0,
      profanity: 0,
      harassment: 0,
    };
    
    // Check each category
    Object.entries(toxicKeywords).forEach(([category, keywords]) => {
      const matches = keywords.filter(kw => lowerText.includes(kw)).length;
      categories[category as keyof typeof categories] = Math.min(matches * 0.3, 1.0);
    });
    
    // Calculate overall score
    const score = Math.max(...Object.values(categories));
    const isToxic = score > 0.5;
    
    return {
      isToxic,
      score,
      categories,
    };
  }
  
  private async logIncident(text: string, result: Omit<ToxicityResult, 'blocked'>): Promise<void> {
    try {
      await this.supabase
        .from('toxicity_incidents')
        .insert({
          text: text.substring(0, 500), // Store first 500 chars
          score: result.score,
          categories: result.categories,
          timestamp: new Date().toISOString(),
        });
      
      logger.info('Toxic incident logged');
    } catch (error) {
      logger.warn('Failed to log incident', { error });
      // Non-critical, continue
    }
  }
}

export const toxicityGuard = new ToxicityGuard();

if (require.main === module) {
  toxicityGuard.check({
    text: 'This is a normal, friendly message.',
  }).then(response => console.log(JSON.stringify(response, null, 2)));
}
