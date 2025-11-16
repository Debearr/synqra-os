/**
 * ============================================================
 * BENCHMARKING & STRESS TESTING SUITE
 * ============================================================
 * Comprehensive testing of model performance
 */

import { runInference } from "./localModelLoader";
import { processInput } from "./processingPipeline";
import { validateOutputQuality } from "./enhancedQualityValidator";
import { checkBrandConsistency } from "./brandDNAValidator";
import { verifyFactualGrounding } from "./hallucinationGate";
import { executeVectorPipeline } from "../supabase/vectorPipeline";

export interface BenchmarkResult {
  testName: string;
  passed: boolean;
  duration: number;
  metrics: Record<string, any>;
  errors: string[];
}

export interface BenchmarkSuite {
  suiteName: string;
  results: BenchmarkResult[];
  summary: {
    totalTests: number;
    passed: number;
    failed: number;
    avgDuration: number;
    timestamp: string;
  };
}

/**
 * Run inference speed benchmark
 */
export async function benchmarkInferenceSpeed(): Promise<BenchmarkResult> {
  console.log("⏱️  Benchmarking inference speed...");
  
  const testCases = [
    { modelId: "minilm-l6-v2", input: "This is a test sentence for embedding generation." },
    { modelId: "distilbert-sentiment", input: "I love this product! It's amazing." },
    { modelId: "bge-small-en-v1.5", input: "Artificial intelligence is transforming technology." },
    { modelId: "roberta-toxicity", input: "This is a normal, non-toxic message." },
  ];
  
  const start = Date.now();
  const errors: string[] = [];
  const latencies: number[] = [];
  
  for (const testCase of testCases) {
    try {
      const inferenceStart = Date.now();
      await runInference({
        modelId: testCase.modelId,
        input: testCase.input,
        options: {},
      });
      const inferenceTime = Date.now() - inferenceStart;
      latencies.push(inferenceTime);
      
      console.log(`   ✅ ${testCase.modelId}: ${inferenceTime}ms`);
    } catch (error) {
      errors.push(`${testCase.modelId}: ${error}`);
      console.log(`   ❌ ${testCase.modelId}: FAILED`);
    }
  }
  
  const duration = Date.now() - start;
  const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
  
  return {
    testName: "Inference Speed",
    passed: errors.length === 0,
    duration,
    metrics: {
      testsRun: testCases.length,
      avgLatency: Math.round(avgLatency),
      minLatency: Math.min(...latencies),
      maxLatency: Math.max(...latencies),
      latencies,
    },
    errors,
  };
}

/**
 * Run embedding drift detection
 */
export async function benchmarkEmbeddingDrift(): Promise<BenchmarkResult> {
  console.log("🔍 Benchmarking embedding drift...");
  
  const referenceText = "Premium luxury technology for modern professionals";
  const testVariations = [
    "High-end luxury tech for contemporary professionals",
    "Premium quality technology for business experts",
    "Luxury technology solutions for modern executives",
    "Completely unrelated topic about cooking recipes",
  ];
  
  const start = Date.now();
  const errors: string[] = [];
  
  try {
    // Generate reference embedding
    const refResult = await runInference({
      modelId: "bge-small-en-v1.5",
      input: referenceText,
      options: {},
    });
    
    const refEmbedding = Array.isArray(refResult.output) ? refResult.output : [];
    
    // Generate test embeddings and calculate similarities
    const similarities: number[] = [];
    
    for (const variation of testVariations) {
      const testResult = await runInference({
        modelId: "bge-small-en-v1.5",
        input: variation,
        options: {},
      });
      
      const testEmbedding = Array.isArray(testResult.output) ? testResult.output : [];
      
      // Calculate cosine similarity
      const similarity = cosineSimilarity(refEmbedding, testEmbedding);
      similarities.push(similarity);
      
      console.log(`   📊 Similarity: ${(similarity * 100).toFixed(1)}%`);
    }
    
    // Check drift
    const expectedHighSim = similarities.slice(0, 3).every(s => s > 0.7);
    const expectedLowSim = similarities[3] < 0.5;
    const passed = expectedHighSim && expectedLowSim;
    
    const duration = Date.now() - start;
    
    return {
      testName: "Embedding Drift",
      passed,
      duration,
      metrics: {
        similarities,
        avgSimilarSentences: (similarities.slice(0, 3).reduce((a, b) => a + b, 0) / 3).toFixed(3),
        dissimilarSentence: similarities[3].toFixed(3),
        driftDetected: !passed,
      },
      errors: passed ? [] : ["Embedding drift detected - similarity scoring unexpected"],
    };
  } catch (error) {
    errors.push(String(error));
    return {
      testName: "Embedding Drift",
      passed: false,
      duration: Date.now() - start,
      metrics: {},
      errors,
    };
  }
}

/**
 * Run sentiment accuracy test
 */
export async function benchmarkSentimentAccuracy(): Promise<BenchmarkResult> {
  console.log("😊 Benchmarking sentiment accuracy...");
  
  const testCases = [
    { text: "I absolutely love this! Amazing product!", expected: "positive" },
    { text: "This is terrible. Worst experience ever.", expected: "negative" },
    { text: "It's okay, nothing special.", expected: "neutral" },
    { text: "Best decision I ever made! Highly recommend!", expected: "positive" },
    { text: "Complete waste of money and time.", expected: "negative" },
  ];
  
  const start = Date.now();
  const errors: string[] = [];
  let correct = 0;
  
  for (const testCase of testCases) {
    try {
      const result = await runInference({
        modelId: "distilbert-sentiment",
        input: testCase.text,
        options: {},
      });
      
      const score = Array.isArray(result.output) ? result.output[0] : 0.5;
      
      let predicted = "neutral";
      if (score > 0.6) predicted = "positive";
      if (score < 0.4) predicted = "negative";
      
      if (predicted === testCase.expected) {
        correct++;
        console.log(`   ✅ "${testCase.text.substring(0, 40)}...": ${predicted}`);
      } else {
        errors.push(`Expected ${testCase.expected}, got ${predicted}`);
        console.log(`   ❌ "${testCase.text.substring(0, 40)}...": ${predicted} (expected ${testCase.expected})`);
      }
    } catch (error) {
      errors.push(String(error));
    }
  }
  
  const accuracy = (correct / testCases.length) * 100;
  const duration = Date.now() - start;
  
  return {
    testName: "Sentiment Accuracy",
    passed: accuracy >= 80,
    duration,
    metrics: {
      accuracy: accuracy.toFixed(1) + "%",
      correct,
      total: testCases.length,
    },
    errors,
  };
}

/**
 * Run toxicity detection test
 */
export async function benchmarkToxicityDetection(): Promise<BenchmarkResult> {
  console.log("🛡️  Benchmarking toxicity detection...");
  
  const testCases = [
    { text: "This is a friendly and helpful message.", expected: "clean" },
    { text: "I hate you and everyone like you.", expected: "toxic" },
    { text: "That's a stupid idea.", expected: "toxic" },
    { text: "Thank you for your help!", expected: "clean" },
  ];
  
  const start = Date.now();
  const errors: string[] = [];
  let truePositives = 0;
  let trueNegatives = 0;
  let falsePositives = 0;
  let falseNegatives = 0;
  
  for (const testCase of testCases) {
    try {
      const result = await runInference({
        modelId: "roberta-toxicity",
        input: testCase.text,
        options: {},
      });
      
      const score = Array.isArray(result.output) ? result.output[0] : 0;
      const predicted = score > 0.5 ? "toxic" : "clean";
      
      if (predicted === testCase.expected && predicted === "toxic") truePositives++;
      if (predicted === testCase.expected && predicted === "clean") trueNegatives++;
      if (predicted === "toxic" && testCase.expected === "clean") falsePositives++;
      if (predicted === "clean" && testCase.expected === "toxic") falseNegatives++;
      
      const icon = predicted === testCase.expected ? "✅" : "❌";
      console.log(`   ${icon} "${testCase.text.substring(0, 40)}...": ${predicted} (score: ${(score * 100).toFixed(0)}%)`);
    } catch (error) {
      errors.push(String(error));
    }
  }
  
  const accuracy = ((truePositives + trueNegatives) / testCases.length) * 100;
  const duration = Date.now() - start;
  
  return {
    testName: "Toxicity Detection",
    passed: falsePositives === 0 && falseNegatives === 0,
    duration,
    metrics: {
      accuracy: accuracy.toFixed(1) + "%",
      truePositives,
      trueNegatives,
      falsePositives,
      falseNegatives,
    },
    errors,
  };
}

/**
 * Run brand alignment test
 */
export async function benchmarkBrandAlignment(): Promise<BenchmarkResult> {
  console.log("🎨 Benchmarking brand alignment...");
  
  const testCases = [
    { text: "Our refined, premium solution transforms your workflow.", brand: "de-bear" as const, expected: "high" },
    { text: "cheap basic simple ordinary standard.", brand: "de-bear" as const, expected: "low" },
    { text: "Professional driver assistant for efficient scheduling.", brand: "noid" as const, expected: "high" },
    { text: "Luxury exclusive premium elite executive.", brand: "noid" as const, expected: "low" },
  ];
  
  const start = Date.now();
  const errors: string[] = [];
  let correct = 0;
  
  for (const testCase of testCases) {
    try {
      const result = await checkBrandConsistency(testCase.text, testCase.brand);
      
      const predicted = result.score >= 0.7 ? "high" : "low";
      
      if (predicted === testCase.expected) {
        correct++;
        console.log(`   ✅ ${testCase.brand}: ${(result.score * 100).toFixed(0)}% alignment`);
      } else {
        errors.push(`Expected ${testCase.expected} for ${testCase.brand}, got ${predicted}`);
        console.log(`   ❌ ${testCase.brand}: ${(result.score * 100).toFixed(0)}% alignment (expected ${testCase.expected})`);
      }
    } catch (error) {
      errors.push(String(error));
    }
  }
  
  const accuracy = (correct / testCases.length) * 100;
  const duration = Date.now() - start;
  
  return {
    testName: "Brand Alignment",
    passed: accuracy >= 75,
    duration,
    metrics: {
      accuracy: accuracy.toFixed(1) + "%",
      correct,
      total: testCases.length,
    },
    errors,
  };
}

/**
 * Run cost per request test
 */
export async function benchmarkCostPerRequest(): Promise<BenchmarkResult> {
  console.log("💰 Benchmarking cost per request...");
  
  const testQueries = [
    "What is your pricing?",
    "How do I set up integrations?",
    "Explain the entire architecture in detail.",
  ];
  
  const start = Date.now();
  const errors: string[] = [];
  const costs: number[] = [];
  
  for (const query of testQueries) {
    try {
      // Simulate routing and cost calculation
      const complexity = analyzeComplexity(query);
      const cost = getEstimatedCost(complexity);
      costs.push(cost);
      
      console.log(`   💵 "${query.substring(0, 40)}...": $${cost.toFixed(4)} (${complexity})`);
    } catch (error) {
      errors.push(String(error));
    }
  }
  
  const avgCost = costs.reduce((a, b) => a + b, 0) / costs.length;
  const duration = Date.now() - start;
  
  return {
    testName: "Cost Per Request",
    passed: avgCost < 0.005, // Target < $0.005 per request
    duration,
    metrics: {
      avgCost: "$" + avgCost.toFixed(4),
      minCost: "$" + Math.min(...costs).toFixed(4),
      maxCost: "$" + Math.max(...costs).toFixed(4),
      targetMet: avgCost < 0.005,
    },
    errors,
  };
}

/**
 * Run full benchmark suite
 */
export async function runFullBenchmark(): Promise<BenchmarkSuite> {
  console.log("\n🚀 Starting Full Benchmark Suite\n");
  console.log("=" .repeat(60));
  
  const start = Date.now();
  
  const results: BenchmarkResult[] = [
    await benchmarkInferenceSpeed(),
    await benchmarkEmbeddingDrift(),
    await benchmarkSentimentAccuracy(),
    await benchmarkToxicityDetection(),
    await benchmarkBrandAlignment(),
    await benchmarkCostPerRequest(),
  ];
  
  const duration = Date.now() - start;
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
  
  console.log("\n" + "=".repeat(60));
  console.log("📊 BENCHMARK SUMMARY");
  console.log("=".repeat(60));
  console.log(`Total Tests:     ${results.length}`);
  console.log(`Passed:          ${passed} ✅`);
  console.log(`Failed:          ${failed} ${failed > 0 ? "❌" : ""}`);
  console.log(`Total Duration:  ${duration}ms`);
  console.log(`Avg Duration:    ${Math.round(avgDuration)}ms`);
  console.log("=".repeat(60) + "\n");
  
  return {
    suiteName: "Full HuggingFace Stack Benchmark",
    results,
    summary: {
      totalTests: results.length,
      passed,
      failed,
      avgDuration,
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Helper: Cosine similarity
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  
  return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Helper: Analyze complexity
 */
function analyzeComplexity(query: string): "simple" | "medium" | "high" {
  if (query.length < 100) return "simple";
  if (query.length < 300) return "medium";
  return "high";
}

/**
 * Helper: Get estimated cost
 */
function getEstimatedCost(complexity: "simple" | "medium" | "high"): number {
  switch (complexity) {
    case "simple": return 0.000; // Local model
    case "medium": return 0.008; // DeepSeek
    case "high": return 0.015; // Claude
  }
}
