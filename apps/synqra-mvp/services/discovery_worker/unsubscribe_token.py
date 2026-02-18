import base64
import hashlib
import hmac
import json
import os
from typing import Any


def create_unsubscribe_token(email: str, secret: str | None = None) -> str:
    normalized_email = _normalize_email(email)
    if not normalized_email:
        raise ValueError("email is required")

    payload_json = json.dumps({"email": normalized_email}, separators=(",", ":")).encode("utf-8")
    payload_b64 = _base64url_encode(payload_json)
    signature = _sign_payload(payload_b64, secret=secret)
    return f"{payload_b64}.{signature}"


def decode_unsubscribe_token(token: str, secret: str | None = None) -> str | None:
    if not isinstance(token, str) or "." not in token:
        return None

    payload_b64, signature = token.split(".", 1)
    expected_signature = _sign_payload(payload_b64, secret=secret)
    if not hmac.compare_digest(signature, expected_signature):
        return None

    try:
        payload_bytes = _base64url_decode(payload_b64)
        payload = json.loads(payload_bytes.decode("utf-8"))
    except Exception:
        return None

    email = payload.get("email")
    return _normalize_email(email)


def build_unsubscribe_link(email: str, base_url: str | None = None, secret: str | None = None) -> str:
    token = create_unsubscribe_token(email=email, secret=secret)
    root = (base_url or os.getenv("UNSUBSCRIBE_BASE_URL", "https://YOUR_DOMAIN")).rstrip("/")
    return f"{root}/ops/unsubscribe?t={token}"


def _normalize_email(value: Any) -> str | None:
    if not isinstance(value, str):
        return None
    normalized = value.strip().lower()
    return normalized if normalized else None


def _base64url_encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).decode("ascii").rstrip("=")


def _base64url_decode(value: str) -> bytes:
    padding = "=" * ((4 - len(value) % 4) % 4)
    return base64.urlsafe_b64decode(value + padding)


def _sign_payload(payload_b64: str, secret: str | None = None) -> str:
    key = (secret or os.getenv("UNSUBSCRIBE_TOKEN_SECRET", "")).encode("utf-8")
    return hmac.new(key, payload_b64.encode("utf-8"), hashlib.sha256).hexdigest()

