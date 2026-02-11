import { createClient, type RedisClientType } from "redis";

let redisClient: RedisClientType | null = null;
let redisInitError: Error | null = null;

function getRedisUrl() {
  const url = process.env.REDIS_URL;
  if (!url || url.trim() === "") {
    throw new Error("REDIS_URL is missing or empty");
  }
  return url;
}

export async function getRedisClient(): Promise<RedisClientType> {
  if (redisClient) {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
    return redisClient;
  }

  if (redisInitError) {
    throw redisInitError;
  }

  try {
    redisClient = createClient({ url: getRedisUrl() });
    redisClient.on("error", (error) => {
      console.error("Redis client error:", error);
    });
    await redisClient.connect();
    return redisClient;
  } catch (error) {
    redisInitError = error instanceof Error ? error : new Error("Redis init error");
    throw redisInitError;
  }
}

export async function getCachedResponse<T>(key: string): Promise<T | null> {
  const client = await getRedisClient();
  const cached = await client.get(key);
  if (!cached) {
    return null;
  }
  try {
    return JSON.parse(cached) as T;
  } catch (error) {
    console.warn("Failed to parse cached response, clearing key", error);
    await client.del(key);
    return null;
  }
}

export async function setCachedResponse<T>(
  key: string,
  value: T,
  ttlSeconds: number
): Promise<void> {
  const client = await getRedisClient();
  await client.set(key, JSON.stringify(value), {
    EX: ttlSeconds,
  });
}
