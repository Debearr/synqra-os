import json
from typing import Any

from .unsubscribe_token import build_unsubscribe_link


def build_draft_email(
    lead_id: str,
    to_email: str,
    enrichment_context: dict[str, Any],
    prompt_version: str,
) -> dict[str, Any]:
    """Create a draft payload from enrichment context with send disabled by default."""
    subject = _subject_from_context(enrichment_context)
    body = _body_from_context(enrichment_context)
    unsubscribe_url = build_unsubscribe_link(to_email)
    body_with_footer = f"{body}\n\nUnsubscribe: {unsubscribe_url}"

    return {
        "lead_id": lead_id,
        "to_email": to_email,
        "subject": subject,
        "body": body_with_footer,
        "enrichment_context": json.dumps(enrichment_context),
        "prompt_version": prompt_version,
        "send_flag": False,
        "approval_status": "pending",
    }


def _subject_from_context(enrichment_context: dict[str, Any]) -> str:
    business_name = _as_text(enrichment_context.get("business_name")) or "your business"
    return f"Quick idea for {business_name}"


def _body_from_context(enrichment_context: dict[str, Any]) -> str:
    highlights = enrichment_context.get("highlights")
    if isinstance(highlights, list):
        clean_points = [str(point).strip() for point in highlights if str(point).strip()]
    else:
        clean_points = []

    if clean_points:
        bullets = "\n".join(f"- {point}" for point in clean_points[:3])
        return f"Noticed a few opportunities:\n{bullets}"
    return "Noticed a few opportunities worth sharing."


def _as_text(value: Any) -> str | None:
    if isinstance(value, str):
        stripped = value.strip()
        if stripped:
            return stripped
    return None
