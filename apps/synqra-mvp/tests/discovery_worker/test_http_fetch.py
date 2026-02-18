import io
import json
import unittest
from unittest.mock import MagicMock, patch
from urllib.error import HTTPError

from services.discovery_worker.http_fetch import HttpFetchConfig, HttpFetcher


class _FakeResponse:
    def __init__(self, payload: dict):
        self._body = json.dumps(payload).encode("utf-8")

    def read(self) -> bytes:
        return self._body

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False


class HttpFetchTests(unittest.TestCase):
    def test_retries_429_then_succeeds(self) -> None:
        attempts = {"count": 0}
        sleeps: list[float] = []

        def opener(_request, timeout):
            self.assertEqual(timeout, 7.5)
            attempts["count"] += 1
            if attempts["count"] < 3:
                raise HTTPError("http://x", 429, "Too Many Requests", hdrs=None, fp=io.BytesIO(b"{}"))
            return _FakeResponse({"ok": True})

        fetcher = HttpFetcher(
            config=HttpFetchConfig(timeout_seconds=7.5, max_retries=3, backoff_base_seconds=0.25),
            opener=opener,
            sleep_fn=sleeps.append,
        )

        payload = fetcher.fetch_json("http://x")
        self.assertEqual(payload, {"ok": True})
        self.assertEqual(attempts["count"], 3)
        self.assertEqual(sleeps, [0.25, 0.5])

    def test_stops_after_max_retries(self) -> None:
        def opener(_request, timeout=None):
            raise HTTPError("http://x", 500, "Server Error", hdrs=None, fp=io.BytesIO(b"{}"))

        fetcher = HttpFetcher(config=HttpFetchConfig(max_retries=3), opener=opener, sleep_fn=lambda _: None)

        with self.assertRaises(HTTPError):
            fetcher.fetch_json("http://x")

    def test_batch_uses_configured_max_workers(self) -> None:
        fetcher = HttpFetcher(config=HttpFetchConfig(max_concurrent_requests=7), opener=lambda *_args, **_kwargs: _FakeResponse({"ok": True}))

        with patch("services.discovery_worker.http_fetch.ThreadPoolExecutor") as pool_cls:
            pool = MagicMock()
            future = MagicMock()
            future.result.return_value = {"ok": True}
            pool.submit.return_value = future
            pool.__enter__.return_value = pool
            pool.__exit__.return_value = False
            pool_cls.return_value = pool

            result = fetcher.fetch_json_batch([("http://x", None, None)])

        pool_cls.assert_called_once_with(max_workers=7)
        self.assertEqual(result, [{"ok": True}])


if __name__ == "__main__":
    unittest.main()
