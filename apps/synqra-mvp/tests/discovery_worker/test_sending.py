import unittest
from unittest.mock import Mock

from services.discovery_worker.sending import send_from_queue


class _FakeCursor:
    def __init__(self):
        self.executed = []
        self._rows = [("draft-1", "allowed@example.com", "Subject", "Body")]

    def execute(self, sql, params=None):
        self.executed.append((sql, params))

    def fetchall(self):
        return list(self._rows)

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


class SendingTests(unittest.TestCase):
    def test_claim_query_uses_safe_view(self) -> None:
        conn = _FakeConnection()
        send_fn = Mock()
        result = send_from_queue(
            connection=conn,
            schema="ops_realtors",
            send_email_fn=send_fn,
            limit=10,
            global_sending_enabled=True,
            campaign_status="active",
        )

        first_sql = conn.cursor_obj.executed[0][0]
        self.assertIn("email_drafts_safe", first_sql)
        self.assertEqual(result["sent"], 1)
        send_fn.assert_called_once_with("allowed@example.com", "Subject", "Body")

    def test_suppressed_email_not_sent_when_view_filters_it(self) -> None:
        conn = _FakeConnection()
        # Safe view returns only unsuppressed row; suppressed recipient never enters sender loop.
        conn.cursor_obj._rows = [("draft-2", "ok@example.com", "S", "B")]
        send_fn = Mock()
        send_from_queue(
            connection=conn,
            schema="ops_realtors",
            send_email_fn=send_fn,
            limit=10,
            global_sending_enabled=True,
            campaign_status="active",
        )
        self.assertEqual(send_fn.call_count, 1)
        self.assertEqual(send_fn.call_args[0][0], "ok@example.com")


if __name__ == "__main__":
    unittest.main()

