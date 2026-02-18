import json
import unittest
from unittest.mock import patch

from services.discovery_worker.cron_discover import cron_discover


class _FakeRequest:
    def __init__(self, payload):
        self._payload = payload

    def get_json(self, silent=True):
        return self._payload


class _FakeCursor:
    def __init__(self):
        self.calls = []

    def execute(self, sql, params=None):
        self.calls.append((sql, params))

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False


class _FakeConnection:
    def __init__(self):
        self.cursor_obj = _FakeCursor()
        self.commits = 0

    def cursor(self):
        return self.cursor_obj

    def commit(self):
        self.commits += 1


class CronDiscoverTests(unittest.TestCase):
    def test_missing_required_fields(self) -> None:
        body, status, _headers = cron_discover(_FakeRequest({}))
        self.assertEqual(status, 400)
        parsed = json.loads(body)
        self.assertIn("error", parsed)

    def test_success_path(self) -> None:
        request = _FakeRequest(
            {
                "api_key": "k",
                "city": "Austin",
                "query": "realtors",
                "table_name": "ops_realtors.leads",
                "db_connection": object(),
            }
        )

        with patch("services.discovery_worker.cron_discover.discover_city", return_value=4) as discover:
            body, status, headers = cron_discover(request)

        self.assertEqual(status, 200)
        self.assertEqual(headers["Content-Type"], "application/json")
        self.assertEqual(json.loads(body)["inserted"], 4)
        discover.assert_called_once()

    def test_zero_leads_triggers_silent_failure_alert(self) -> None:
        sent = []
        conn = _FakeConnection()
        request = _FakeRequest(
            {
                "api_key": "k",
                "city": "Austin",
                "query": "realtors",
                "table_name": "ops_realtors.leads",
                "db_connection": conn,
                "send_email_fn": lambda to, subject, body: sent.append((to, subject, body)),
                "founder_email": "founder@example.com",
            }
        )

        with patch("services.discovery_worker.cron_discover.discover_city", return_value=0):
            body, status, _headers = cron_discover(request)

        parsed = json.loads(body)
        self.assertEqual(status, 200)
        self.assertEqual(parsed["status"], "silent_failure")
        self.assertEqual(len(sent), 1)
        self.assertIn("silent_failure", conn.cursor_obj.calls[0][1]["status"])

    def test_non_zero_leads_does_not_trigger_alert(self) -> None:
        sent = []
        conn = _FakeConnection()
        request = _FakeRequest(
            {
                "api_key": "k",
                "city": "Austin",
                "query": "realtors",
                "table_name": "ops_realtors.leads",
                "db_connection": conn,
                "send_email_fn": lambda *_args: sent.append(True),
                "founder_email": "founder@example.com",
            }
        )

        with patch("services.discovery_worker.cron_discover.discover_city", return_value=3):
            body, status, _headers = cron_discover(request)

        self.assertEqual(status, 200)
        self.assertEqual(json.loads(body)["inserted"], 3)
        self.assertEqual(sent, [])


if __name__ == "__main__":
    unittest.main()
