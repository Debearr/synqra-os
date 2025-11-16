/**
 * ============================================================
 * MODEL REGISTRY - HUGGINGFACE STACK
 * ============================================================
 * Central registry of all available models (local + API)
 * DeepSeek-validated optimal configuration
 */

import { ModelConfig } from "./types";

/**
 * VALIDATED MODEL STACK
 * Cost-optimized, production-ready models
 */
export const MODEL_REGISTRY: Record<string, ModelConfig> = {
  // ========================================
  // EMBEDDINGS
  // ========================================
  "bge-small-en-v1.5": {
    id: "bge-small-en-v1.5",
    name: "BGE Small English v1.5",
    type: "embeddings",
    size: "small",
    backend: "onnx",
    memoryMB: 120,
    cpuIntensive: false,
    gpuOptional: true,
    preload: true,
    lazyLoad: false,
    cacheResults: true,
    huggingFaceId: "BAAI/bge-small-en-v1.5",
    localPath: ".model_cache/bge-small-en-v1.5",
    costPerInference: 0.0,
    avgLatencyMs: 15,
    maxBatchSize: 32,
  },

  "minilm-l6-v2": {
    id: "minilm-l6-v2",
    name: "MiniLM L6 v2",
    type: "embeddings",
    size: "tiny",
    backend: "onnx",
    memoryMB: 80,
    cpuIntensive: false,
    gpuOptional: false,
    preload: true,
    lazyLoad: false,
    cacheResults: true,
    huggingFaceId: "sentence-transformers/all-MiniLM-L6-v2",
    localPath: ".model_cache/minilm-l6-v2",
    costPerInference: 0.0,
    avgLatencyMs: 8,
    maxBatchSize: 64,
  },

  "minilm-l12-v2": {
    id: "minilm-l12-v2",
    name: "MiniLM L12 v2 (Reranker)",
    type: "reranker",
    size: "small",
    backend: "onnx",
    memoryMB: 120,
    cpuIntensive: false,
    gpuOptional: false,
    preload: false,
    lazyLoad: true,
    cacheResults: true,
    huggingFaceId: "sentence-transformers/all-MiniLM-L12-v2",
    localPath: ".model_cache/minilm-l12-v2",
    costPerInference: 0.0,
    avgLatencyMs: 12,
    maxBatchSize: 32,
  },

  // ========================================
  // SENTIMENT & TOXICITY
  // ========================================
  "distilbert-sentiment": {
    id: "distilbert-sentiment",
    name: "DistilBERT Sentiment",
    type: "sentiment",
    size: "small",
    backend: "onnx",
    memoryMB: 250,
    cpuIntensive: false,
    gpuOptional: false,
    preload: true,
    lazyLoad: false,
    cacheResults: true,
    huggingFaceId: "distilbert-base-uncased-finetuned-sst-2-english",
    localPath: ".model_cache/distilbert-sentiment",
    costPerInference: 0.0,
    avgLatencyMs: 20,
    maxBatchSize: 16,
  },

  "roberta-toxicity": {
    id: "roberta-toxicity",
    name: "RoBERTa Toxicity Detector",
    type: "toxicity",
    size: "base",
    backend: "onnx",
    memoryMB: 300,
    cpuIntensive: false,
    gpuOptional: false,
    preload: true,
    lazyLoad: false,
    cacheResults: true,
    huggingFaceId: "unitary/toxic-bert",
    localPath: ".model_cache/roberta-toxicity",
    costPerInference: 0.0,
    avgLatencyMs: 25,
    maxBatchSize: 16,
  },

  // ========================================
  // LOCAL LLM (80% OF QUERIES)
  // ========================================
  "llama-3.2-1b": {
    id: "llama-3.2-1b",
    name: "Llama 3.2 1B",
    type: "llm",
    size: "small",
    backend: "python-service",
    memoryMB: 2048,
    cpuIntensive: true,
    gpuOptional: true,
    preload: false,
    lazyLoad: true,
    cacheResults: true,
    huggingFaceId: "meta-llama/Llama-3.2-1B",
    localPath: ".model_cache/llama-3.2-1b",
    costPerInference: 0.0,
    avgLatencyMs: 800,
    maxBatchSize: 1,
  },

  // ========================================
  // VISION & BRAND
  // ========================================
  "openclip-vit-b32": {
    id: "openclip-vit-b32",
    name: "OpenCLIP ViT-B/32",
    type: "vision",
    size: "base",
    backend: "python-service",
    memoryMB: 600,
    cpuIntensive: true,
    gpuOptional: true,
    preload: false,
    lazyLoad: true,
    cacheResults: true,
    huggingFaceId: "laion/CLIP-ViT-B-32-laion2B-s34B-b79K",
    localPath: ".model_cache/openclip-vit-b32",
    costPerInference: 0.0,
    avgLatencyMs: 150,
    maxBatchSize: 8,
  },

  // ========================================
  // OCR & DOCUMENT
  // ========================================
  "paddle-ocr": {
    id: "paddle-ocr",
    name: "PaddleOCR",
    type: "ocr",
    size: "small",
    backend: "python-service",
    memoryMB: 400,
    cpuIntensive: true,
    gpuOptional: true,
    preload: false,
    lazyLoad: true,
    cacheResults: true,
    huggingFaceId: "PaddlePaddle/PaddleOCR",
    localPath: ".model_cache/paddle-ocr",
    costPerInference: 0.0,
    avgLatencyMs: 200,
    maxBatchSize: 4,
  },

  "donut": {
    id: "donut",
    name: "Donut Document Understanding",
    type: "document",
    size: "base",
    backend: "python-service",
    memoryMB: 800,
    cpuIntensive: true,
    gpuOptional: true,
    preload: false,
    lazyLoad: true,
    cacheResults: true,
    huggingFaceId: "naver-clova-ix/donut-base",
    localPath: ".model_cache/donut",
    costPerInference: 0.0,
    avgLatencyMs: 400,
    maxBatchSize: 1,
  },

  // ========================================
  // AUDIO
  // ========================================
  "faster-whisper": {
    id: "faster-whisper",
    name: "Faster Whisper",
    type: "audio",
    size: "base",
    backend: "python-service",
    memoryMB: 500,
    cpuIntensive: true,
    gpuOptional: true,
    preload: false,
    lazyLoad: true,
    cacheResults: true,
    huggingFaceId: "guillaumekln/faster-whisper-base",
    localPath: ".model_cache/faster-whisper",
    costPerInference: 0.0,
    avgLatencyMs: 1000,
    maxBatchSize: 1,
  },

  // ========================================
  // PREMIUM API MODELS (FALLBACK)
  // ========================================
  "claude-3.5-sonnet": {
    id: "claude-3.5-sonnet",
    name: "Claude 3.5 Sonnet",
    type: "llm",
    size: "large",
    backend: "api",
    memoryMB: 0,
    cpuIntensive: false,
    gpuOptional: false,
    preload: false,
    lazyLoad: false,
    cacheResults: false,
    costPerInference: 0.015,
    avgLatencyMs: 2000,
    maxBatchSize: 1,
  },

  "deepseek-v3": {
    id: "deepseek-v3",
    name: "DeepSeek V3",
    type: "llm",
    size: "large",
    backend: "api",
    memoryMB: 0,
    cpuIntensive: false,
    gpuOptional: false,
    preload: false,
    lazyLoad: false,
    cacheResults: false,
    costPerInference: 0.008,
    avgLatencyMs: 1500,
    maxBatchSize: 1,
  },

  "gpt-4o": {
    id: "gpt-4o",
    name: "GPT-4o",
    type: "llm",
    size: "large",
    backend: "api",
    memoryMB: 0,
    cpuIntensive: false,
    gpuOptional: false,
    preload: false,
    lazyLoad: false,
    cacheResults: false,
    costPerInference: 0.02,
    avgLatencyMs: 2500,
    maxBatchSize: 1,
  },
};

/**
 * Get model configuration by ID
 */
export function getModelConfig(modelId: string): ModelConfig | null {
  return MODEL_REGISTRY[modelId] || null;
}

/**
 * Get all models of a specific type
 */
export function getModelsByType(type: string): ModelConfig[] {
  return Object.values(MODEL_REGISTRY).filter((model) => model.type === type);
}

/**
 * Get preload models (loaded on startup)
 */
export function getPreloadModels(): ModelConfig[] {
  return Object.values(MODEL_REGISTRY).filter((model) => model.preload);
}

/**
 * Get local models (zero cost)
 */
export function getLocalModels(): ModelConfig[] {
  return Object.values(MODEL_REGISTRY).filter(
    (model) => model.backend !== "api"
  );
}

/**
 * Calculate total memory requirement for preload models
 */
export function calculatePreloadMemory(): number {
  return getPreloadModels().reduce((sum, model) => sum + model.memoryMB, 0);
}

/**
 * Verify resource availability
 */
export function verifyResourceAvailability(availableMemoryMB: number): {
  canPreload: boolean;
  requiredMemory: number;
  availableMemory: number;
  recommendedModels: string[];
} {
  const requiredMemory = calculatePreloadMemory();
  const canPreload = availableMemoryMB >= requiredMemory;

  const recommendedModels = canPreload
    ? getPreloadModels().map((m) => m.id)
    : getPreloadModels()
        .filter((m) => m.memoryMB <= availableMemoryMB * 0.7)
        .map((m) => m.id);

  return {
    canPreload,
    requiredMemory,
    availableMemory: availableMemoryMB,
    recommendedModels,
  };
}
