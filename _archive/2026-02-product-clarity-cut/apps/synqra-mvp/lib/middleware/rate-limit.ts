import { getRedisClient } from "@/lib/cache/ai-cache";

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: string;
}

function getSecondsUntilUtcMidnight(now = new Date()) {
  const end = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0)
  );
  return Math.max(1, Math.floor((end.getTime() - now.getTime()) / 1000));
}

function getDateKey(now = new Date()) {
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function enforceCouncilRateLimit(
  userId: string,
  limit: number
): Promise<RateLimitResult> {
  const redis = await getRedisClient();
  const dateKey = getDateKey();
  const key = `ai:council:limit:${userId}:${dateKey}`;
  const count = await redis.incr(key);

  if (count === 1) {
    await redis.expire(key, getSecondsUntilUtcMidnight());
  }

  const remaining = Math.max(0, limit - count);
  const resetAt = new Date(
    Date.UTC(
      new Date().getUTCFullYear(),
      new Date().getUTCMonth(),
      new Date().getUTCDate() + 1,
      0,
      0,
      0
    )
  ).toISOString();

  return {
    allowed: count <= limit,
    remaining,
    limit,
    resetAt,
  };
}
