import { councilConfig } from "./config";
import type { GroqResult, GroqUsage } from "./types";

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_HARD_MAX_TOKENS = councilConfig.maxTokens;
const GROQ_DEFAULT_MAX_TOKENS = Math.min(councilConfig.maxTokens, 280);
const GROQ_MAX_PROMPT_CHARS = 1800;

type GroqMessage = { role: "system" | "user"; content: string };

type GroqResponse = {
  choices?: Array<{ message?: { content?: string | null } }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
  };
  model?: string;
};

type GroqUsageSnapshot = {
  calls: number;
  success: number;
  inputTokens: number;
  outputTokens: number;
};

const groqUsageSnapshot: GroqUsageSnapshot = {
  calls: 0,
  success: 0,
  inputTokens: 0,
  outputTokens: 0,
};

function buildUsage(data?: GroqResponse["usage"]): GroqUsage {
  return {
    inputTokens: data?.prompt_tokens ?? 0,
    outputTokens: data?.completion_tokens ?? 0,
  };
}

function getGroqApiKey(): string | null {
  const value = process.env.GROQ_API_KEY?.trim();
  return value ? value : null;
}

function sanitizeGroqError(text: string): string {
  return text.replace(/\s+/g, " ").trim().slice(0, 240);
}

function updateGroqUsage(usage: GroqUsage): void {
  groqUsageSnapshot.success += 1;
  groqUsageSnapshot.inputTokens += usage.inputTokens;
  groqUsageSnapshot.outputTokens += usage.outputTokens;
}

export function hasGroqApiKey(): boolean {
  return Boolean(getGroqApiKey());
}

export function getGroqUsageSnapshot(): GroqUsageSnapshot {
  return { ...groqUsageSnapshot };
}

export async function requestGroq(options: {
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  model?: string;
  signal?: AbortSignal;
}): Promise<GroqResult> {
  groqUsageSnapshot.calls += 1;

  const apiKey = getGroqApiKey();
  if (!apiKey) {
    return {
      success: false,
      error: { code: "groq_unavailable", message: "GROQ_API_KEY is missing." },
    };
  }

  const prompt = options.prompt.trim();
  if (!prompt) {
    return {
      success: false,
      error: { code: "groq_invalid_prompt", message: "Prompt is required." },
    };
  }
  if (prompt.length > GROQ_MAX_PROMPT_CHARS) {
    return {
      success: false,
      error: {
        code: "groq_prompt_too_large",
        message: `Prompt exceeds ${GROQ_MAX_PROMPT_CHARS} characters.`,
      },
    };
  }

  const messages: GroqMessage[] = [];
  if (options.systemPrompt) {
    messages.push({ role: "system", content: options.systemPrompt });
  }
  messages.push({ role: "user", content: prompt });

  try {
    const maxTokens = Math.min(options.maxTokens ?? GROQ_DEFAULT_MAX_TOKENS, GROQ_HARD_MAX_TOKENS);
    const response = await fetch(GROQ_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: options.model?.trim() || councilConfig.model,
        messages,
        temperature: options.temperature ?? councilConfig.temperature,
        max_tokens: maxTokens,
      }),
      signal: options.signal,
    });

    if (!response.ok) {
      const text = sanitizeGroqError(await response.text());
      return {
        success: false,
        error: {
          code: "groq_failed",
          message: `Groq request failed (${response.status}): ${text || "unknown error"}`,
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

    const usage = buildUsage(data.usage);
    updateGroqUsage(usage);

    return {
      success: true,
      content,
      model: data.model ?? options.model?.trim() ?? councilConfig.model,
      usage,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Groq error";
    return {
      success: false,
      error: { code: "groq_failed", message },
    };
  }
}
