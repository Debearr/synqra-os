import { councilConfig } from "./config";
import type { GroqResult, GroqUsage } from "./types";

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

type GroqMessage = { role: "system" | "user"; content: string };

type GroqResponse = {
  choices?: Array<{ message?: { content?: string | null } }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
  };
  model?: string;
};

function buildUsage(data?: GroqResponse["usage"]): GroqUsage {
  return {
    inputTokens: data?.prompt_tokens ?? 0,
    outputTokens: data?.completion_tokens ?? 0,
  };
}

export async function requestGroq(options: {
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
}): Promise<GroqResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      error: { code: "groq_unavailable", message: "GROQ_API_KEY is missing." },
    };
  }

  const messages: GroqMessage[] = [];
  if (options.systemPrompt) {
    messages.push({ role: "system", content: options.systemPrompt });
  }
  messages.push({ role: "user", content: options.prompt });

  try {
    const response = await fetch(GROQ_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: councilConfig.model,
        messages,
        temperature: options.temperature ?? councilConfig.temperature,
        max_tokens: Math.min(options.maxTokens ?? councilConfig.maxTokens, councilConfig.maxTokens),
      }),
      signal: options.signal,
    });

    if (!response.ok) {
      const text = await response.text();
      return {
        success: false,
        error: {
          code: "groq_failed",
          message: `Groq request failed (${response.status}): ${text}`,
        },
      };
    }

    const data = (await response.json()) as GroqResponse;
    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      return {
        success: false,
        error: { code: "groq_failed", message: "Groq returned empty response." },
      };
    }

    return {
      success: true,
      content,
      model: data.model ?? councilConfig.model,
      usage: buildUsage(data.usage),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Groq error";
    return {
      success: false,
      error: { code: "groq_failed", message },
    };
  }
}
