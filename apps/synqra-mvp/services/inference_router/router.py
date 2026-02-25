import logging
import os
import time
from typing import Any

from fastapi import HTTPException, status

try:
    from .circuit_breaker import CircuitBreaker
    from .classifier import RequestClassifier
    from .memory_guard import MemoryGuard
    from .providers import ProviderClients, ProviderError
    from .redis_cache import RedisCache
except ImportError:
    from circuit_breaker import CircuitBreaker
    from classifier import RequestClassifier
    from memory_guard import MemoryGuard
    from providers import ProviderClients, ProviderError
    from redis_cache import RedisCache


logger = logging.getLogger(__name__)


class InferenceRouter:
    _PRODUCT_INPUT_TOKEN_CEILINGS = {
        "synqra": 1500,
        "aurafx": 800,
        "noid": 600,
    }
    _DEFAULT_INPUT_TOKEN_CEILING = 600

    def __init__(
        self,
        *,
        providers: ProviderClients,
        classifier: RequestClassifier,
        breaker: CircuitBreaker,
        memory_guard: MemoryGuard,
        redis_cache: RedisCache,
        global_timeout_seconds: int = 30,
        dedupe_window_ms: int = 100,
    ) -> None:
        self.providers = providers
        self.classifier = classifier
        self.breaker = breaker
        self.memory_guard = memory_guard
        self.redis_cache = redis_cache
        self.global_timeout_seconds = global_timeout_seconds
        self.dedupe_window_ms = dedupe_window_ms

    @classmethod
    def from_env(cls) -> "InferenceRouter":
        groq_timeout_seconds = float(os.getenv("GROQ_TIMEOUT_SECONDS", "8"))
        global_timeout_seconds = int(os.getenv("GLOBAL_TIMEOUT_SECONDS", "30"))

        providers = ProviderClients(
            groq_api_key=os.getenv("GROQ_API_KEY"),
            groq_model=os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
            groq_timeout_seconds=groq_timeout_seconds,
            ollama_base_url=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"),
            ollama_model=os.getenv("OLLAMA_MODEL", "llama3.1:8b"),
            ollama_max_concurrency=int(os.getenv("OLLAMA_MAX_CONCURRENCY", "5")),
            claude_api_key=os.getenv("CLAUDE_API_KEY"),
            claude_model=os.getenv("CLAUDE_MODEL", "claude-3-5-sonnet-20241022"),
            kie_api_key=os.getenv("KIE_API_KEY"),
            kie_base_url=os.getenv("KIE_BASE_URL", "https://api.kie.ai"),
        )
        classifier = RequestClassifier()
        breaker = CircuitBreaker(
            threshold_429=int(os.getenv("GROQ_429_BREAKER_THRESHOLD", "2")),
            open_seconds=int(os.getenv("GROQ_429_BREAKER_OPEN_SECONDS", "60")),
        )
        memory_guard = MemoryGuard(min_free_mb=int(os.getenv("MIN_FREE_RAM_MB", "500")))
        redis_cache = RedisCache(
            redis_url=os.getenv("REDIS_URL", "redis://localhost:6379/0"),
            cache_ttl_seconds=int(os.getenv("CACHE_TTL_SECONDS", "300")),
            claude_cap_ratio=float(os.getenv("CLAUDE_CAP_RATIO", "0.01")),
            claude_window_seconds=int(os.getenv("CLAUDE_ROLLING_WINDOW_SECONDS", "3600")),
            namespace=os.getenv("REDIS_NAMESPACE", "synqra:inference"),
        )
        return cls(
            providers=providers,
            classifier=classifier,
            breaker=breaker,
            memory_guard=memory_guard,
            redis_cache=redis_cache,
            global_timeout_seconds=global_timeout_seconds,
            dedupe_window_ms=int(os.getenv("DEDUPE_WINDOW_MS", "100")),
        )

    async def close(self) -> None:
        await self.providers.close()
        await self.redis_cache.close()

    async def route_request(self, payload: dict[str, Any], request_id: str) -> dict[str, Any]:
        self.memory_guard.enforce()
        self._enforce_input_token_ceiling(payload)
        await self.redis_cache.record_total_request(request_id)

        signature_payload = {
            "product": payload.get("product", ""),
            "prompt": payload.get("prompt", ""),
            "media_url": payload.get("media_url", ""),
            "metadata": payload.get("metadata") or {},
        }
        signature = self.redis_cache.build_signature(signature_payload)

        cached = await self.redis_cache.get_cached(signature)
        if cached is not None:
            return self._build_response(request_id, cached, cached=True, deduped=False)

        classification = self.classifier.classify(payload)
        lock_acquired = await self.redis_cache.try_acquire_dedupe_lock(signature, request_id)

        if not lock_acquired:
            lock = await self.redis_cache.get_dedupe_lock(signature)
            if lock:
                started_ms = int(lock.get("started_ms", 0))
                age_ms = int(time.time() * 1000) - started_ms
                if age_ms <= self.dedupe_window_ms:
                    deduped = await self.redis_cache.wait_for_dedupe_result(
                        signature,
                        timeout_ms=self.global_timeout_seconds * 1000,
                    )
                    if deduped is not None:
                        return self._build_response(request_id, deduped, cached=False, deduped=True)

        if lock_acquired:
            try:
                base_result = await self._execute(payload, classification, request_id)
                await self.redis_cache.set_cached(signature, base_result)
                await self.redis_cache.set_dedupe_result(signature, base_result)
                return self._build_response(request_id, base_result, cached=False, deduped=False)
            finally:
                await self.redis_cache.release_dedupe_lock(signature, request_id)

        base_result = await self._execute(payload, classification, request_id)
        await self.redis_cache.set_cached(signature, base_result)
        return self._build_response(request_id, base_result, cached=False, deduped=False)

    async def _execute(
        self, payload: dict[str, Any], classification: Any, request_id: str
    ) -> dict[str, Any]:
        prompt = str(payload.get("prompt", "")).strip()
        product = str(payload.get("product", "")).strip().lower()
        media_url = payload.get("media_url")
        metadata = payload.get("metadata") or {}

        if classification.route == "media":
            if not media_url:
                raise HTTPException(status_code=422, detail="media_url is required for media route")
            output = await self.providers.call_kie(prompt, str(media_url), metadata)
            return {
                "provider": "kie",
                "route": "media",
                "output": output,
                "claude_escalated": False,
            }

        if product == "synqra":
            prompt = self._apply_voice_calibration(prompt)

        if classification.escalate_to_claude:
            claude_result = await self._try_claude(prompt, request_id)
            if claude_result:
                return claude_result

        if await self.breaker.is_open():
            logger.warning("groq.circuit_open", extra={"request_id": request_id})
            breaker_status = await self.breaker.status()
            retry_after = max(1, int(breaker_status.get("retry_after_seconds", 1)))
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Groq cooldown active",
                headers={"Retry-After": str(retry_after)},
            )

        try:
            output = await self.providers.call_groq(prompt)
            await self.breaker.record_success()
            return {
                "provider": "groq",
                "route": "text",
                "output": output,
                "claude_escalated": False,
            }
        except ProviderError as exc:
            if exc.status_code == 429:
                await self.breaker.record_rate_limited()
                logger.warning(
                    "groq.rate_limited",
                    extra={"request_id": request_id, "status_code": exc.status_code},
                )
                if await self.breaker.is_open():
                    breaker_status = await self.breaker.status()
                    retry_after = max(1, int(breaker_status.get("retry_after_seconds", 1)))
                    raise HTTPException(
                        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                        detail="Groq cooldown active",
                        headers={"Retry-After": str(retry_after)},
                    )
            else:
                await self.breaker.record_non_429()
                logger.warning(
                    "groq.failed",
                    extra={"request_id": request_id, "status_code": exc.status_code},
                )
        except Exception:
            await self.breaker.record_non_429()
            logger.exception("groq.unexpected_failure", extra={"request_id": request_id})

        try:
            output = await self.providers.call_ollama(prompt)
            return {
                "provider": "ollama",
                "route": "text",
                "output": output,
                "claude_escalated": False,
            }
        except ProviderError:
            logger.exception("ollama.failed", extra={"request_id": request_id})

        claude_fallback = await self._try_claude(prompt, request_id)
        if claude_fallback:
            return claude_fallback

        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="All providers failed for this request",
        )

    async def _try_claude(self, prompt: str, request_id: str) -> dict[str, Any] | None:
        (
            allowed,
            total_count,
            claude_count,
            projected_ratio,
            reservation_member,
        ) = await self.redis_cache.try_reserve_claude_request(request_id)
        if not allowed:
            logger.info(
                "claude.cap_reached",
                extra={
                    "request_id": request_id,
                    "total_count": total_count,
                    "claude_count": claude_count,
                    "projected_ratio": projected_ratio,
                },
            )
            return None

        try:
            output = await self.providers.call_claude(prompt)
            return {
                "provider": "claude",
                "route": "text",
                "output": output,
                "claude_escalated": True,
            }
        except ProviderError:
            if reservation_member:
                await self.redis_cache.release_claude_reservation(reservation_member)
            logger.exception("claude.failed", extra={"request_id": request_id})
            return None
        except Exception:
            if reservation_member:
                await self.redis_cache.release_claude_reservation(reservation_member)
            logger.exception("claude.unexpected_failure", extra={"request_id": request_id})
            return None

    @staticmethod
    def _apply_voice_calibration(prompt: str) -> str:
        calibration = (
            "Voice calibration for Synqra: concise, executive, no hype, action-first language. "
            "Preserve factual certainty and avoid speculative claims.\n\n"
        )
        return f"{calibration}{prompt}"

    @classmethod
    def _token_ceiling_for_product(cls, product: str) -> int:
        return cls._PRODUCT_INPUT_TOKEN_CEILINGS.get(product, cls._DEFAULT_INPUT_TOKEN_CEILING)

    @staticmethod
    def _estimate_input_tokens(prompt: str) -> int:
        # Lightweight estimate used only for routing guardrails.
        return max(0, (len(prompt) + 3) // 4)

    def _enforce_input_token_ceiling(self, payload: dict[str, Any]) -> None:
        product = str(payload.get("product", "")).strip().lower()
        prompt = str(payload.get("prompt", "")).strip()
        estimated_tokens = self._estimate_input_tokens(prompt)
        ceiling = self._token_ceiling_for_product(product)
        if estimated_tokens > ceiling:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"Prompt exceeds token ceiling for product '{product or 'default'}' "
                f"({estimated_tokens}>{ceiling})",
            )

    async def health(self) -> dict[str, Any]:
        redis_ok = await self.redis_cache.ping()
        breaker_status = await self.breaker.status()
        memory = self.memory_guard.snapshot()
        healthy = redis_ok and memory["healthy"]
        return {
            "status": "ok" if healthy else "degraded",
            "redis": {"ok": redis_ok},
            "memory": memory,
            "circuit_breaker": breaker_status,
            "timeouts": {
                "groq_seconds": self.providers.groq_timeout_seconds,
                "global_seconds": self.global_timeout_seconds,
            },
            "policy": {
                "cache_ttl_seconds": self.redis_cache.cache_ttl_seconds,
                "dedupe_window_ms": self.dedupe_window_ms,
                "claude_cap_ratio": self.redis_cache.claude_cap_ratio,
            },
        }

    @staticmethod
    def _build_response(
        request_id: str, base: dict[str, Any], *, cached: bool, deduped: bool
    ) -> dict[str, Any]:
        return {
            "request_id": request_id,
            "provider": base["provider"],
            "route": base["route"],
            "output": base["output"],
            "cached": cached,
            "deduped": deduped,
            "claude_escalated": bool(base.get("claude_escalated", False)),
        }
