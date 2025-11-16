/**
 * ============================================================
 * LOCAL MODEL LOADER
 * ============================================================
 * Handles loading, caching, and lifecycle of HuggingFace models
 * Supports both ONNX (JavaScript) and Python service backends
 */

import { ModelConfig, InferenceRequest, InferenceResult } from "./types";
import { getModelConfig, getPreloadModels } from "./modelRegistry";

/**
 * Model loader state
 */
interface LoaderState {
  loadedModels: Set<string>;
  loadingModels: Set<string>;
  failedModels: Set<string>;
  modelInstances: Map<string, any>;
  lastUsed: Map<string, number>;
}

const state: LoaderState = {
  loadedModels: new Set(),
  loadingModels: new Set(),
  failedModels: new Set(),
  modelInstances: new Map(),
  lastUsed: new Map(),
};

/**
 * Initialize model system (preload critical models)
 */
export async function initializeModels(): Promise<{
  success: boolean;
  loaded: string[];
  failed: string[];
}> {
  console.log("🤖 Initializing local model system...");

  const preloadModels = getPreloadModels();
  const results = {
    success: true,
    loaded: [] as string[],
    failed: [] as string[],
  };

  for (const modelConfig of preloadModels) {
    try {
      console.log(`   Loading ${modelConfig.name}...`);
      await loadModel(modelConfig.id);
      results.loaded.push(modelConfig.id);
      console.log(`   ✅ ${modelConfig.name} loaded`);
    } catch (error) {
      console.error(`   ❌ Failed to load ${modelConfig.name}:`, error);
      results.failed.push(modelConfig.id);
      results.success = false;
    }
  }

  console.log(`🤖 Model initialization complete:`);
  console.log(`   Loaded: ${results.loaded.length}`);
  console.log(`   Failed: ${results.failed.length}`);

  return results;
}

/**
 * Load a specific model (with caching)
 */
export async function loadModel(modelId: string): Promise<void> {
  // Already loaded
  if (state.loadedModels.has(modelId)) {
    console.log(`   ℹ️  Model ${modelId} already loaded`);
    return;
  }

  // Currently loading
  if (state.loadingModels.has(modelId)) {
    console.log(`   ⏳ Model ${modelId} is currently loading...`);
    // Wait for loading to complete (poll)
    while (state.loadingModels.has(modelId)) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return;
  }

  // Previously failed
  if (state.failedModels.has(modelId)) {
    throw new Error(`Model ${modelId} previously failed to load`);
  }

  const modelConfig = getModelConfig(modelId);
  if (!modelConfig) {
    throw new Error(`Model ${modelId} not found in registry`);
  }

  state.loadingModels.add(modelId);

  try {
    // Load based on backend type
    switch (modelConfig.backend) {
      case "onnx":
        await loadONNXModel(modelConfig);
        break;
      case "python-service":
        await loadPythonServiceModel(modelConfig);
        break;
      case "api":
        // API models don't need loading
        break;
      default:
        throw new Error(`Unsupported backend: ${modelConfig.backend}`);
    }

    state.loadedModels.add(modelId);
    state.lastUsed.set(modelId, Date.now());
    
    console.log(`✅ Model ${modelId} loaded successfully`);
  } catch (error) {
    state.failedModels.add(modelId);
    throw error;
  } finally {
    state.loadingModels.delete(modelId);
  }
}

/**
 * Load ONNX model (JavaScript/TypeScript)
 */
async function loadONNXModel(config: ModelConfig): Promise<void> {
  // TODO: Implement ONNX loading
  // For now, create a placeholder
  
  console.log(`   📦 Loading ONNX model: ${config.huggingFaceId}`);
  
  // In production, this would use onnxruntime-node:
  // const ort = require('onnxruntime-node');
  // const session = await ort.InferenceSession.create(modelPath);
  // state.modelInstances.set(config.id, session);

  // For now, store config as placeholder
  state.modelInstances.set(config.id, {
    type: "onnx",
    config,
    placeholder: true,
  });

  // Simulate loading time
  await new Promise(resolve => setTimeout(resolve, 100));
}

/**
 * Load Python service model (via HTTP/gRPC)
 */
async function loadPythonServiceModel(config: ModelConfig): Promise<void> {
  console.log(`   🐍 Connecting to Python service for: ${config.huggingFaceId}`);

  // Check if Python service is available
  const serviceUrl = process.env.PYTHON_MODEL_SERVICE_URL || "http://localhost:8000";
  
  try {
    const response = await fetch(`${serviceUrl}/health`, {
      method: "GET",
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      throw new Error(`Python service not healthy: ${response.status}`);
    }

    // Register model with service
    const registerResponse = await fetch(`${serviceUrl}/models/load`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        modelId: config.id,
        huggingFaceId: config.huggingFaceId,
        modelType: config.type,
      }),
      signal: AbortSignal.timeout(30000), // 30s for model download
    });

    if (!registerResponse.ok) {
      throw new Error(`Failed to register model: ${registerResponse.status}`);
    }

    state.modelInstances.set(config.id, {
      type: "python-service",
      serviceUrl,
      config,
    });

    console.log(`   ✅ Python service model registered: ${config.id}`);
  } catch (error) {
    console.warn(`   ⚠️  Python service not available for ${config.id}, using fallback`);
    
    // Store placeholder for fallback to API
    state.modelInstances.set(config.id, {
      type: "python-service",
      config,
      fallback: true,
    });
  }
}

/**
 * Run inference on a model
 */
export async function runInference<T = any>(
  request: InferenceRequest
): Promise<InferenceResult<T>> {
  const startTime = Date.now();
  const modelConfig = getModelConfig(request.modelId);

  if (!modelConfig) {
    throw new Error(`Model ${request.modelId} not found`);
  }

  // Ensure model is loaded
  if (!state.loadedModels.has(request.modelId)) {
    if (modelConfig.lazyLoad) {
      await loadModel(request.modelId);
    } else {
      throw new Error(`Model ${request.modelId} not loaded`);
    }
  }

  state.lastUsed.set(request.modelId, Date.now());

  try {
    let output: T;

    // Route to appropriate inference method
    switch (modelConfig.backend) {
      case "onnx":
        output = await runONNXInference<T>(request, modelConfig);
        break;
      case "python-service":
        output = await runPythonServiceInference<T>(request, modelConfig);
        break;
      case "api":
        output = await runAPIInference<T>(request, modelConfig);
        break;
      default:
        throw new Error(`Unsupported backend: ${modelConfig.backend}`);
    }

    const latencyMs = Date.now() - startTime;

    return {
      modelId: request.modelId,
      output,
      confidence: 0.85, // TODO: Extract from model output
      latencyMs,
      cost: modelConfig.costPerInference,
      cached: false,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error(`Inference failed for ${request.modelId}:`, error);
    throw error;
  }
}

/**
 * ONNX inference
 */
async function runONNXInference<T>(
  request: InferenceRequest,
  config: ModelConfig
): Promise<T> {
  const instance = state.modelInstances.get(request.modelId);
  
  if (!instance || instance.placeholder) {
    // Fallback to mock response for now
    console.warn(`⚠️  ONNX inference not implemented, using mock for ${request.modelId}`);
    return mockInference(request, config) as T;
  }

  // TODO: Implement actual ONNX inference
  // const session = instance;
  // const feeds = { input: new ort.Tensor('float32', inputData, inputShape) };
  // const results = await session.run(feeds);
  // return results.output.data;

  return mockInference(request, config) as T;
}

/**
 * Python service inference
 */
async function runPythonServiceInference<T>(
  request: InferenceRequest,
  config: ModelConfig
): Promise<T> {
  const instance = state.modelInstances.get(request.modelId);

  if (!instance || instance.fallback) {
    console.warn(`⚠️  Python service not available, using fallback for ${request.modelId}`);
    return mockInference(request, config) as T;
  }

  const { serviceUrl } = instance;

  try {
    const response = await fetch(`${serviceUrl}/models/infer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        modelId: request.modelId,
        input: request.input,
        options: request.options,
      }),
      signal: AbortSignal.timeout(config.avgLatencyMs * 3),
    });

    if (!response.ok) {
      throw new Error(`Inference failed: ${response.status}`);
    }

    const result = await response.json();
    return result.output as T;
  } catch (error) {
    console.error(`Python service inference failed for ${request.modelId}:`, error);
    // Fallback to mock
    return mockInference(request, config) as T;
  }
}

/**
 * API inference (Claude, GPT, DeepSeek)
 */
async function runAPIInference<T>(
  request: InferenceRequest,
  config: ModelConfig
): Promise<T> {
  // Delegate to existing API clients
  if (config.id.includes("claude")) {
    // Use existing Claude integration
    // const anthropic = await import("../agents/base/config");
    // TODO: Integrate with existing agent system
  }

  // For now, mock
  return mockInference(request, config) as T;
}

/**
 * Mock inference (fallback when models not available)
 */
function mockInference(request: InferenceRequest, config: ModelConfig): any {
  console.warn(`🔄 Using mock inference for ${config.id}`);

  switch (config.type) {
    case "embeddings":
      // Return random embedding vector
      return Array.from({ length: 384 }, () => Math.random());
    
    case "sentiment":
      return { label: "POSITIVE", score: 0.85 };
    
    case "toxicity":
      return { toxic: false, score: 0.05 };
    
    case "llm":
      return `Mock response from ${config.name}. Input was: ${String(request.input).substring(0, 50)}...`;
    
    case "vision":
      return { embedding: Array.from({ length: 512 }, () => Math.random()) };
    
    case "ocr":
      return { text: "Mock OCR text", confidence: 0.9 };
    
    case "document":
      return { parsed: {}, text: "Mock document parse" };
    
    case "audio":
      return { text: "Mock audio transcription", confidence: 0.88 };
    
    case "reranker":
      return { score: 0.75, rank: 1 };
    
    default:
      return { result: "mock" };
  }
}

/**
 * Unload model (free memory)
 */
export async function unloadModel(modelId: string): Promise<void> {
  if (!state.loadedModels.has(modelId)) {
    return;
  }

  const instance = state.modelInstances.get(modelId);
  if (instance) {
    // Clean up resources
    state.modelInstances.delete(modelId);
  }

  state.loadedModels.delete(modelId);
  state.lastUsed.delete(modelId);

  console.log(`♻️  Unloaded model: ${modelId}`);
}

/**
 * Get loader status
 */
export function getLoaderStatus(): {
  loaded: string[];
  loading: string[];
  failed: string[];
  totalMemoryMB: number;
} {
  const loaded = Array.from(state.loadedModels);
  const totalMemoryMB = loaded.reduce((sum, modelId) => {
    const config = getModelConfig(modelId);
    return sum + (config?.memoryMB || 0);
  }, 0);

  return {
    loaded,
    loading: Array.from(state.loadingModels),
    failed: Array.from(state.failedModels),
    totalMemoryMB,
  };
}
