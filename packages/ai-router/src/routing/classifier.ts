/**
 * ============================================================
 * TASK CLASSIFIER
 * ============================================================
 * Classifies incoming tasks for optimal routing
 */

import type { TaskClassification, TaskComplexity, TaskDomain, TaskCriticality } from '../types';
import { AI_ROUTER_CONFIG } from '../config';

export class TaskClassifier {
  /**
   * Estimate token count (rough approximation)
   */
  private estimateTokens(text: string): number {
    // Rough estimate: ~4 characters per token
    return Math.ceil(text.length / 4);
  }
  
  /**
   * Detect if task is code-related
   */
  private isCodeTask(input: string): boolean {
    const codeIndicators = [
      'function', 'const', 'let', 'var', 'class', 'interface',
      'import', 'export', 'async', 'await', 'return',
      '{', '}', '=>', '()', '[]', 
      'python', 'javascript', 'typescript', 'code', 'programming'
    ];
    
    const lowerInput = input.toLowerCase();
    return codeIndicators.some(indicator => lowerInput.includes(indicator));
  }
  
  /**
   * Detect if task is content generation
   */
  private isContentGeneration(input: string): boolean {
    const contentIndicators = [
      'write', 'generate', 'create', 'draft', 'compose',
      'blog', 'article', 'post', 'caption', 'tweet',
      'linkedin', 'facebook', 'instagram', 'social media'
    ];
    
    const lowerInput = input.toLowerCase();
    return contentIndicators.some(indicator => lowerInput.includes(indicator));
  }
  
  /**
   * Detect if task requires complex reasoning
   */
  private requiresComplexReasoning(input: string): boolean {
    const complexIndicators = [
      'why', 'how', 'explain', 'analyze', 'compare', 'evaluate',
      'strategy', 'plan', 'design', 'architect', 'decision',
      'multi-step', 'chain of thought', 'reasoning'
    ];
    
    const lowerInput = input.toLowerCase();
    return complexIndicators.some(indicator => lowerInput.includes(indicator));
  }
  
  /**
   * Detect criticality based on context
   */
  private detectCriticality(input: string): TaskCriticality {
    const highCriticalityIndicators = [
      'critical', 'urgent', 'important', 'production', 'customer-facing',
      'security', 'payment', 'compliance', 'legal'
    ];
    
    const mediumCriticalityIndicators = [
      'business', 'client', 'user', 'publish', 'deploy'
    ];
    
    const lowerInput = input.toLowerCase();
    
    if (highCriticalityIndicators.some(i => lowerInput.includes(i))) {
      return 'high';
    }
    
    if (mediumCriticalityIndicators.some(i => lowerInput.includes(i))) {
      return 'medium';
    }
    
    return 'low';
  }
  
  /**
   * Determine task domain
   */
  private determineDomain(input: string): TaskDomain {
    if (this.isCodeTask(input)) return 'code';
    if (this.isContentGeneration(input)) return 'content';
    if (this.requiresComplexReasoning(input)) return 'reasoning';
    return 'creative';
  }
  
  /**
   * Determine complexity based on length and content
   */
  private determineComplexity(tokens: number, input: string): TaskComplexity {
    // Simple: Short, factual queries
    if (tokens < AI_ROUTER_CONFIG.complexity.simpleMaxTokens && 
        !this.requiresComplexReasoning(input)) {
      return 'simple';
    }
    
    // Complex: Long or requires deep reasoning
    if (tokens > AI_ROUTER_CONFIG.complexity.mediumMaxTokens || 
        this.requiresComplexReasoning(input)) {
      return 'complex';
    }
    
    // Medium: Everything else
    return 'medium';
  }
  
  /**
   * Main classification method
   */
  classify(input: string): TaskClassification {
    const tokens = this.estimateTokens(input);
    const domain = this.determineDomain(input);
    const complexity = this.determineComplexity(tokens, input);
    const criticality = this.detectCriticality(input);
    
    return {
      complexity,
      domain,
      length: tokens,
      criticality,
    };
  }
}

// Singleton instance
export const taskClassifier = new TaskClassifier();
