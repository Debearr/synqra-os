import os
from typing import Any
from urllib.request import Request, urlopen

GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions"
DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile"


class GroqEnrichmentClient:
    def __init__(self, api_key: str | None = None, model: str | None = None, timeout_seconds: float = 20.0) -> None:
        self._api_key = (api_key or os.getenv("GROQ_API_KEY", "")).strip()
        self._model = (model or os.getenv("GROQ_MODEL", DEFAULT_GROQ_MODEL)).strip() or DEFAULT_GROQ_MODEL
        self._timeout_seconds = timeout_seconds

    @property
    def model_name(self) -> str:
        return self._model

    def is_configured(self) -> bool:
        return bool(self._api_key)

    def generate_enrichment(self, prompt: str) -> dict[str, Any]:
        if not self._api_key:
            raise RuntimeError("GROQ_API_KEY is not configured")

        payload = {
            "model": self._model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.2,
        }
        import json

        request = Request(
            GROQ_CHAT_URL,
            data=json.dumps(payload).encode("utf-8"),
            method="POST",
            headers={"Authorization": f"Bearer {self._api_key}", "Content-Type": "application/json"},
        )
        with urlopen(request, timeout=self._timeout_seconds) as response:
            body = response.read().decode("utf-8")
        response = json.loads(body)
        return _extract_json_from_response(response)


def _extract_json_from_response(response: dict[str, Any]) -> dict[str, Any]:
    choices = response.get("choices")
    if not isinstance(choices, list) or not choices:
        raise RuntimeError("Groq response missing choices")
    first = choices[0]
    message = first.get("message") if isinstance(first, dict) else None
    content = message.get("content") if isinstance(message, dict) else None
    if not isinstance(content, str):
        raise RuntimeError("Groq response missing message content")

    import json

    return json.loads(content)
