/**
 * ============================================================
 * PROCESSING PIPELINE - DEEPSEEK ARCHITECTURE
 * ============================================================
 * Multi-modal input processing with intelligent routing
 * Text → Image → Audio → Document pathways
 */

import { InferenceRequest, InferenceResult } from "./types";
import { runInference } from "./localModelLoader";

export type InputType = "text" | "image" | "audio" | "document";

/**
 * Detect input type
 */
export async function detectInputType(input: string | Buffer): Promise<InputType> {
  // Use MiniLM-L6-v2 for type detection
  if (Buffer.isBuffer(input)) {
    // Check file signature
    const signature = input.slice(0, 4).toString('hex');
    
    // Image signatures
    if (signature.startsWith('ffd8ff') || // JPEG
        signature === '89504e47' ||       // PNG
        signature.startsWith('474946')) {  // GIF
      return "image";
    }
    
    // Audio signatures
    if (signature === '52494646' || // WAV
        signature.startsWith('4944') || // MP3
        signature === '664c6143') {     // FLAC
      return "audio";
    }
    
    // PDF signature
    if (signature === '25504446') {
      return "document";
    }
    
    return "document"; // Default for unknown binary
  }
  
  // String input - check for URLs or base64
  const str = input.toString();
  
  if (str.match(/^data:image\//)) return "image";
  if (str.match(/^data:audio\//)) return "audio";
  if (str.match(/\.(jpg|jpeg|png|gif|webp)$/i)) return "image";
  if (str.match(/\.(mp3|wav|m4a|flac)$/i)) return "audio";
  if (str.match(/\.(pdf|doc|docx)$/i)) return "document";
  
  return "text";
}

/**
 * Process text input
 */
export async function processText(input: string): Promise<{
  clean: string;
  toxicity: number;
  sentiment: number;
  embeddings: number[];
}> {
  console.log("📝 Processing text input...");
  
  // Step 1: Toxicity check (RoBERTa Toxicity)
  const toxicityResult = await runInference({
    modelId: "roberta-toxicity",
    input,
    options: {},
  });
  
  const toxicityScore = Array.isArray(toxicityResult.output) 
    ? toxicityResult.output[0] 
    : 0;
  
  console.log(`   🛡️  Toxicity: ${(toxicityScore * 100).toFixed(1)}%`);
  
  // Step 2: Sentiment analysis (DistilBERT)
  const sentimentResult = await runInference({
    modelId: "distilbert-sentiment",
    input,
    options: {},
  });
  
  const sentimentScore = Array.isArray(sentimentResult.output)
    ? sentimentResult.output[0]
    : 0.5;
  
  console.log(`   😊 Sentiment: ${(sentimentScore * 100).toFixed(1)}%`);
  
  // Step 3: Generate embeddings (BGE-small-en-v1.5)
  const embeddingResult = await runInference({
    modelId: "bge-small-en-v1.5",
    input,
    options: {},
  });
  
  const embeddings = Array.isArray(embeddingResult.output)
    ? embeddingResult.output
    : [];
  
  console.log(`   🔢 Embeddings: ${embeddings.length}D vector`);
  
  return {
    clean: input,
    toxicity: toxicityScore,
    sentiment: sentimentScore,
    embeddings,
  };
}

/**
 * Process image input
 */
export async function processImage(input: Buffer | string): Promise<{
  styleEmbedding: number[];
  extractedText?: string;
  brandScore?: number;
}> {
  console.log("🖼️  Processing image input...");
  
  // Step 1: Extract style features (OpenCLIP ViT-B/32)
  const clipResult = await runInference({
    modelId: "openclip-vit-b-32",
    input,
    options: {},
  });
  
  const styleEmbedding = Array.isArray(clipResult.output)
    ? clipResult.output
    : [];
  
  console.log(`   🎨 Style embedding: ${styleEmbedding.length}D`);
  
  // Step 2: OCR if needed (PaddleOCR)
  let extractedText: string | undefined;
  try {
    const ocrResult = await runInference({
      modelId: "paddle-ocr",
      input,
      options: {},
    });
    
    extractedText = String(ocrResult.output);
    console.log(`   📄 OCR extracted: ${extractedText.substring(0, 50)}...`);
  } catch (error) {
    console.log(`   ⚠️  OCR skipped (no text detected)`);
  }
  
  return {
    styleEmbedding,
    extractedText,
  };
}

/**
 * Process audio input
 */
export async function processAudio(input: Buffer | string): Promise<{
  transcription: string;
  textProcessing: Awaited<ReturnType<typeof processText>>;
}> {
  console.log("🎵 Processing audio input...");
  
  // Step 1: Transcribe (Faster-Whisper)
  const whisperResult = await runInference({
    modelId: "faster-whisper",
    input,
    options: {},
  });
  
  const transcription = String(whisperResult.output);
  console.log(`   🗣️  Transcription: "${transcription.substring(0, 100)}..."`);
  
  // Step 2: Process as text
  const textProcessing = await processText(transcription);
  
  return {
    transcription,
    textProcessing,
  };
}

/**
 * Process document input
 */
export async function processDocument(input: Buffer | string): Promise<{
  structuredText: string;
  textProcessing: Awaited<ReturnType<typeof processText>>;
}> {
  console.log("📄 Processing document input...");
  
  // Step 1: Extract structure (Donut)
  const donutResult = await runInference({
    modelId: "donut",
    input,
    options: {},
  });
  
  const structuredText = String(donutResult.output);
  console.log(`   📋 Structured extraction: ${structuredText.length} chars`);
  
  // Step 2: Process as text
  const textProcessing = await processText(structuredText);
  
  return {
    structuredText,
    textProcessing,
  };
}

/**
 * Main processing pipeline entry point
 */
export async function processInput(input: string | Buffer): Promise<{
  type: InputType;
  processed: any;
  embeddings: number[];
  metadata: Record<string, any>;
}> {
  console.log("🔄 Starting input processing pipeline...");
  
  // Detect input type
  const type = await detectInputType(input);
  console.log(`   📍 Detected type: ${type}`);
  
  let processed: any;
  let embeddings: number[] = [];
  let metadata: Record<string, any> = {};
  
  // Route to appropriate processor
  switch (type) {
    case "text":
      processed = await processText(input.toString());
      embeddings = processed.embeddings;
      metadata = {
        toxicity: processed.toxicity,
        sentiment: processed.sentiment,
      };
      break;
      
    case "image":
      processed = await processImage(input);
      embeddings = processed.styleEmbedding;
      metadata = {
        hasText: !!processed.extractedText,
        textLength: processed.extractedText?.length || 0,
      };
      break;
      
    case "audio":
      processed = await processAudio(input);
      embeddings = processed.textProcessing.embeddings;
      metadata = {
        transcriptionLength: processed.transcription.length,
        toxicity: processed.textProcessing.toxicity,
        sentiment: processed.textProcessing.sentiment,
      };
      break;
      
    case "document":
      processed = await processDocument(input);
      embeddings = processed.textProcessing.embeddings;
      metadata = {
        structuredLength: processed.structuredText.length,
        toxicity: processed.textProcessing.toxicity,
        sentiment: processed.textProcessing.sentiment,
      };
      break;
  }
  
  console.log("✅ Processing pipeline complete");
  
  return {
    type,
    processed,
    embeddings,
    metadata,
  };
}
