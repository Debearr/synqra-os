import unittest

from services.discovery_worker.discovery import deduplicate_places, upsert_discovered_places


class _FakeCursor:
    def __init__(self):
        self.calls: list[tuple[str, dict]] = []

    def execute(self, sql: str, payload: dict) -> None:
        self.calls.append((sql, payload))

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False


class _FakeConnection:
    def __init__(self):
        self.cursor_instance = _FakeCursor()
        self.committed = False

    def cursor(self):
        return self.cursor_instance

    def commit(self) -> None:
        self.committed = True


class DiscoveryTests(unittest.TestCase):
    def test_deduplicates_by_place_id_and_website_url(self) -> None:
        places = [
            {"place_id": "p1", "website": "https://example.com"},
            {"place_id": "p1", "website": "https://different.com"},
            {"place_id": "p2", "website": "example.com"},
            {"place_id": "p3", "website": "https://unique.com"},
        ]
        deduped = deduplicate_places(places)
        self.assertEqual(len(deduped), 2)
        self.assertEqual(deduped[0]["place_id"], "p1")
        self.assertEqual(deduped[1]["place_id"], "p3")

    def test_upsert_uses_on_conflict_do_nothing(self) -> None:
        conn = _FakeConnection()
        rows = [
            {"place_id": "p1", "name": "A", "website": "https://a.com", "city": "Austin"},
            {"place_id": "p2", "name": "B", "website": "https://b.com", "city": "Austin"},
        ]

        inserted = upsert_discovered_places(conn, "ops_realtors.leads", rows)

        self.assertEqual(inserted, 2)
        self.assertTrue(conn.committed)
        self.assertEqual(len(conn.cursor_instance.calls), 2)
        self.assertIn("ON CONFLICT (place_id) DO NOTHING", conn.cursor_instance.calls[0][0])


if __name__ == "__main__":
    unittest.main()

