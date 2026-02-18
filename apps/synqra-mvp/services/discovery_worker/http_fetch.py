import json
import time
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass
from threading import BoundedSemaphore
from typing import Any, Callable
from urllib.error import HTTPError
from urllib.parse import urlencode
from urllib.request import Request, urlopen


@dataclass(frozen=True)
class HttpFetchConfig:
    timeout_seconds: float = 10.0
    max_concurrent_requests: int = 5
    max_retries: int = 3
    backoff_base_seconds: float = 0.5


class HttpFetcher:
    def __init__(
        self,
        config: HttpFetchConfig | None = None,
        opener: Callable[..., Any] = urlopen,
        sleep_fn: Callable[[float], None] = time.sleep,
    ) -> None:
        self.config = config or HttpFetchConfig()
        self._opener = opener
        self._sleep = sleep_fn
        self._semaphore = BoundedSemaphore(self.config.max_concurrent_requests)

    def fetch_json(
        self,
        url: str,
        params: dict[str, Any] | None = None,
        headers: dict[str, str] | None = None,
    ) -> dict[str, Any]:
        request_url = _build_request_url(url, params)
        request = Request(
            request_url,
            headers={"Accept": "application/json", **(headers or {})},
        )

        attempt = 0
        while True:
            try:
                with self._semaphore:
                    with self._opener(request, timeout=self.config.timeout_seconds) as response:
                        body = response.read().decode("utf-8")
                        return json.loads(body) if body else {}
            except HTTPError as exc:
                if not _is_retryable_status(exc.code) or attempt >= self.config.max_retries:
                    raise
                self._sleep(self.config.backoff_base_seconds * (2**attempt))
                attempt += 1

    def fetch_json_batch(
        self,
        requests: list[tuple[str, dict[str, Any] | None, dict[str, str] | None]],
    ) -> list[dict[str, Any]]:
        with ThreadPoolExecutor(max_workers=self.config.max_concurrent_requests) as pool:
            futures = [
                pool.submit(self.fetch_json, url, params, headers)
                for url, params, headers in requests
            ]
            return [future.result() for future in futures]


def _build_request_url(url: str, params: dict[str, Any] | None) -> str:
    if not params:
        return url
    return f"{url}?{urlencode(params)}"


def _is_retryable_status(status_code: int) -> bool:
    return status_code == 429 or 500 <= status_code <= 599

