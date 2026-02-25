import asyncio
import hashlib
import json
import logging
import time
from typing import Any

import redis.asyncio as redis


logger = logging.getLogger(__name__)


class RedisCache:
    def __init__(
        self,
        redis_url: str,
        *,
        cache_ttl_seconds: int = 300,
        claude_cap_ratio: float = 0.01,
        claude_window_seconds: int = 3600,
        namespace: str = "synqra:inference",
    ) -> None:
        self.cache_ttl_seconds = cache_ttl_seconds
        self.claude_cap_ratio = claude_cap_ratio
        self.claude_window_seconds = claude_window_seconds
        self.namespace = namespace
        self._redis = redis.from_url(redis_url, encoding="utf-8", decode_responses=True)
        self._dedupe_unlock_script = """
local raw = redis.call("GET", KEYS[1])
if not raw then
  return 0
end
local ok, payload = pcall(cjson.decode, raw)
if not ok then
  return 0
end
if payload["owner"] == ARGV[1] then
  return redis.call("DEL", KEYS[1])
end
return 0
"""
        self._claude_reserve_script = """
local total_key = KEYS[1]
local claude_key = KEYS[2]
local now_ms = tonumber(ARGV[1])
local cutoff_ms = tonumber(ARGV[2])
local cap_ratio = tonumber(ARGV[3])
local member = ARGV[4]

redis.call("ZREMRANGEBYSCORE", total_key, 0, cutoff_ms)
redis.call("ZREMRANGEBYSCORE", claude_key, 0, cutoff_ms)

local total_count = redis.call("ZCARD", total_key)
local claude_count = redis.call("ZCARD", claude_key)
if total_count == 0 then
  return {0, total_count, claude_count, "0"}
end

local projected_ratio = (claude_count + 1) / total_count
if projected_ratio <= cap_ratio then
  redis.call("ZADD", claude_key, now_ms, member)
  return {1, total_count, claude_count, tostring(projected_ratio)}
end
return {0, total_count, claude_count, tostring(projected_ratio)}
"""

    async def close(self) -> None:
        await self._redis.aclose()

    async def ping(self) -> bool:
        try:
            return bool(await self._redis.ping())
        except Exception:
            return False

    def build_signature(self, payload: dict[str, Any]) -> str:
        encoded = json.dumps(payload, sort_keys=True, separators=(",", ":"))
        return hashlib.sha256(encoded.encode("utf-8")).hexdigest()

    def _cache_key(self, signature: str) -> str:
        return f"{self.namespace}:cache:{signature}"

    def _dedupe_lock_key(self, signature: str) -> str:
        return f"{self.namespace}:dedupe:lock:{signature}"

    def _dedupe_result_key(self, signature: str) -> str:
        return f"{self.namespace}:dedupe:result:{signature}"

    @property
    def _total_requests_key(self) -> str:
        return f"{self.namespace}:metrics:requests:total"

    @property
    def _claude_requests_key(self) -> str:
        return f"{self.namespace}:metrics:requests:claude"

    async def get_cached(self, signature: str) -> dict[str, Any] | None:
        try:
            raw = await self._redis.get(self._cache_key(signature))
            return json.loads(raw) if raw else None
        except Exception:
            logger.exception("cache.get_failed")
            return None

    async def set_cached(self, signature: str, value: dict[str, Any]) -> None:
        try:
            await self._redis.set(
                self._cache_key(signature),
                json.dumps(value, separators=(",", ":")),
                ex=self.cache_ttl_seconds,
            )
        except Exception:
            logger.exception("cache.set_failed")

    async def try_acquire_dedupe_lock(
        self, signature: str, owner_id: str, lock_ttl_seconds: int = 35
    ) -> bool:
        lock_payload = {
            "owner": owner_id,
            "started_ms": int(time.time() * 1000),
        }
        try:
            acquired = await self._redis.set(
                self._dedupe_lock_key(signature),
                json.dumps(lock_payload, separators=(",", ":")),
                nx=True,
                ex=lock_ttl_seconds,
            )
            return bool(acquired)
        except Exception:
            logger.exception("dedupe.lock_acquire_failed")
            return True

    async def get_dedupe_lock(self, signature: str) -> dict[str, Any] | None:
        try:
            raw = await self._redis.get(self._dedupe_lock_key(signature))
            return json.loads(raw) if raw else None
        except Exception:
            logger.exception("dedupe.lock_get_failed")
            return None

    async def release_dedupe_lock(self, signature: str, owner_id: str) -> None:
        lock_key = self._dedupe_lock_key(signature)
        try:
            await self._redis.eval(self._dedupe_unlock_script, 1, lock_key, owner_id)
        except Exception:
            logger.exception("dedupe.lock_release_failed")

    async def try_reserve_claude_request(
        self, request_id: str
    ) -> tuple[bool, int, int, float, str | None]:
        now_ms = int(time.time() * 1000)
        cutoff_ms = int((time.time() - self.claude_window_seconds) * 1000)
        reservation_member = f"{now_ms}:{request_id}"
        try:
            result = await self._redis.eval(
                self._claude_reserve_script,
                2,
                self._total_requests_key,
                self._claude_requests_key,
                str(now_ms),
                str(cutoff_ms),
                str(self.claude_cap_ratio),
                reservation_member,
            )
            allowed = bool(int(result[0]))
            total_count = int(result[1])
            claude_count = int(result[2])
            projected_ratio = float(result[3])
            return allowed, total_count, claude_count, projected_ratio, (
                reservation_member if allowed else None
            )
        except Exception:
            logger.exception("claude.reserve_failed")
            return False, 0, 0, 0.0, None

    async def release_claude_reservation(self, reservation_member: str) -> None:
        try:
            await self._redis.zrem(self._claude_requests_key, reservation_member)
        except Exception:
            logger.exception("claude.release_reservation_failed")

    async def set_dedupe_result(
        self, signature: str, value: dict[str, Any], ttl_seconds: int = 35
    ) -> None:
        try:
            await self._redis.set(
                self._dedupe_result_key(signature),
                json.dumps(value, separators=(",", ":")),
                ex=ttl_seconds,
            )
        except Exception:
            logger.exception("dedupe.result_set_failed")

    async def wait_for_dedupe_result(
        self, signature: str, timeout_ms: int, poll_ms: int = 25
    ) -> dict[str, Any] | None:
        deadline = time.monotonic() + (timeout_ms / 1000)
        cache_key = self._cache_key(signature)
        result_key = self._dedupe_result_key(signature)
        while time.monotonic() < deadline:
            try:
                cached_raw = await self._redis.get(cache_key)
                if cached_raw:
                    return json.loads(cached_raw)
                dedupe_raw = await self._redis.get(result_key)
                if dedupe_raw:
                    return json.loads(dedupe_raw)
            except Exception:
                logger.exception("dedupe.wait_failed")
                return None
            await asyncio.sleep(poll_ms / 1000)
        return None

    async def record_total_request(self, request_id: str) -> None:
        await self._record_metric(self._total_requests_key, request_id)

    async def record_claude_request(self, request_id: str) -> None:
        await self._record_metric(self._claude_requests_key, request_id)

    async def can_use_claude(self) -> tuple[bool, int, int, float]:
        try:
            await self._trim_metrics(self._total_requests_key)
            await self._trim_metrics(self._claude_requests_key)

            total_count = int(await self._redis.zcard(self._total_requests_key))
            claude_count = int(await self._redis.zcard(self._claude_requests_key))

            if total_count == 0:
                return False, total_count, claude_count, 0.0

            projected_ratio = (claude_count + 1) / total_count
            return projected_ratio <= self.claude_cap_ratio, total_count, claude_count, projected_ratio
        except Exception:
            logger.exception("claude.cap_check_failed")
            return False, 0, 0, 0.0

    async def _record_metric(self, key: str, request_id: str) -> None:
        now_ms = int(time.time() * 1000)
        member = f"{now_ms}:{request_id}"
        try:
            await self._redis.zadd(key, {member: now_ms})
            await self._trim_metrics(key)
        except Exception:
            logger.exception("metrics.record_failed")

    async def _trim_metrics(self, key: str) -> None:
        cutoff_ms = int((time.time() - self.claude_window_seconds) * 1000)
        try:
            await self._redis.zremrangebyscore(key, 0, cutoff_ms)
        except Exception:
            logger.exception("metrics.trim_failed")
