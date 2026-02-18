import os
import unittest
from typing import Any
from unittest.mock import Mock

from services.discovery_worker.approve_handler import approve_handler, _reset_rate_limiter_for_tests
from services.discovery_worker.discovery import upsert_discovered_places
from services.discovery_worker.drafting import build_draft_email


class _FakeRequest:
    def __init__(self, payload: dict[str, Any], headers: dict[str, str] | None = None):
        self._payload = payload
        self.headers = headers or {}
        self.method = "POST"

    def get_json(self, silent=True):
        return self._payload


class _InMemoryDb:
    def __init__(self) -> None:
        self.leads: dict[str, dict[str, Any]] = {}
        self.enrichment: dict[str, dict[str, Any]] = {}
        self.email_drafts: dict[str, dict[str, Any]] = {}
        self.suppression_list: set[str] = set()
        self._draft_counter = 0

    def cursor(self):
        return _InMemoryCursor(self)

    def commit(self) -> None:
        return None

    def next_draft_id(self) -> str:
        self._draft_counter += 1
        return f"draft-{self._draft_counter}"


class _InMemoryCursor:
    def __init__(self, db: _InMemoryDb) -> None:
        self._db = db
        self._result: Any = None
        self.rowcount = 0

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False

    def execute(self, sql: str, params: dict[str, Any] | None = None) -> None:
        normalized = " ".join(sql.lower().split())
        self.rowcount = 0

        if normalized.startswith("insert into") and ".leads" in normalized:
            place_id = str((params or {}).get("place_id", "")).strip()
            if not place_id:
                return
            if place_id in self._db.leads:
                return
            self._db.leads[place_id] = {
                "place_id": place_id,
                "name": (params or {}).get("name"),
                "website_url": (params or {}).get("website_url"),
                "city": (params or {}).get("city"),
                "primary_email": (params or {}).get("primary_email"),
            }
            self.rowcount = 1
            return

        if normalized.startswith("select id, send_flag from") and ".email_drafts" in normalized:
            draft_id = str((params or {}).get("draft_id", "")).strip()
            draft = self._db.email_drafts.get(draft_id)
            self._result = None if not draft else (draft["id"], draft["send_flag"])
            return

        if normalized.startswith("update") and ".email_drafts" in normalized and "set send_flag = true" in normalized:
            draft_id = str((params or {}).get("draft_id", "")).strip()
            draft = self._db.email_drafts.get(draft_id)
            if draft and not draft.get("send_flag"):
                draft["send_flag"] = True
                draft["approval_status"] = "approved"
                draft["approved_by"] = (params or {}).get("approved_by")
                draft["approved_at"] = (params or {}).get("approved_at")
                self.rowcount = 1
            return

        raise AssertionError(f"Unexpected SQL executed in e2e test: {sql}")

    def fetchone(self):
        return self._result


class E2EPipelineTests(unittest.TestCase):
    def setUp(self) -> None:
        os.environ["APPROVAL_ENDPOINT_SECRET"] = "top-secret"
        _reset_rate_limiter_for_tests()

    def tearDown(self) -> None:
        if "APPROVAL_ENDPOINT_SECRET" in os.environ:
            del os.environ["APPROVAL_ENDPOINT_SECRET"]
        _reset_rate_limiter_for_tests()

    def test_end_to_end_pipeline_is_deterministic_and_suppression_blocks_send(self) -> None:
        db = _InMemoryDb()

        # 1) Insert mock leads / 2) run discovery with mocked Places response.
        places_mock = Mock(
            return_value=[
                {
                    "place_id": "p-1",
                    "name": "North Realty",
                    "website": "https://north.example.com",
                    "city": "Austin",
                    "website_text": "hello@north.example.com",
                },
                {
                    "place_id": "p-2",
                    "name": "South Realty",
                    "website": "https://south.example.com",
                    "city": "Austin",
                    "website_text": "hello@south.example.com",
                },
            ]
        )
        discovered_places = places_mock("Austin", "realtor")
        inserted = upsert_discovered_places(db, "ops_realtors.leads", discovered_places)
        self.assertEqual(inserted, 2)
        self.assertEqual(len(db.leads), 2)

        # 3) Run enrichment with mocked Ollama output.
        ollama_mock = Mock(
            side_effect=[
                {"opportunity_score": 82, "highlights": ["Tighten opening hook"]},
                {"opportunity_score": 77, "highlights": ["Add social proof"]},
            ]
        )
        for lead in db.leads.values():
            output = ollama_mock(lead)
            db.enrichment[lead["place_id"]] = {
                "lead_id": lead["place_id"],
                "opportunity_score": output["opportunity_score"],
                "highlights": output["highlights"],
                "enrichment_status": "complete" if output["opportunity_score"] >= 40 else "low_score",
            }

        # 4) Generate drafts for enriched leads.
        for lead_id, enrichment in db.enrichment.items():
            if enrichment["enrichment_status"] != "complete":
                continue
            lead = db.leads[lead_id]
            draft = build_draft_email(
                lead_id=lead_id,
                to_email=str(lead["primary_email"]),
                enrichment_context={
                    "business_name": lead["name"],
                    "highlights": enrichment["highlights"],
                },
                prompt_version="v1",
            )
            draft_id = db.next_draft_id()
            db.email_drafts[draft_id] = {
                "id": draft_id,
                **draft,
                "sent_at": None,
                "approved_by": None,
                "approved_at": None,
            }

        self.assertEqual(len(db.email_drafts), 2)

        # 5) Approve drafts.
        for draft_id in list(db.email_drafts.keys()):
            request = _FakeRequest(
                {
                    "draft_id": draft_id,
                    "table_name": "ops_realtors.email_drafts",
                    "db_connection": db,
                },
                headers={"X-Approve-Secret": "top-secret", "X-Forwarded-For": "198.51.100.10"},
            )
            _body, status, _headers = approve_handler(request)
            self.assertEqual(status, 200)

        # 6) Send drafts with mocked SMTP.
        suppressed_email = "hello@south.example.com"
        db.suppression_list.add(suppressed_email)
        smtp_mock = Mock()
        sent_count = _send_approved_drafts(db, smtp_mock)

        # 7) Verify sent_at written.
        self.assertEqual(sent_count, 1)
        sent_rows = [row for row in db.email_drafts.values() if row["sent_at"] is not None]
        self.assertEqual(len(sent_rows), 1)
        self.assertEqual(sent_rows[0]["to_email"], "hello@north.example.com")

        # 8) Verify suppression blocks send.
        blocked_rows = [
            row
            for row in db.email_drafts.values()
            if row["to_email"] == suppressed_email and row["sent_at"] is None
        ]
        self.assertEqual(len(blocked_rows), 1)
        smtp_mock.assert_called_once()
        self.assertEqual(smtp_mock.call_args[0][0], "hello@north.example.com")

        # External services were mocked and invoked deterministically.
        self.assertEqual(places_mock.call_count, 1)
        self.assertEqual(ollama_mock.call_count, 2)


def _send_approved_drafts(db: _InMemoryDb, smtp_send: Mock) -> int:
    sent = 0
    for draft_id in sorted(db.email_drafts.keys()):
        draft = db.email_drafts[draft_id]
        if not draft.get("send_flag"):
            continue
        if draft.get("sent_at") is not None:
            continue

        to_email = str(draft.get("to_email", "")).strip().lower()
        if to_email in db.suppression_list:
            continue

        smtp_send(to_email, draft.get("subject"), draft.get("body"))
        draft["sent_at"] = "2026-02-17T08:00:00+00:00"
        sent += 1

    return sent


if __name__ == "__main__":
    unittest.main()
