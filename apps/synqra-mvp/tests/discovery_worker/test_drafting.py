import unittest

from services.discovery_worker.drafting import build_draft_email


class DraftingTests(unittest.TestCase):
    def test_defaults_send_flag_false(self) -> None:
        payload = build_draft_email(
            lead_id="lead-1",
            to_email="owner@example.com",
            enrichment_context={"business_name": "North Realty", "highlights": ["Stronger listing CTA"]},
            prompt_version="v1",
        )

        self.assertFalse(payload["send_flag"])
        self.assertEqual(payload["approval_status"], "pending")
        self.assertIn("North Realty", payload["subject"])
        self.assertIn("Unsubscribe: ", payload["body"])
        self.assertIn("/ops/unsubscribe?t=", payload["body"])


if __name__ == "__main__":
    unittest.main()
