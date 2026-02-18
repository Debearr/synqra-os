import unittest

from services.discovery_worker.enrichment import enrich_leads


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


class _FakeOllama:
    def __init__(self, healthy=True, timeout=False, payload=None):
        self._healthy = healthy
        self._timeout = timeout
        self._payload = payload or {"opportunity_score": 72, "summary": "ok", "highlights": ["x"]}
        self.calls = 0

    def health_check(self):
        return self._healthy

    def generate_enrichment(self, _prompt):
        self.calls += 1
        if self._timeout:
            raise TimeoutError("timeout")
        return self._payload


class _FakeGroq:
    def __init__(self, payload=None):
        self._payload = payload or {"opportunity_score": 68, "summary": "groq", "highlights": ["g"]}
        self.calls = 0

    def is_configured(self):
        return True

    def generate_enrichment(self, _prompt):
        self.calls += 1
        return self._payload


class EnrichmentTests(unittest.TestCase):
    def test_score_below_threshold_marks_low_score(self) -> None:
        conn = _FakeConnection()
        ollama = _FakeOllama(payload={"opportunity_score": 35, "summary": "low", "highlights": []})
        result = enrich_leads(
            connection=conn,
            table_name="ops_realtors.enrichment",
            leads=[{"id": "lead-1", "name": "A"}],
            prompt_version="v1",
            vertical="realtor",
            ollama_client=ollama,
            groq_client=None,
            sleep_fn=lambda _: None,
        )
        self.assertEqual(result["low_score"], 1)
        payload = conn.cursor_obj.calls[0][1]
        self.assertEqual(payload["enrichment_status"], "low_score")

    def test_score_above_threshold_marks_complete(self) -> None:
        conn = _FakeConnection()
        ollama = _FakeOllama(payload={"opportunity_score": 80, "summary": "high", "highlights": []})
        result = enrich_leads(
            connection=conn,
            table_name="ops_realtors.enrichment",
            leads=[{"id": "lead-1", "name": "A"}],
            prompt_version="v1",
            vertical="realtor",
            ollama_client=ollama,
            groq_client=None,
            sleep_fn=lambda _: None,
        )
        self.assertEqual(result["complete"], 1)
        payload = conn.cursor_obj.calls[0][1]
        self.assertEqual(payload["enrichment_status"], "complete")

    def test_groq_fallback_triggers_only_when_ollama_fails(self) -> None:
        conn = _FakeConnection()
        ollama = _FakeOllama(healthy=False)
        groq = _FakeGroq(payload={"opportunity_score": 77, "summary": "fallback", "highlights": ["a"]})
        enrich_leads(
            connection=conn,
            table_name="ops_realtors.enrichment",
            leads=[{"id": "lead-1"}],
            prompt_version="v1",
            vertical="realtor",
            ollama_client=ollama,
            groq_client=groq,
            sleep_fn=lambda _: None,
        )
        payload = conn.cursor_obj.calls[0][1]
        self.assertEqual(payload["model_used"], "groq")
        self.assertEqual(groq.calls, 1)
        self.assertEqual(ollama.calls, 0)

    def test_model_used_persisted_as_ollama_when_healthy(self) -> None:
        conn = _FakeConnection()
        ollama = _FakeOllama(healthy=True)
        groq = _FakeGroq()
        enrich_leads(
            connection=conn,
            table_name="ops_realtors.enrichment",
            leads=[{"id": "lead-1"}],
            prompt_version="v1",
            vertical="realtor",
            ollama_client=ollama,
            groq_client=groq,
            sleep_fn=lambda _: None,
        )
        payload = conn.cursor_obj.calls[0][1]
        self.assertEqual(payload["model_used"], "ollama")
        self.assertEqual(ollama.calls, 1)
        self.assertEqual(groq.calls, 0)


if __name__ == "__main__":
    unittest.main()

