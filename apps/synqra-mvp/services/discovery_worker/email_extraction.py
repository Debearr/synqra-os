import html
import re

EMAIL_PATTERN = re.compile(r"\b[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[A-Za-z]{2,}\b")
MAILTO_PATTERN = re.compile(r"mailto:([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[A-Za-z]{2,})", re.IGNORECASE)
TAG_PATTERN = re.compile(r"<[^>]+>")


def extract_emails(raw_value: str | None) -> list[str]:
    if not raw_value:
        return []

    decoded = html.unescape(raw_value)
    safe_text = TAG_PATTERN.sub(" ", decoded)
    emails = {match.group(0).lower() for match in EMAIL_PATTERN.finditer(safe_text)}
    emails.update(match.group(1).lower() for match in MAILTO_PATTERN.finditer(decoded))
    return sorted(emails)


def extract_primary_email(*values: str | None) -> str | None:
    for value in values:
        emails = extract_emails(value)
        if emails:
            return emails[0]
    return None

