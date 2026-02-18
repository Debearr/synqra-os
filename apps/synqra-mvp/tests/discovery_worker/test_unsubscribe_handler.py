import os
import unittest

from services.discovery_worker.unsubscribe_handler import unsubscribe_handler
from services.discovery_worker.unsubscribe_token import create_unsubscribe_token


class _FakeArgs(dict):
    def get(self, key, default=None):
        return super().get(key, default)


class _FakeRequest:
    def __init__(self, token: str, connection):
        self.args = _FakeArgs({"t": token})
        self._connection = connection

    def get_json(self, silent=True):
        return {"db_connection": self._connection}


class _FakeCursor:
    def __init__(self, storage: set[str]):
        self.storage = storage
        self.rowcount = 0

    def execute(self, sql, params=None):
        email = (params or {}).get("email")
        if email not in self.storage:
            self.storage.add(email)
            self.rowcount = 1
        else:
            self.rowcount = 0

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False


class _FakeConnection:
    def __init__(self):
        self.suppressed: set[str] = set()
        self.commits = 0

    def cursor(self):
        return _FakeCursor(self.suppressed)

    def commit(self):
        self.commits += 1


class UnsubscribeHandlerTests(unittest.TestCase):
    def setUp(self) -> None:
        os.environ["UNSUBSCRIBE_TOKEN_SECRET"] = "secret"

    def tearDown(self) -> None:
        os.environ.pop("UNSUBSCRIBE_TOKEN_SECRET", None)

    def test_suppression_write_and_idempotency(self) -> None:
        conn = _FakeConnection()
        token = create_unsubscribe_token("person@example.com", secret="secret")
        request = _FakeRequest(token, conn)

        body1, status1, _headers1 = unsubscribe_handler(request)
        body2, status2, _headers2 = unsubscribe_handler(request)

        self.assertEqual(status1, 200)
        self.assertEqual(status2, 200)
        self.assertIn("unsubscribed", body1.lower())
        self.assertEqual(conn.suppressed, {"person@example.com"})


if __name__ == "__main__":
    unittest.main()

