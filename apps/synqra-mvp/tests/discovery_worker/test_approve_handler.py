import json
import os
import unittest
from unittest.mock import patch

from services.discovery_worker.approve_handler import approve_handler, _reset_rate_limiter_for_tests


class _FakeRequest:
    def __init__(self, payload, method="POST", headers=None):
        self._payload = payload
        self.method = method
        self.headers = headers or {}

    def get_json(self, silent=True):
        return self._payload


class _FakeCursor:
    def __init__(self, row=None, update_rowcount=1):
        self._row = row
        self.update_rowcount = update_rowcount
        self.executed = []
        self.rowcount = 0

    def execute(self, sql, params=None):
        self.executed.append((sql, params))
        if sql.strip().upper().startswith("UPDATE"):
            self.rowcount = self.update_rowcount

    def fetchone(self):
        return self._row

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False


class _FakeConnection:
    def __init__(self, cursor):
        self._cursor = cursor
        self.committed = False

    def cursor(self):
        return self._cursor

    def commit(self):
        self.committed = True


class ApproveHandlerTests(unittest.TestCase):
    def setUp(self) -> None:
        os.environ["APPROVAL_ENDPOINT_SECRET"] = "top-secret"
        _reset_rate_limiter_for_tests()

    def tearDown(self) -> None:
        if "APPROVAL_ENDPOINT_SECRET" in os.environ:
            del os.environ["APPROVAL_ENDPOINT_SECRET"]
        _reset_rate_limiter_for_tests()

    def test_method_must_be_post(self) -> None:
        body, status, _headers = approve_handler(_FakeRequest({}, method="GET"))
        self.assertEqual(status, 405)
        self.assertEqual(json.loads(body)["error"], "method_not_allowed")

    def test_secret_auth_required(self) -> None:
        body, status, _headers = approve_handler(_FakeRequest({}, headers={"X-Approve-Secret": "wrong"}))
        self.assertEqual(status, 401)
        self.assertEqual(json.loads(body)["error"], "unauthorized")

    def test_idempotent_when_already_approved(self) -> None:
        conn = _FakeConnection(_FakeCursor(row=("d1", True)))
        request = _FakeRequest(
            {
                "draft_id": "d1",
                "db_connection": conn,
                "table_name": "ops_realtors.email_drafts",
            },
            headers={"X-Approve-Secret": "top-secret"},
        )
        body, status, _headers = approve_handler(request)
        parsed = json.loads(body)
        self.assertEqual(status, 200)
        self.assertEqual(parsed["status"], "already_approved")
        self.assertFalse(parsed["updated"])

    def test_flip_send_flag_true_without_sent_at(self) -> None:
        cursor = _FakeCursor(row=("d2", False), update_rowcount=1)
        conn = _FakeConnection(cursor)
        request = _FakeRequest(
            {
                "draft_id": "d2",
                "approved_by": "founder-user",
                "db_connection": conn,
                "table_name": "ops_realtors.email_drafts",
            },
            headers={"X-Approve-Secret": "top-secret"},
        )

        with patch("services.discovery_worker.approve_handler.logging.getLogger") as get_logger:
            logger = get_logger.return_value
            body, status, _headers = approve_handler(request)

        parsed = json.loads(body)
        self.assertEqual(status, 200)
        self.assertEqual(parsed["status"], "approved")
        self.assertTrue(conn.committed)
        update_sql = cursor.executed[1][0]
        self.assertIn("SET send_flag = TRUE", update_sql)
        self.assertNotIn("sent_at", update_sql.lower())
        self.assertGreaterEqual(logger.info.call_count, 1)

    def test_not_found_logs_event(self) -> None:
        conn = _FakeConnection(_FakeCursor(row=None))
        request = _FakeRequest(
            {"draft_id": "missing", "db_connection": conn},
            headers={"X-Approve-Secret": "top-secret"},
        )

        with patch("services.discovery_worker.approve_handler.logging.getLogger") as get_logger:
            logger = get_logger.return_value
            body, status, _headers = approve_handler(request)

        parsed = json.loads(body)
        self.assertEqual(status, 200)
        self.assertEqual(parsed["status"], "not_found")
        self.assertGreaterEqual(logger.info.call_count, 1)

    def test_rate_limit_exceeded_returns_429(self) -> None:
        request = _FakeRequest(
            {"draft_id": "d1", "db_connection": _FakeConnection(_FakeCursor(row=("d1", True)))},
            headers={"X-Approve-Secret": "top-secret", "X-Forwarded-For": "203.0.113.10"},
        )
        for _ in range(50):
            _body, status, _headers = approve_handler(request)
            self.assertEqual(status, 200)

        with patch("services.discovery_worker.approve_handler.logging.getLogger") as get_logger:
            logger = get_logger.return_value
            body, status, _headers = approve_handler(request)

        self.assertEqual(status, 429)
        self.assertEqual(json.loads(body)["error"], "rate_limited")
        logger.info.assert_called()

    def test_rate_limit_is_per_ip(self) -> None:
        limited_request = _FakeRequest(
            {"draft_id": "d1", "db_connection": _FakeConnection(_FakeCursor(row=("d1", True)))},
            headers={"X-Approve-Secret": "top-secret", "X-Forwarded-For": "203.0.113.10"},
        )
        other_ip_request = _FakeRequest(
            {"draft_id": "d1", "db_connection": _FakeConnection(_FakeCursor(row=("d1", True)))},
            headers={"X-Approve-Secret": "top-secret", "X-Forwarded-For": "203.0.113.11"},
        )

        for _ in range(50):
            approve_handler(limited_request)
        _body, status_limited, _headers = approve_handler(limited_request)
        _body, status_other, _headers = approve_handler(other_ip_request)

        self.assertEqual(status_limited, 429)
        self.assertEqual(status_other, 200)


if __name__ == "__main__":
    unittest.main()
