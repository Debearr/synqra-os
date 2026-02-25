from dataclasses import dataclass
from typing import Any, Mapping


@dataclass
class Classification:
    route: str
    escalate_to_claude: bool
    reason: str


class RequestClassifier:
    """
    Lightweight pre-routing classifier.
    Must run before any provider call.
    """

    _escalation_keywords = (
        "legal",
        "medical",
        "compliance",
        "contract",
        "regulated",
        "breach",
        "incident response",
        "security policy",
    )

    _media_keywords = (
        "image",
        "video",
        "audio",
        "transcribe",
        "voice note",
        "speech",
    )

    def classify(self, payload: Mapping[str, Any]) -> Classification:
        prompt = str(payload.get("prompt", "")).lower()
        media_url = payload.get("media_url")
        metadata = payload.get("metadata") or {}

        has_media = bool(media_url) or bool(metadata.get("is_media"))
        if not has_media:
            has_media = any(token in prompt for token in self._media_keywords)

        if has_media:
            return Classification(route="media", escalate_to_claude=False, reason="media_detected")

        escalate = bool(metadata.get("escalate_to_claude")) or any(
            token in prompt for token in self._escalation_keywords
        )
        reason = "risk_or_policy_prompt" if escalate else "default_text_route"
        return Classification(route="text", escalate_to_claude=escalate, reason=reason)
