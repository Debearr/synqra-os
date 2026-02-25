import asyncio
import time


class CircuitBreaker:
    """Simple async circuit breaker for Groq rate-limit protection."""

    def __init__(self, threshold_429: int = 2, open_seconds: int = 60) -> None:
        self.threshold_429 = threshold_429
        self.open_seconds = open_seconds
        self._consecutive_429 = 0
        self._open_until = 0.0
        self._lock = asyncio.Lock()

    async def is_open(self) -> bool:
        async with self._lock:
            return time.time() < self._open_until

    async def record_rate_limited(self) -> None:
        async with self._lock:
            self._consecutive_429 += 1
            if self._consecutive_429 >= self.threshold_429:
                self._open_until = time.time() + self.open_seconds

    async def record_success(self) -> None:
        async with self._lock:
            self._consecutive_429 = 0
            self._open_until = 0.0

    async def record_non_429(self) -> None:
        async with self._lock:
            self._consecutive_429 = 0

    async def status(self) -> dict:
        async with self._lock:
            now = time.time()
            return {
                "consecutive_429": self._consecutive_429,
                "open": now < self._open_until,
                "retry_after_seconds": max(0, int(self._open_until - now)),
            }
