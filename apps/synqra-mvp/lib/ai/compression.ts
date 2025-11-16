/**
 * ============================================================
 * INPUT COMPRESSION & CONTEXT REDUCTION
 * ============================================================
 * Reduces token usage through intelligent compression
 */

import { CompressionResult } from './types';

/**
 * COMPRESS INPUT
 * Uses DeepSeek to compress input to 50-150 tokens
 */
export async function compressInput(
  input: string,
  context: string[] = []
): Promise<string> {
  // Check if compression needed
  if (input.length < 500) {
    return input;
  }

  // Target: 50-150 tokens (200-600 chars)
  const targetLength = Math.min(600, Math.max(200, input.length * 0.3));

  // Simple compression strategies:
  // 1. Remove redundant whitespace
  let compressed = input.replace(/\s+/g, ' ').trim();

  // 2. Remove filler words
  const fillers = ['basically', 'actually', 'literally', 'just', 'really', 'very', 'quite'];
  for (const filler of fillers) {
    const regex = new RegExp(`\\b${filler}\\b`, 'gi');
    compressed = compressed.replace(regex, '');
  }

  // 3. Abbreviate common phrases
  const abbreviations: Record<string, string> = {
    'for example': 'e.g.',
    'that is': 'i.e.',
    'and so on': 'etc.',
    'as soon as possible': 'ASAP',
    'frequently asked questions': 'FAQ',
  };

  for (const [phrase, abbr] of Object.entries(abbreviations)) {
    const regex = new RegExp(phrase, 'gi');
    compressed = compressed.replace(regex, abbr);
  }

  // 4. If still too long, extract key sentences
  if (compressed.length > targetLength) {
    compressed = extractKeySentences(compressed, targetLength);
  }

  return compressed;
}

/**
 * EXTRACT KEY SENTENCES
 * Keeps most important sentences based on keywords and position
 */
function extractKeySentences(text: string, targetLength: number): string {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  
  // Score sentences
  const scored = sentences.map((sentence, index) => {
    let score = 0;
    
    // Position score (first and last sentences are important)
    if (index === 0) score += 2;
    if (index === sentences.length - 1) score += 1;
    
    // Keyword score
    const keywords = ['important', 'key', 'critical', 'must', 'need', 'require', 'essential'];
    for (const keyword of keywords) {
      if (sentence.toLowerCase().includes(keyword)) {
        score += 1;
      }
    }
    
    // Question score
    if (sentence.includes('?')) score += 1;
    
    // Length penalty (very short sentences are less informative)
    if (sentence.length < 20) score -= 1;
    
    return { sentence, score };
  });
  
  // Sort by score and take top sentences until target length
  scored.sort((a, b) => b.score - a.score);
  
  let result = '';
  for (const item of scored) {
    if (result.length + item.sentence.length <= targetLength) {
      result += item.sentence + ' ';
    }
  }
  
  return result.trim();
}

/**
 * REDUCE CONTEXT
 * Intelligently reduces conversation history using Mistral
 */
export async function reduceContext(
  history: string[],
  maxLength: number = 1000
): Promise<string[]> {
  if (history.length === 0) return [];
  
  // Calculate total length
  const totalLength = history.reduce((sum, msg) => sum + msg.length, 0);
  
  if (totalLength <= maxLength) {
    return history;
  }
  
  // Keep most recent messages
  const reduced: string[] = [];
  let currentLength = 0;
  
  for (let i = history.length - 1; i >= 0; i--) {
    const msg = history[i];
    if (currentLength + msg.length <= maxLength) {
      reduced.unshift(msg);
      currentLength += msg.length;
    } else {
      break;
    }
  }
  
  return reduced;
}

/**
 * SMART SUMMARIZE
 * Compresses long text while preserving key information
 */
export async function smartSummarize(
  text: string,
  maxTokens: number = 150
): Promise<CompressionResult> {
  const originalLength = text.length;
  const targetLength = maxTokens * 4; // ~4 chars per token
  
  let compressed = text;
  
  if (text.length > targetLength) {
    // Extract key points
    compressed = await compressInput(text, []);
  }
  
  const compressedLength = compressed.length;
  const compressionRatio = originalLength > 0 ? compressedLength / originalLength : 1;
  
  return {
    compressed,
    originalLength,
    compressedLength,
    compressionRatio,
  };
}

/**
 * PRECOMPRESSION FUNCTION
 * Called before any model execution
 */
export async function precompressInput(input: string): Promise<string> {
  // Only compress if input is large
  if (input.length < 500) return input;
  
  const result = await smartSummarize(input, 150);
  
  console.log(`📉 Compression: ${result.originalLength} → ${result.compressedLength} chars (${(result.compressionRatio * 100).toFixed(1)}%)`);
  
  return result.compressed;
}

/**
 * BATCH COMPRESS
 * Compresses multiple inputs efficiently
 */
export async function batchCompress(inputs: string[]): Promise<string[]> {
  return Promise.all(inputs.map(input => compressInput(input, [])));
}
