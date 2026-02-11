import { getRedisClient } from "@/lib/cache/ai-cache";

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
}

interface GeminiConfig {
  baseUrl: string;
  model: string;
  timeoutMs: number;
  quota: {
    monthlyRequests: number;
    switchAtPercent: number;
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

interface GeminiCallInput {
  apiKeys: string[];
  prompt: string;
  config: GeminiConfig;
}

function getMonthKeySuffix(date = new Date()) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function getSecondsUntilMonthEnd(now = new Date()) {
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0));
  return Math.max(1, Math.floor((end.getTime() - now.getTime()) / 1000));
}

async function selectGeminiKey(
  apiKeys: string[],
  config: GeminiConfig
): Promise<{ apiKey: string; keyIndex: number }> {
  if (apiKeys.length === 1) {
    return { apiKey: apiKeys[0], keyIndex: 0 };
  }

  const redis = await getRedisClient();
  const monthKey = getMonthKeySuffix();
  const primaryKey = `ai:gemini:usage:${monthKey}:primary`;
  const usageRaw = await redis.get(primaryKey);
  const usage = usageRaw ? Number(usageRaw) : 0;
  const threshold = Math.floor(
    config.quota.monthlyRequests * config.quota.switchAtPercent
  );

  if (usage >= threshold) {
    return { apiKey: apiKeys[1], keyIndex: 1 };
  }

  return { apiKey: apiKeys[0], keyIndex: 0 };
}

async function trackGeminiUsage(keyIndex: number) {
  const redis = await getRedisClient();
  const monthKey = getMonthKeySuffix();
  const usageKey = `ai:gemini:usage:${monthKey}:${keyIndex === 0 ? "primary" : "secondary"}`;
  const count = await redis.incr(usageKey);
  if (count === 1) {
    await redis.expire(usageKey, getSecondsUntilMonthEnd());
  }
}

export async function callGemini({
  apiKeys,
  prompt,
  config,
}: GeminiCallInput): Promise<ProviderCallResult> {
  if (apiKeys.length === 0 || !apiKeys[0]) {
    throw new Error("Gemini API key is missing");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);
  const startedAt = Date.now();

  try {
    const { apiKey, keyIndex } = await selectGeminiKey(apiKeys, config);
    const response = await fetch(
      `${config.baseUrl}/${config.model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
        }),
        signal: controller.signal,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Gemini error ${response.status}: ${errorText || response.statusText}`
      );
    }

    const data = (await response.json()) as GeminiResponse;
    const text =
      data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim() ??
      "";

    await trackGeminiUsage(keyIndex);

    return {
      text,
      usage: {
        promptTokens: data.usageMetadata?.promptTokenCount ?? 0,
        completionTokens: data.usageMetadata?.candidatesTokenCount ?? 0,
        totalTokens: data.usageMetadata?.totalTokenCount ?? 0,
      },
      latencyMs: Date.now() - startedAt,
    };
  } finally {
    clearTimeout(timeout);
  }
}
