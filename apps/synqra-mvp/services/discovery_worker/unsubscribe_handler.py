import json
from typing import Any

from .sentry_support import with_sentry_guard
from .unsubscribe_token import decode_unsubscribe_token


@with_sentry_guard(job_name="unsubscribe_handler", service="ops_worker")
def unsubscribe_handler(request: Any) -> tuple[str, int, dict[str, str]]:
    token = _request_token(request)
    connection = _request_payload(request).get("db_connection")
    if connection is None:
        return _html_response("Unsubscribe service unavailable.", 503)

    email = decode_unsubscribe_token(token or "")
    if not email:
        return _html_response("Invalid unsubscribe link.", 400)

    with connection.cursor() as cursor:
        cursor.execute(
            "INSERT INTO ops_audit.suppression_list (email, reason, created_at) "
            "VALUES (%(email)s, 'unsubscribed', now()) "
            "ON CONFLICT (email) DO NOTHING",
            {"email": email},
        )
    connection.commit()
    return _html_response("You have been unsubscribed.", 200)


def _request_payload(request: Any) -> dict[str, Any]:
    get_json = getattr(request, "get_json", None)
    if callable(get_json):
        body = get_json(silent=True)
        if isinstance(body, dict):
            return body
    return {}


def _request_token(request: Any) -> str | None:
    args = getattr(request, "args", None)
    if isinstance(args, dict):
        token = args.get("t")
        if isinstance(token, str):
            return token

    payload = _request_payload(request)
    token = payload.get("t")
    if isinstance(token, str):
        return token
    return None


def _html_response(body: str, status: int) -> tuple[str, int, dict[str, str]]:
    return body, status, {"Content-Type": "text/html; charset=utf-8"}

