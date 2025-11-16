/**
 * ============================================================
 * SUPABASE VECTOR PIPELINE - DEEPSEEK ARCHITECTURE
 * ============================================================
 * Implements: raw_input → toxicity_check → clean_input → 
 * bge_embeddings → vector_search → context_enrichment → routing_engine
 */

import { createClient } from "@supabase/supabase-js";
import { runInference } from "../models/localModelLoader";
import { processText } from "../models/processingPipeline";

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || "";

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Vector pipeline stages
 */
export interface VectorPipelineResult {
  rawInput: string;
  toxicityScore: number;
  cleanInput: string;
  embeddings: number[];
  similarDocuments: any[];
  enrichedContext: string;
  routingRecommendation: string;
}

/**
 * Execute full vector pipeline
 */
export async function executeVectorPipeline(
  input: string,
  options: {
    topK?: number;
    similarityThreshold?: number;
    includeMetadata?: boolean;
  } = {}
): Promise<VectorPipelineResult> {
  const { topK = 5, similarityThreshold = 0.7, includeMetadata = true } = options;
  
  console.log("🔄 Executing vector pipeline...");
  
  // Stage 1: Raw input logging
  const rawInput = input.trim();
  console.log(`   📝 Raw input: ${rawInput.substring(0, 100)}...`);
  
  // Stage 2: Process text (includes toxicity check)
  const processed = await processText(rawInput);
  const toxicityScore = processed.toxicity;
  
  console.log(`   🛡️  Toxicity: ${(toxicityScore * 100).toFixed(1)}%`);
  
  // Stage 3: Clean input (remove toxic content if needed)
  let cleanInput = rawInput;
  if (toxicityScore > 0.8) {
    console.log(`   ⚠️  High toxicity detected, sanitizing input`);
    cleanInput = sanitizeInput(rawInput);
  }
  
  // Stage 4: Generate embeddings (BGE-small-en-v1.5)
  const embeddings = processed.embeddings;
  console.log(`   🔢 Embeddings: ${embeddings.length}D vector`);
  
  // Stage 5: Vector search in Supabase
  const similarDocuments = await vectorSearch(embeddings, topK, similarityThreshold);
  console.log(`   🔍 Found ${similarDocuments.length} similar documents`);
  
  // Stage 6: Cross-encoder reranking
  const rerankedDocuments = await rerankDocuments(cleanInput, similarDocuments);
  console.log(`   📊 Reranked top ${rerankedDocuments.length} results`);
  
  // Stage 7: Context enrichment
  const enrichedContext = buildEnrichedContext(cleanInput, rerankedDocuments);
  console.log(`   ✨ Enriched context: ${enrichedContext.length} chars`);
  
  // Stage 8: Routing recommendation
  const routingRecommendation = determineRouting(cleanInput, enrichedContext);
  console.log(`   📍 Routing: ${routingRecommendation}`);
  
  // Log to Supabase
  await logPipelineExecution({
    rawInput,
    cleanInput,
    toxicityScore,
    embeddingDimensions: embeddings.length,
    similarDocumentsCount: similarDocuments.length,
    routingRecommendation,
  });
  
  console.log("✅ Vector pipeline complete");
  
  return {
    rawInput,
    toxicityScore,
    cleanInput,
    embeddings,
    similarDocuments: rerankedDocuments,
    enrichedContext,
    routingRecommendation,
  };
}

/**
 * Sanitize toxic input
 */
function sanitizeInput(input: string): string {
  const toxicWords = ["hate", "kill", "die", "stupid", "idiot", "damn", "hell"];
  let sanitized = input;
  
  toxicWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    sanitized = sanitized.replace(regex, "***");
  });
  
  return sanitized;
}

/**
 * Vector search in Supabase
 */
async function vectorSearch(
  embedding: number[],
  topK: number,
  threshold: number
): Promise<any[]> {
  try {
    // Query Supabase vector store
    // This assumes you have a `documents` table with a `embedding` column (vector)
    
    const { data, error } = await supabase.rpc('match_documents', {
      query_embedding: embedding,
      match_threshold: threshold,
      match_count: topK,
    });
    
    if (error) {
      console.error("Vector search error:", error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error("Vector search failed:", error);
    return [];
  }
}

/**
 * Rerank documents using cross-encoder
 */
async function rerankDocuments(
  query: string,
  documents: any[]
): Promise<any[]> {
  if (documents.length === 0) return [];
  
  try {
    // Score each document with cross-encoder
    const scored = await Promise.all(
      documents.map(async (doc) => {
        const result = await runInference({
          modelId: "minilm-l12-v2",
          input: `Query: ${query}\n\nDocument: ${doc.content || doc.text}`,
          options: {},
        });
        
        const score = Array.isArray(result.output) ? result.output[0] : 0.5;
        
        return {
          ...doc,
          rerankScore: score,
        };
      })
    );
    
    // Sort by rerank score
    return scored.sort((a, b) => b.rerankScore - a.rerankScore);
  } catch (error) {
    console.error("Reranking failed, returning original order");
    return documents;
  }
}

/**
 * Build enriched context from documents
 */
function buildEnrichedContext(query: string, documents: any[]): string {
  if (documents.length === 0) {
    return `Query: ${query}\n\nNo relevant context found.`;
  }
  
  const contextParts = documents
    .slice(0, 3) // Top 3 most relevant
    .map((doc, i) => {
      const content = doc.content || doc.text || "";
      const score = doc.rerankScore || doc.similarity || 0;
      return `[${i + 1}] (relevance: ${(score * 100).toFixed(0)}%)\n${content.substring(0, 300)}...`;
    });
  
  return `Query: ${query}\n\nRelevant Context:\n\n${contextParts.join("\n\n")}`;
}

/**
 * Determine routing recommendation
 */
function determineRouting(input: string, context: string): string {
  const inputLength = input.length;
  const contextAvailable = context.length > 100;
  const hasNumbers = /\d{3,}/.test(input);
  const hasQuestions = (input.match(/\?/g) || []).length;
  
  // Simple routing logic
  if (inputLength < 100 && contextAvailable) {
    return "llama-3.2-1b"; // Local model with context
  } else if (inputLength < 300 && !hasNumbers) {
    return "deepseek-v3"; // Medium complexity
  } else if (hasQuestions > 2 || inputLength > 300) {
    return "claude-3.5-sonnet"; // High complexity
  }
  
  return "llama-3.2-1b"; // Default to local
}

/**
 * Log pipeline execution
 */
async function logPipelineExecution(data: any): Promise<void> {
  try {
    await supabase
      .from("pipeline_logs")
      .insert({
        ...data,
        timestamp: new Date().toISOString(),
      });
  } catch (error) {
    console.error("Failed to log pipeline execution:", error);
  }
}

/**
 * Store embeddings in Supabase
 */
export async function storeEmbedding(
  content: string,
  embedding: number[],
  metadata: Record<string, any> = {}
): Promise<{ success: boolean; id?: string }> {
  try {
    const { data, error } = await supabase
      .from("embeddings")
      .insert({
        content,
        embedding,
        metadata,
        created_at: new Date().toISOString(),
      })
      .select();
    
    if (error) {
      console.error("Failed to store embedding:", error);
      return { success: false };
    }
    
    return { success: true, id: data[0]?.id };
  } catch (error) {
    console.error("Embedding storage error:", error);
    return { success: false };
  }
}
