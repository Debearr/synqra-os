/**
 * ============================================================
 * UNIFIED MODEL PROVIDERS
 * ============================================================
 * Actual API implementations for all models
 * DeepSeek, Claude, OpenAI, Mistral + Local HF models
 */

import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { ModelProvider } from './types';

// ============================================================
// CONFIGURATION
// ============================================================

const config = {
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY || '',
    model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-4o',
  },
  deepseek: {
    apiKey: process.env.DEEPSEEK_API_KEY || '',
    model: 'deepseek-chat',
    baseURL: 'https://api.deepseek.com',
  },
  mistral: {
    apiKey: process.env.MISTRAL_API_KEY || '',
    model: 'mistral-small-latest',
    baseURL: 'https://api.mistral.ai/v1',
  },
  pythonService: {
    url: process.env.PYTHON_MODEL_SERVICE_URL || 'http://localhost:8000',
    timeout: 30000,
  },
};

// ============================================================
// CLIENT INITIALIZATION
// ============================================================

let anthropicClient: Anthropic | null = null;
let openaiClient: OpenAI | null = null;
let deepseekClient: OpenAI | null = null; // DeepSeek uses OpenAI-compatible API
let mistralClient: OpenAI | null = null; // Mistral uses OpenAI-compatible API

function getAnthropicClient(): Anthropic {
  if (!anthropicClient && config.anthropic.apiKey) {
    anthropicClient = new Anthropic({
      apiKey: config.anthropic.apiKey,
    });
  }
  if (!anthropicClient) {
    throw new Error('Anthropic API key not configured');
  }
  return anthropicClient;
}

function getOpenAIClient(): OpenAI {
  if (!openaiClient && config.openai.apiKey) {
    openaiClient = new OpenAI({
      apiKey: config.openai.apiKey,
    });
  }
  if (!openaiClient) {
    throw new Error('OpenAI API key not configured');
  }
  return openaiClient;
}

function getDeepSeekClient(): OpenAI {
  if (!deepseekClient && config.deepseek.apiKey) {
    deepseekClient = new OpenAI({
      apiKey: config.deepseek.apiKey,
      baseURL: config.deepseek.baseURL,
    });
  }
  if (!deepseekClient) {
    throw new Error('DeepSeek API key not configured');
  }
  return deepseekClient;
}

function getMistralClient(): OpenAI {
  if (!mistralClient && config.mistral.apiKey) {
    mistralClient = new OpenAI({
      apiKey: config.mistral.apiKey,
      baseURL: config.mistral.baseURL,
    });
  }
  if (!mistralClient) {
    throw new Error('Mistral API key not configured');
  }
  return mistralClient;
}

// ============================================================
// MODEL PROVIDER INTERFACE
// ============================================================

export interface ModelCallOptions {
  input: string;
  systemPrompt?: string;
  maxTokens: number;
  temperature?: number;
  stopSequences?: string[];
}

export interface ModelCallResult {
  output: string;
  inputTokens: number;
  outputTokens: number;
  model: string;
  finishReason?: string;
}

// ============================================================
// CLAUDE (ANTHROPIC) PROVIDER
// ============================================================

export async function callClaude(options: ModelCallOptions): Promise<ModelCallResult> {
  console.log('🤖 Calling Claude...');
  
  try {
    const client = getAnthropicClient();
    
    const response = await client.messages.create({
      model: config.anthropic.model,
      max_tokens: options.maxTokens,
      temperature: options.temperature || 0.7,
      system: options.systemPrompt,
      messages: [
        {
          role: 'user',
          content: options.input,
        },
      ],
      stop_sequences: options.stopSequences,
    });

    const textContent = response.content
      .filter((block) => block.type === 'text')
      .map((block) => ('text' in block ? block.text : ''))
      .join('\n');

    return {
      output: textContent,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      model: response.model,
      finishReason: response.stop_reason || undefined,
    };
  } catch (error: any) {
    console.error('❌ Claude API error:', error.message);
    throw new Error(`Claude API failed: ${error.message}`);
  }
}

// ============================================================
// GPT (OPENAI) PROVIDER
// ============================================================

export async function callGPT(options: ModelCallOptions): Promise<ModelCallResult> {
  console.log('🤖 Calling GPT-4o...');
  
  try {
    const client = getOpenAIClient();
    
    const messages: any[] = [];
    if (options.systemPrompt) {
      messages.push({
        role: 'system',
        content: options.systemPrompt,
      });
    }
    messages.push({
      role: 'user',
      content: options.input,
    });

    const response = await client.chat.completions.create({
      model: config.openai.model,
      max_tokens: options.maxTokens,
      temperature: options.temperature || 0.7,
      messages,
      stop: options.stopSequences,
    });

    const choice = response.choices[0];
    if (!choice || !choice.message) {
      throw new Error('No response from GPT');
    }

    return {
      output: choice.message.content || '',
      inputTokens: response.usage?.prompt_tokens || 0,
      outputTokens: response.usage?.completion_tokens || 0,
      model: response.model,
      finishReason: choice.finish_reason || undefined,
    };
  } catch (error: any) {
    console.error('❌ GPT API error:', error.message);
    throw new Error(`GPT API failed: ${error.message}`);
  }
}

// ============================================================
// DEEPSEEK PROVIDER
// ============================================================

export async function callDeepSeek(options: ModelCallOptions): Promise<ModelCallResult> {
  console.log('🤖 Calling DeepSeek V3...');
  
  try {
    const client = getDeepSeekClient();
    
    const messages: any[] = [];
    if (options.systemPrompt) {
      messages.push({
        role: 'system',
        content: options.systemPrompt,
      });
    }
    messages.push({
      role: 'user',
      content: options.input,
    });

    const response = await client.chat.completions.create({
      model: config.deepseek.model,
      max_tokens: options.maxTokens,
      temperature: options.temperature || 0.7,
      messages,
      stop: options.stopSequences,
    });

    const choice = response.choices[0];
    if (!choice || !choice.message) {
      throw new Error('No response from DeepSeek');
    }

    return {
      output: choice.message.content || '',
      inputTokens: response.usage?.prompt_tokens || 0,
      outputTokens: response.usage?.completion_tokens || 0,
      model: response.model,
      finishReason: choice.finish_reason || undefined,
    };
  } catch (error: any) {
    console.error('❌ DeepSeek API error:', error.message);
    throw new Error(`DeepSeek API failed: ${error.message}`);
  }
}

// ============================================================
// MISTRAL PROVIDER
// ============================================================

export async function callMistral(options: ModelCallOptions): Promise<ModelCallResult> {
  console.log('🤖 Calling Mistral...');
  
  try {
    const client = getMistralClient();
    
    const messages: any[] = [];
    if (options.systemPrompt) {
      messages.push({
        role: 'system',
        content: options.systemPrompt,
      });
    }
    messages.push({
      role: 'user',
      content: options.input,
    });

    const response = await client.chat.completions.create({
      model: config.mistral.model,
      max_tokens: options.maxTokens,
      temperature: options.temperature || 0.7,
      messages,
      stop: options.stopSequences,
    });

    const choice = response.choices[0];
    if (!choice || !choice.message) {
      throw new Error('No response from Mistral');
    }

    return {
      output: choice.message.content || '',
      inputTokens: response.usage?.prompt_tokens || 0,
      outputTokens: response.usage?.completion_tokens || 0,
      model: response.model,
      finishReason: choice.finish_reason || undefined,
    };
  } catch (error: any) {
    console.error('❌ Mistral API error:', error.message);
    throw new Error(`Mistral API failed: ${error.message}`);
  }
}

// ============================================================
// LOCAL MODEL PROVIDER (via Python service)
// ============================================================

export async function callLocalModel(
  modelId: string,
  options: ModelCallOptions
): Promise<ModelCallResult> {
  console.log(`🤖 Calling local model: ${modelId}...`);
  
  try {
    const response = await fetch(`${config.pythonService.url}/inference`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model_id: modelId,
        input: options.input,
        system_prompt: options.systemPrompt,
        max_tokens: options.maxTokens,
        temperature: options.temperature || 0.7,
      }),
      signal: AbortSignal.timeout(config.pythonService.timeout),
    });

    if (!response.ok) {
      throw new Error(`Python service returned ${response.status}`);
    }

    const data = await response.json();

    return {
      output: data.output || '',
      inputTokens: data.input_tokens || 0,
      outputTokens: data.output_tokens || 0,
      model: modelId,
      finishReason: data.finish_reason,
    };
  } catch (error: any) {
    console.error(`❌ Local model error (${modelId}):`, error.message);
    throw new Error(`Local model ${modelId} failed: ${error.message}`);
  }
}

// ============================================================
// UNIFIED MODEL CALL FUNCTION
// ============================================================

export async function callModel(
  model: ModelProvider,
  input: string,
  systemPrompt: string | undefined,
  maxTokens: number,
  temperature?: number
): Promise<ModelCallResult> {
  const options: ModelCallOptions = {
    input,
    systemPrompt,
    maxTokens,
    temperature,
  };

  try {
    switch (model) {
      case 'claude':
        return await callClaude(options);
      
      case 'gpt-5': // Using GPT-4o as GPT-5 proxy
        return await callGPT(options);
      
      case 'deepseek':
        return await callDeepSeek(options);
      
      case 'mistral':
        return await callMistral(options);
      
      case 'cached':
        throw new Error('Cached model should not be called directly');
      
      default:
        throw new Error(`Unknown model: ${model}`);
    }
  } catch (error: any) {
    console.error(`❌ Model call failed for ${model}:`, error.message);
    throw error;
  }
}

// ============================================================
// PROVIDER HEALTH CHECKS
// ============================================================

export async function checkProviderHealth(): Promise<{
  anthropic: boolean;
  openai: boolean;
  deepseek: boolean;
  mistral: boolean;
  pythonService: boolean;
}> {
  const health = {
    anthropic: false,
    openai: false,
    deepseek: false,
    mistral: false,
    pythonService: false,
  };

  // Check Anthropic
  try {
    if (config.anthropic.apiKey) {
      const client = getAnthropicClient();
      await client.messages.create({
        model: config.anthropic.model,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'test' }],
      });
      health.anthropic = true;
    }
  } catch (error) {
    console.warn('⚠️  Anthropic health check failed');
  }

  // Check OpenAI
  try {
    if (config.openai.apiKey) {
      const client = getOpenAIClient();
      await client.chat.completions.create({
        model: config.openai.model,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'test' }],
      });
      health.openai = true;
    }
  } catch (error) {
    console.warn('⚠️  OpenAI health check failed');
  }

  // Check DeepSeek
  try {
    if (config.deepseek.apiKey) {
      const client = getDeepSeekClient();
      await client.chat.completions.create({
        model: config.deepseek.model,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'test' }],
      });
      health.deepseek = true;
    }
  } catch (error) {
    console.warn('⚠️  DeepSeek health check failed');
  }

  // Check Mistral
  try {
    if (config.mistral.apiKey) {
      const client = getMistralClient();
      await client.chat.completions.create({
        model: config.mistral.model,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'test' }],
      });
      health.mistral = true;
    }
  } catch (error) {
    console.warn('⚠️  Mistral health check failed');
  }

  // Check Python service
  try {
    const response = await fetch(`${config.pythonService.url}/health`, {
      signal: AbortSignal.timeout(5000),
    });
    health.pythonService = response.ok;
  } catch (error) {
    console.warn('⚠️  Python service health check failed');
  }

  return health;
}

// ============================================================
// EXPORT CONFIGURATION
// ============================================================

export function getProviderConfig() {
  return {
    anthropic: {
      configured: !!config.anthropic.apiKey,
      model: config.anthropic.model,
    },
    openai: {
      configured: !!config.openai.apiKey,
      model: config.openai.model,
    },
    deepseek: {
      configured: !!config.deepseek.apiKey,
      model: config.deepseek.model,
    },
    mistral: {
      configured: !!config.mistral.apiKey,
      model: config.mistral.model,
    },
    pythonService: {
      configured: !!config.pythonService.url,
      url: config.pythonService.url,
    },
  };
}
