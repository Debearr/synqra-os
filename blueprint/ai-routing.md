# 🤖 AI Routing Architecture

**Version**: 1.0.0  
**Target**: 80% Local Models / 20% External APIs  
**Cost Goal**: <$0.01 per user interaction  
**Status**: Production Standard

---

## 🎯 Overview

The NØID Labs AI routing system intelligently distributes inference tasks across local models (DeepSeek/Hugging Face) and external APIs (Anthropic Claude) to optimize for:
- **Cost** (80% reduction target)
- **Speed** (lazy loading + caching)
- **Quality** (fallback chains)
- **Reliability** (self-healing)

---

## 🏗️ Architecture

### The Routing Pipeline

```
User Request
    ↓
[1] Input Validation
    ↓
[2] Task Classification
    ↓
[3] Model Selection (Router)
    ├─ Simple task → Local (DeepSeek)
    ├─ Complex task → External (Claude)
    └─ Critical task → Hybrid (both + vote)
    ↓
[4] Inference Execution
    ├─ Lazy Loading
    ├─ Caching
    └─ Timeout Handling
    ↓
[5] Brand Alignment Check (OpenCLIP)
    ↓
[6] Safety Guardrails
    ├─ Toxicity scan
    ├─ Hallucination check
    └─ Confidence threshold
    ↓
[7] Fallback Logic (if failed)
    ├─ Retry with different model
    ├─ Escalate to external API
    └─ Return cached response
    ↓
[8] Response + Logging
    ├─ Performance metrics
    ├─ Cost tracking
    └─ Quality score
```

---

## 📦 Model Stack

### Local Models (80% of Inference)

#### 1. DeepSeek-Coder-6.7B (Text Generation)
```typescript
Model: deepseek-ai/deepseek-coder-6.7b-instruct
Purpose: Code generation, technical content
Quantization: 4-bit (reduces memory by 75%)
Cache: On-disk + in-memory
Speed: ~2-5s per inference
Cost: $0 (free after download)
```

#### 2. Sentence-Transformers (Embeddings)
```typescript
Model: sentence-transformers/all-MiniLM-L6-v2
Purpose: Semantic search, similarity, RAG
Quantization: FP16
Cache: Redis (if available) or in-memory
Speed: ~50-200ms per embedding
Cost: $0
```

#### 3. OpenCLIP (Brand Alignment)
```typescript
Model: laion/CLIP-ViT-B-32-laion2B-s34B-b79K
Purpose: Brand visual + text similarity
Quantization: FP16
Cache: Image embeddings stored
Speed: ~100-300ms per check
Cost: $0
```

#### 4. Toxicity Classifier (Safety)
```typescript
Model: unitary/toxic-bert
Purpose: Content safety, moderation
Quantization: FP16
Cache: High-confidence results
Speed: ~50-150ms
Cost: $0
```

### External APIs (20% of Inference)

#### 1. Anthropic Claude Sonnet (Complex Reasoning)
```typescript
Model: claude-3-sonnet-20240229
Purpose: Complex reasoning, long-form content, critical decisions
Cost: ~$0.003 per 1K input tokens, $0.015 per 1K output
Speed: 1-5s depending on length
Usage: Only when local fails or task complexity > threshold
```

#### 2. OpenAI GPT-4 (Fallback)
```typescript
Model: gpt-4-turbo
Purpose: Backup for Claude failures
Cost: ~$0.01 per 1K input tokens, $0.03 per 1K output
Speed: 2-8s
Usage: Emergency fallback only
```

---

## 🔀 Task Classification & Routing

### Classification Logic

```typescript
interface TaskClassification {
  complexity: 'simple' | 'medium' | 'complex';
  domain: 'code' | 'content' | 'reasoning' | 'creative';
  length: number; // input tokens
  criticality: 'low' | 'medium' | 'high';
}

function classifyTask(input: string): TaskClassification {
  const tokens = estimateTokens(input);
  
  // Simple: Short, factual, retrieval-based
  if (tokens < 100 && isFactualQuery(input)) {
    return { complexity: 'simple', domain: 'content', length: tokens, criticality: 'low' };
  }
  
  // Medium: Moderate reasoning, code generation
  if (tokens < 500 && (isCodeTask(input) || isContentGeneration(input))) {
    return { complexity: 'medium', domain: determineD domain(input), length: tokens, criticality: 'medium' };
  }
  
  // Complex: Long-form, multi-step reasoning, critical decisions
  return { complexity: 'complex', domain: 'reasoning', length: tokens, criticality: 'high' };
}
```

### Routing Decision Tree

```typescript
function routeToModel(task: TaskClassification): ModelChoice {
  // Rule 1: Simple tasks → Always local
  if (task.complexity === 'simple') {
    return { model: 'deepseek', fallback: 'claude' };
  }
  
  // Rule 2: Code tasks → Local first (DeepSeek excels at code)
  if (task.domain === 'code' && task.complexity === 'medium') {
    return { model: 'deepseek', fallback: 'claude' };
  }
  
  // Rule 3: Complex reasoning → External (Claude)
  if (task.complexity === 'complex' || task.criticality === 'high') {
    return { model: 'claude', fallback: 'gpt4' };
  }
  
  // Rule 4: Medium tasks → Hybrid (try local, escalate if confidence low)
  return { model: 'deepseek', fallback: 'claude', threshold: 0.7 };
}
```

---

## ⚡ Lazy Loading & Caching Strategy

### Lazy Loading

**Models load ONLY when first needed, not at startup.**

```typescript
class ModelManager {
  private models: Map<string, any> = new Map();
  private loading: Map<string, Promise<any>> = new Map();
  
  async loadModel(modelName: string): Promise<any> {
    // Return cached model if already loaded
    if (this.models.has(modelName)) {
      return this.models.get(modelName);
    }
    
    // Return in-progress load if already loading
    if (this.loading.has(modelName)) {
      return await this.loading.get(modelName);
    }
    
    // Start loading
    console.log(`🔄 Loading model: ${modelName}`);
    const loadPromise = this.loadModelFromDisk(modelName);
    this.loading.set(modelName, loadPromise);
    
    const model = await loadPromise;
    this.models.set(modelName, model);
    this.loading.delete(modelName);
    
    console.log(`✅ Model loaded: ${modelName}`);
    return model;
  }
}
```

### Multi-Layer Caching

```typescript
interface CacheStrategy {
  // Layer 1: In-Memory (Fastest, 100ms expiry for hot paths)
  inMemory: Map<string, CachedResult>;
  
  // Layer 2: Redis (Fast, 1 hour expiry)
  redis?: RedisClient;
  
  // Layer 3: Supabase (Persistent, 24 hour expiry)
  database: SupabaseClient;
}

async function getCachedOrInfer(
  input: string,
  modelFn: () => Promise<string>
): Promise<string> {
  const cacheKey = hashInput(input);
  
  // Check in-memory
  const memResult = inMemoryCache.get(cacheKey);
  if (memResult && !isExpired(memResult)) {
    logCacheHit('memory');
    return memResult.value;
  }
  
  // Check Redis
  if (redis) {
    const redisResult = await redis.get(cacheKey);
    if (redisResult) {
      logCacheHit('redis');
      inMemoryCache.set(cacheKey, redisResult); // Promote to memory
      return redisResult;
    }
  }
  
  // Check database
  const dbResult = await supabase
    .from('ai_cache')
    .select('output')
    .eq('input_hash', cacheKey)
    .single();
    
  if (dbResult.data) {
    logCacheHit('database');
    return dbResult.data.output;
  }
  
  // No cache → Perform inference
  logCacheMiss();
  const result = await modelFn();
  
  // Store in all layers
  inMemoryCache.set(cacheKey, result);
  if (redis) await redis.set(cacheKey, result, 'EX', 3600);
  await supabase.from('ai_cache').insert({ input_hash: cacheKey, output: result });
  
  return result;
}
```

---

## 🛡️ Guardrails

### 1. Brand Alignment Check (OpenCLIP)

```typescript
async function checkBrandAlignment(
  generatedText: string,
  brandGuidelines: string[]
): Promise<{ aligned: boolean; score: number }> {
  const model = await modelManager.loadModel('openclip');
  
  // Compute embeddings
  const textEmbedding = await model.encodeText(generatedText);
  const brandEmbeddings = await Promise.all(
    brandGuidelines.map(g => model.encodeText(g))
  );
  
  // Cosine similarity
  const similarities = brandEmbeddings.map(b => cosineSimilarity(textEmbedding, b));
  const maxScore = Math.max(...similarities);
  
  return {
    aligned: maxScore > 0.7, // Threshold
    score: maxScore
  };
}
```

### 2. Toxicity & Safety Scanning

```typescript
async function checkSafety(text: string): Promise<SafetyReport> {
  const toxicityModel = await modelManager.loadModel('toxic-bert');
  
  const result = await toxicityModel.predict(text);
  
  return {
    isSafe: result.toxicity < 0.3,
    toxicity: result.toxicity,
    categories: {
      toxic: result.toxic,
      severeToxic: result.severe_toxic,
      obscene: result.obscene,
      threat: result.threat,
      insult: result.insult,
      identityHate: result.identity_hate
    },
    recommendation: result.toxicity > 0.5 ? 'block' : 'allow'
  };
}
```

### 3. Hallucination Detection

```typescript
async function detectHallucination(
  input: string,
  output: string,
  context?: string[]
): Promise<{ isHallucination: boolean; confidence: number }> {
  // Check 1: Fact consistency with RAG context
  if (context && context.length > 0) {
    const embedModel = await modelManager.loadModel('sentence-transformers');
    const outputEmb = await embedModel.encode(output);
    const contextEmbs = await Promise.all(context.map(c => embedModel.encode(c)));
    
    const maxSimilarity = Math.max(...contextEmbs.map(c => cosineSimilarity(outputEmb, c)));
    
    if (maxSimilarity < 0.5) {
      return { isHallucination: true, confidence: 1 - maxSimilarity };
    }
  }
  
  // Check 2: Self-consistency (re-run with different seed)
  const secondRun = await rerunInference(input, { temperature: 0.3 });
  const consistency = computeSimilarity(output, secondRun);
  
  if (consistency < 0.6) {
    return { isHallucination: true, confidence: 1 - consistency };
  }
  
  return { isHallucination: false, confidence: consistency };
}
```

---

## 🔄 Fallback & Self-Healing

### Fallback Chain

```typescript
async function inferWithFallback(
  input: string,
  maxRetries: number = 3
): Promise<InferenceResult> {
  const attempts: ModelChoice[] = [
    { model: 'deepseek', reason: 'Primary (local)' },
    { model: 'claude', reason: 'Fallback (external)' },
    { model: 'gpt4', reason: 'Last resort (external)' }
  ];
  
  for (let i = 0; i < attempts.length; i++) {
    try {
      const result = await runInference(input, attempts[i].model);
      
      // Check quality
      const quality = await validateQuality(result);
      if (quality.passed) {
        logSuccess(attempts[i].model, i);
        return result;
      } else {
        logQualityFailure(attempts[i].model, quality);
        continue;
      }
    } catch (error) {
      logFailure(attempts[i].model, error);
      
      if (i === attempts.length - 1) {
        // All fallbacks failed → Return cached safe response
        return await getCachedSafeResponse(input);
      }
    }
  }
}
```

### Self-Healing

```typescript
class SelfHealingRouter {
  private healthScores: Map<string, number> = new Map();
  
  async updateHealth(model: string, success: boolean): Promise<void> {
    const current = this.healthScores.get(model) || 1.0;
    
    // Exponential moving average
    const newScore = success
      ? current * 0.9 + 0.1 // Slowly recover
      : current * 0.5;      // Quickly degrade
    
    this.healthScores.set(model, Math.max(0.1, Math.min(1.0, newScore)));
    
    // If model health drops below threshold, disable temporarily
    if (newScore < 0.3) {
      console.warn(`🚨 Model ${model} health critical: ${newScore}`);
      this.disableModel(model, 300000); // 5 minutes
    }
  }
  
  getHealthyModels(): string[] {
    return Array.from(this.healthScores.entries())
      .filter(([_, score]) => score > 0.5)
      .map(([model, _]) => model);
  }
}
```

---

## 📊 Cost Tracking

### Per-Inference Logging

```typescript
interface InferenceCost {
  modelUsed: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  costUsd: number;
  cacheHit: boolean;
  timestamp: string;
}

async function logInferenceCost(cost: InferenceCost): Promise<void> {
  await supabase.from('ai_costs').insert({
    ...cost,
    app: 'synqra', // or 'noid', 'aurafx'
    environment: process.env.NODE_ENV
  });
  
  // Real-time cost alert if exceeding budget
  const dailyCost = await getDailyCost();
  if (dailyCost > DAILY_BUDGET) {
    sendAlert(`🚨 AI cost exceeded daily budget: $${dailyCost}`);
  }
}
```

### Cost Optimization Metrics

```
Target: <$0.01 per user interaction

Current Breakdown (example):
- Local models: $0.000 (80% of requests)
- Claude API: $0.008 (18% of requests)
- GPT-4 fallback: $0.025 (2% of requests)

Weighted Average: $0.009 per interaction ✅ Under budget
```

---

## 🎯 Implementation Checklist

### Phase 1: Setup
- [ ] Install Hugging Face transformers
- [ ] Download and quantize DeepSeek model
- [ ] Set up lazy loading infrastructure
- [ ] Implement multi-layer caching

### Phase 2: Routing
- [ ] Build task classifier
- [ ] Implement routing decision tree
- [ ] Add fallback chains
- [ ] Test routing accuracy

### Phase 3: Guardrails
- [ ] Integrate OpenCLIP for brand alignment
- [ ] Add toxicity scanner
- [ ] Implement hallucination detector
- [ ] Set confidence thresholds

### Phase 4: Observability
- [ ] Log all inference calls
- [ ] Track costs per model
- [ ] Monitor health scores
- [ ] Set up alerts

### Phase 5: Optimization
- [ ] Analyze cost distribution
- [ ] Tune routing thresholds
- [ ] Optimize cache hit rates
- [ ] Reduce external API usage to <20%

---

## 📈 Success Metrics

- **Cost Reduction**: 80% vs. all-external baseline
- **Cache Hit Rate**: >60% for repeated queries
- **Latency**: <2s for local, <5s for external
- **Quality**: >90% user satisfaction
- **Uptime**: 99.9% with self-healing
- **Brand Alignment**: >0.7 similarity score

---

**Next**: See [observability.md](./observability.md) for logging implementation.
