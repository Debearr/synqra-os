import unittest

from services.discovery_worker.email_extraction import extract_emails, extract_primary_email


class EmailExtractionTests(unittest.TestCase):
    def test_extract_emails_safe_parsing(self) -> None:
        raw = "<p>Contact: Sales@Example.com</p><a href='mailto:team@example.com'>Email</a>"
        emails = extract_emails(raw)
        self.assertEqual(emails, ["sales@example.com", "team@example.com"])

    def test_extract_emails_handles_empty_and_none(self) -> None:
        self.assertEqual(extract_emails(None), [])
        self.assertEqual(extract_emails(""), [])

    def test_extract_primary_email_first_available(self) -> None:
        value = extract_primary_email(None, "No email here", "hello@site.com")
        self.assertEqual(value, "hello@site.com")


if __name__ == "__main__":
    unittest.main()

