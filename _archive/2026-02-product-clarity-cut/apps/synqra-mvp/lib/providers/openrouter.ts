interface OpenRouterResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

export interface ProviderCallResult {
  text: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  latencyMs: number;
}

interface OpenRouterConfig {
  baseUrl: string;
  model: string;
  timeoutMs: number;
}

interface OpenRouterCallInput {
  apiKey: string;
  prompt: string;
  config: OpenRouterConfig;
}

export async function callOpenRouter({
  apiKey,
  prompt,
  config,
}: OpenRouterCallInput): Promise<ProviderCallResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);
  const startedAt = Date.now();

  try {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: "user", content: prompt }],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `OpenRouter error ${response.status}: ${errorText || response.statusText}`
      );
    }

    const data = (await response.json()) as OpenRouterResponse;
    const choice = data.choices?.[0]?.message?.content?.trim() ?? "";

    return {
      text: choice,
      usage: {
        promptTokens: data.usage?.prompt_tokens ?? 0,
        completionTokens: data.usage?.completion_tokens ?? 0,
        totalTokens: data.usage?.total_tokens ?? 0,
      },
      latencyMs: Date.now() - startedAt,
    };
  } finally {
    clearTimeout(timeout);
  }
}
