import os
import unittest

from services.discovery_worker import sentry_support
from services.discovery_worker.sentry_support import with_sentry_guard


class _FakeRequest:
    def __init__(self, payload):
        self._payload = payload

    def get_json(self, silent=True):
        return self._payload


class SentrySupportTests(unittest.TestCase):
    def setUp(self) -> None:
        self._old_dsn = os.environ.pop("SENTRY_DSN", None)
        sentry_support._SENTRY_INITIALIZED = False

    def tearDown(self) -> None:
        if self._old_dsn is not None:
            os.environ["SENTRY_DSN"] = self._old_dsn
        else:
            os.environ.pop("SENTRY_DSN", None)
        sentry_support._SENTRY_INITIALIZED = False

    def test_wrapper_does_not_crash_when_dsn_missing(self) -> None:
        @with_sentry_guard(job_name="test_job", service="ops_worker")
        def handler(_request):
            raise RuntimeError("boom")

        body, status, headers = handler(_FakeRequest({"run_id": "r1", "vertical": "realtor"}))
        self.assertEqual(status, 500)
        self.assertEqual(headers["Content-Type"], "application/json")
        self.assertIn("internal_error", body)


if __name__ == "__main__":
    unittest.main()

