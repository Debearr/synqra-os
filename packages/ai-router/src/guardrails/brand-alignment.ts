/**
 * ============================================================
 * BRAND ALIGNMENT CHECKER
 * ============================================================
 * Uses OpenCLIP to ensure generated content aligns with brand
 */

import type { BrandAlignmentResult } from '../types';
import { modelManager } from '../models/manager';
import { AI_ROUTER_CONFIG } from '../config';

export class BrandAlignmentChecker {
  // Brand guidelines (embeddings will be computed once)
  private brandGuidelines = [
    'Tesla minimalism: clean, simple, no clutter',
    'Apple clarity: obvious, intuitive, user-first',
    'Tom Ford precision: exact, surgical, perfect',
    'Virgil Abloh innovation: boundary-pushing, thoughtful disruption',
    'NØID aesthetic: matte black, gold accents, luxury, premium',
    'Professional tone: confident, knowledgeable, helpful',
  ];
  
  private guidelineEmbeddings: number[][] | null = null;
  
  /**
   * Compute cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have same length');
    }
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
  
  /**
   * Compute embeddings for brand guidelines (once)
   */
  private async computeGuidelineEmbeddings(): Promise<number[][]> {
    if (this.guidelineEmbeddings) {
      return this.guidelineEmbeddings;
    }
    
    try {
      const model = await modelManager.loadModel('openclip');
      
      const embeddings = await Promise.all(
        this.brandGuidelines.map(guideline => model.encodeText(guideline))
      );
      
      this.guidelineEmbeddings = embeddings;
      return embeddings;
    } catch (error) {
      console.error('Failed to compute guideline embeddings:', error);
      throw error;
    }
  }
  
  /**
   * Check if generated text aligns with brand
   */
  async check(generatedText: string): Promise<BrandAlignmentResult> {
    if (!AI_ROUTER_CONFIG.features.enableBrandAlignment) {
      // If disabled, always pass
      return {
        aligned: true,
        score: 1.0,
        guidelines: [],
      };
    }
    
    try {
      // Load OpenCLIP model
      const model = await modelManager.loadModel('openclip');
      
      // Compute embedding for generated text
      const textEmbedding = await model.encodeText(generatedText);
      
      // Get or compute guideline embeddings
      const guidelineEmbeddings = await this.computeGuidelineEmbeddings();
      
      // Compute similarities
      const similarities = guidelineEmbeddings.map((guideline, index) => ({
        guideline: this.brandGuidelines[index],
        similarity: this.cosineSimilarity(textEmbedding, guideline),
      }));
      
      // Get max similarity
      const maxSimilarity = Math.max(...similarities.map(s => s.similarity));
      
      // Get top matching guidelines
      const topGuidelines = similarities
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 3)
        .map(s => s.guideline);
      
      const aligned = maxSimilarity >= AI_ROUTER_CONFIG.routing.brandAlignmentThreshold;
      
      // Update model health
      modelManager.updateHealth('openclip', true);
      
      return {
        aligned,
        score: maxSimilarity,
        guidelines: topGuidelines,
      };
    } catch (error) {
      console.error('Brand alignment check failed:', error);
      
      // Update model health
      modelManager.updateHealth('openclip', false);
      
      // On error, be permissive (don't block content)
      return {
        aligned: true,
        score: 0.5,
        guidelines: [],
      };
    }
  }
  
  /**
   * Add custom brand guideline
   */
  addGuideline(guideline: string): void {
    this.brandGuidelines.push(guideline);
    // Clear cached embeddings to recompute
    this.guidelineEmbeddings = null;
  }
  
  /**
   * Get all brand guidelines
   */
  getGuidelines(): string[] {
    return [...this.brandGuidelines];
  }
}

// Singleton instance
export const brandAlignmentChecker = new BrandAlignmentChecker();
