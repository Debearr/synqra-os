/**
 * ============================================================
 * SAFETY CHECKER
 * ============================================================
 * Toxicity and content safety scanning
 */

import type { SafetyResult } from '../types';
import { modelManager } from '../models/manager';
import { AI_ROUTER_CONFIG } from '../config';

export class SafetyChecker {
  /**
   * Check content for toxicity and safety issues
   */
  async check(text: string): Promise<SafetyResult> {
    if (!AI_ROUTER_CONFIG.features.enableSafetyChecks) {
      // If disabled, always pass
      return {
        isSafe: true,
        toxicity: 0,
        categories: {
          toxic: 0,
          severeToxic: 0,
          obscene: 0,
          threat: 0,
          insult: 0,
          identityHate: 0,
        },
        recommendation: 'allow',
      };
    }
    
    try {
      // Load toxicity model
      const model = await modelManager.loadModel('toxic-bert');
      
      // Run prediction
      const prediction = await model.predict(text);
      
      // Extract scores
      const categories = {
        toxic: prediction.toxic || 0,
        severeToxic: prediction.severe_toxic || 0,
        obscene: prediction.obscene || 0,
        threat: prediction.threat || 0,
        insult: prediction.insult || 0,
        identityHate: prediction.identity_hate || 0,
      };
      
      // Calculate overall toxicity (max of all categories)
      const toxicity = Math.max(...Object.values(categories));
      
      // Determine recommendation
      let recommendation: 'allow' | 'review' | 'block';
      if (toxicity > 0.7) {
        recommendation = 'block';
      } else if (toxicity > AI_ROUTER_CONFIG.routing.safetyThreshold) {
        recommendation = 'review';
      } else {
        recommendation = 'allow';
      }
      
      const isSafe = recommendation === 'allow';
      
      // Update model health
      modelManager.updateHealth('toxic-bert', true);
      
      return {
        isSafe,
        toxicity,
        categories,
        recommendation,
      };
    } catch (error) {
      console.error('Safety check failed:', error);
      
      // Update model health
      modelManager.updateHealth('toxic-bert', false);
      
      // On error, be permissive (don't block content)
      return {
        isSafe: true,
        toxicity: 0,
        categories: {
          toxic: 0,
          severeToxic: 0,
          obscene: 0,
          threat: 0,
          insult: 0,
          identityHate: 0,
        },
        recommendation: 'allow',
      };
    }
  }
  
  /**
   * Batch check multiple texts
   */
  async checkBatch(texts: string[]): Promise<SafetyResult[]> {
    return Promise.all(texts.map(text => this.check(text)));
  }
}

// Singleton instance
export const safetyChecker = new SafetyChecker();
