import json
import unittest
from datetime import datetime, timezone

from services.discovery_worker.cron_digest import cron_digest


class _FakeRequest:
    def __init__(self, payload, method="POST"):
        self._payload = payload
        self.method = method

    def get_json(self, silent=True):
        return self._payload


class _FakeCursor:
    def __init__(self, counts):
        self._counts = counts
        self._index = 0
        self.executed = []

    def execute(self, sql):
        self.executed.append(sql)

    def fetchone(self):
        value = self._counts[self._index]
        self._index += 1
        return (value,)

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False


class _FakeConnection:
    def __init__(self, counts):
        self.cursor_obj = _FakeCursor(counts)

    def cursor(self):
        return self.cursor_obj


class CronDigestTests(unittest.TestCase):
    def test_skips_outside_8am_window(self) -> None:
        conn = _FakeConnection([2, 3])
        sent = []
        request = _FakeRequest(
            {
                "db_connection": conn,
                "send_email_fn": lambda *_args: sent.append(True),
                "founder_email": "founder@example.com",
                "now_utc": datetime(2026, 2, 17, 7, 0, tzinfo=timezone.utc),
            }
        )
        body, status, _headers = cron_digest(request)
        self.assertEqual(status, 200)
        self.assertEqual(json.loads(body)["status"], "skipped")
        self.assertEqual(sent, [])

    def test_sends_digest_at_8am_with_ops_link(self) -> None:
        conn = _FakeConnection([2, 3])
        sent = []

        def send_email(to, subject, body):
            sent.append((to, subject, body))

        request = _FakeRequest(
            {
                "db_connection": conn,
                "send_email_fn": send_email,
                "founder_email": "founder@example.com",
                "ops_url": "https://app.example.com/ops",
                "now_utc": datetime(2026, 2, 17, 8, 5, tzinfo=timezone.utc),
                "table_names": ["ops_realtors.email_drafts", "ops_travel.email_drafts"],
            }
        )
        body, status, _headers = cron_digest(request)
        parsed = json.loads(body)

        self.assertEqual(status, 200)
        self.assertEqual(parsed["status"], "sent")
        self.assertEqual(parsed["pending_drafts"], 5)
        self.assertEqual(len(sent), 1)
        self.assertIn("/ops", sent[0][2])


if __name__ == "__main__":
    unittest.main()

