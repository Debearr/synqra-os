/**
 * ============================================================
 * DESCRIPTION OPTIMIZER MCP
 * ============================================================
 * SEO-optimized YouTube descriptions with A/B testing
 */

import { loadEnvConfig } from '../../shared/config';
import { MCPResponse } from '../../shared/types';
import { wrapResponse, wrapError, Logger, validateRequired } from '../../shared/utils';

const logger = new Logger('description-optimizer');

export interface DescriptionRequest {
  topic: string;
  keywords?: string[];
  cta?: string;
  includeTimestamps?: boolean;
  includeLinks?: boolean;
  maxLength?: number;
  variantCount?: number;
  platform?: 'youtube' | 'linkedin' | 'facebook';
}

export interface DescriptionVariant {
  id: string;
  description: string;
  strategy: string;
  seoScore: number;
  keywordDensity: number;
  length: number;
  hook: string;
}

export class DescriptionOptimizer {
  constructor() {
    loadEnvConfig([]);
  }
  
  async generate(request: DescriptionRequest): Promise<MCPResponse<DescriptionVariant[]>> {
    const startTime = Date.now();
    
    try {
      logger.info('Generating description variants', { topic: request.topic });
      
      validateRequired(request, ['topic']);
      
      const maxLength = request.maxLength || 5000;
      const variantCount = request.variantCount || 3;
      const keywords = request.keywords || [];
      const platform = request.platform || 'youtube';
      
      const variants: DescriptionVariant[] = [];
      
      // Variant A: SEO-heavy
      if (variantCount >= 1) {
        variants.push(this.generateSEOVariant(request.topic, keywords, request.cta, maxLength));
      }
      
      // Variant B: Bullet points
      if (variantCount >= 2) {
        variants.push(this.generateBulletVariant(request.topic, keywords, request.cta, maxLength));
      }
      
      // Variant C: Storytelling
      if (variantCount >= 3) {
        variants.push(this.generateStoryVariant(request.topic, keywords, request.cta, maxLength));
      }
      
      logger.info('Description variants generated', { count: variants.length });
      
      return wrapResponse(variants, 'description-optimizer', startTime);
    } catch (error) {
      logger.error('Description generation failed', { error });
      return wrapError(error as Error, 'description-optimizer', startTime);
    }
  }
  
  private generateSEOVariant(
    topic: string,
    keywords: string[],
    cta?: string,
    maxLength = 5000
  ): DescriptionVariant {
    const hook = `🚀 Everything you need to know about ${topic}`;
    
    let description = `${hook}\n\n`;
    description += `In this comprehensive guide, we cover ${topic} in detail. `;
    
    // Add keywords naturally
    if (keywords.length > 0) {
      description += `Learn about ${keywords.slice(0, 3).join(', ')}, and more. `;
    }
    
    description += `\n\n📚 What You'll Learn:\n`;
    description += `• Complete overview of ${topic}\n`;
    description += `• Best practices and tips\n`;
    description += `• Real-world examples\n`;
    description += `• Step-by-step tutorial\n`;
    
    if (keywords.length > 0) {
      description += `\n\n🔑 Key Topics:\n`;
      keywords.slice(0, 5).forEach(kw => {
        description += `• ${kw}\n`;
      });
    }
    
    if (cta) {
      description += `\n\n${cta}\n`;
    }
    
    description += `\n\n#${topic.replace(/\s+/g, '')} ${keywords.map(k => '#' + k.replace(/\s+/g, '')).join(' ')}`;
    
    return {
      id: `desc-seo-${Date.now()}`,
      description: description.substring(0, maxLength),
      strategy: 'SEO-optimized with keyword density',
      seoScore: 0.95,
      keywordDensity: this.calculateKeywordDensity(description, keywords),
      length: Math.min(description.length, maxLength),
      hook,
    };
  }
  
  private generateBulletVariant(
    topic: string,
    keywords: string[],
    cta?: string,
    maxLength = 5000
  ): DescriptionVariant {
    const hook = `✨ Quick guide to ${topic} - everything in one place!`;
    
    let description = `${hook}\n\n`;
    description += `⚡ Quick Overview:\n`;
    description += `This video covers ${topic} with actionable insights you can use immediately.\n\n`;
    
    description += `📋 What's Inside:\n`;
    description += `✅ Introduction to ${topic}\n`;
    description += `✅ Key concepts explained\n`;
    description += `✅ Practical examples\n`;
    description += `✅ Common mistakes to avoid\n`;
    description += `✅ Next steps\n\n`;
    
    if (keywords.length > 0) {
      description += `🎯 Topics Covered:\n`;
      keywords.forEach(kw => {
        description += `→ ${kw}\n`;
      });
      description += `\n`;
    }
    
    description += `⏱️ Timestamps:\n`;
    description += `0:00 - Introduction\n`;
    description += `1:30 - Main Content\n`;
    description += `5:00 - Examples\n`;
    description += `8:00 - Conclusion\n\n`;
    
    if (cta) {
      description += `${cta}\n\n`;
    }
    
    description += `#${topic.replace(/\s+/g, '')}`;
    
    return {
      id: `desc-bullet-${Date.now()}`,
      description: description.substring(0, maxLength),
      strategy: 'Bullet-point structure for scannability',
      seoScore: 0.75,
      keywordDensity: this.calculateKeywordDensity(description, keywords),
      length: Math.min(description.length, maxLength),
      hook,
    };
  }
  
  private generateStoryVariant(
    topic: string,
    keywords: string[],
    cta?: string,
    maxLength = 5000
  ): DescriptionVariant {
    const hook = `📖 The complete story of ${topic} and why it matters`;
    
    let description = `${hook}\n\n`;
    description += `Ever wondered about ${topic}? You're not alone.\n\n`;
    description += `In this video, we explore ${topic} from the ground up. `;
    description += `Whether you're just getting started or looking to deepen your understanding, `;
    description += `this guide has something for everyone.\n\n`;
    
    if (keywords.length > 0) {
      description += `We'll cover ${keywords.slice(0, 3).join(', ')}, and show you `;
      description += `how to apply these concepts in real-world scenarios.\n\n`;
    }
    
    description += `By the end of this video, you'll have a complete understanding of `;
    description += `${topic} and be ready to take action.\n\n`;
    
    if (cta) {
      description += `${cta}\n\n`;
    }
    
    description += `Join thousands of others who have already mastered ${topic}. `;
    description += `Let's get started!\n\n`;
    
    description += `#${topic.replace(/\s+/g, '')}`;
    
    return {
      id: `desc-story-${Date.now()}`,
      description: description.substring(0, maxLength),
      strategy: 'Narrative storytelling approach',
      seoScore: 0.65,
      keywordDensity: this.calculateKeywordDensity(description, keywords),
      length: Math.min(description.length, maxLength),
      hook,
    };
  }
  
  private calculateKeywordDensity(text: string, keywords: string[]): number {
    if (keywords.length === 0) return 0;
    
    const lowerText = text.toLowerCase();
    const wordCount = text.split(/\s+/).length;
    
    let keywordCount = 0;
    keywords.forEach(keyword => {
      const regex = new RegExp(keyword.toLowerCase(), 'g');
      const matches = lowerText.match(regex);
      keywordCount += matches ? matches.length : 0;
    });
    
    return (keywordCount / wordCount) * 100;
  }
}

export const descriptionOptimizer = new DescriptionOptimizer();

if (require.main === module) {
  descriptionOptimizer.generate({
    topic: 'AI Automation',
    keywords: ['machine learning', 'productivity', 'workflow'],
    cta: '👉 Subscribe for more AI tutorials!',
    variantCount: 3,
  }).then(response => console.log(JSON.stringify(response, null, 2)));
}
