import hmac
import json
import logging
import os
import re
import time
from collections import deque
from datetime import datetime, timezone
from threading import Lock
from typing import Any

from .sentry_support import with_sentry_guard

TABLE_PATTERN = re.compile(r"^[a-zA-Z_][a-zA-Z0-9_.]*$")
RATE_LIMIT_PER_MINUTE = 50
RATE_LIMIT_WINDOW_SECONDS = 60.0

_RATE_LIMIT_BUCKETS: dict[str, deque[float]] = {}
_RATE_LIMIT_LOCK = Lock()


@with_sentry_guard(job_name="approve_handler", service="ops_worker")
def approve_handler(request: Any) -> tuple[str, int, dict[str, str]]:
    if _request_method(request) != "POST":
        return _json_response({"error": "method_not_allowed"}, 405)

    requester_ip = _request_ip(request)
    if _is_rate_limited(requester_ip):
        _log_event("approval_rate_limited", {"ip": requester_ip, "limit": RATE_LIMIT_PER_MINUTE, "window_seconds": 60})
        return _json_response({"error": "rate_limited"}, 429)

    secret = os.getenv("APPROVAL_ENDPOINT_SECRET", "")
    header_secret = _request_header(request, "X-Approve-Secret")
    if not secret or not header_secret or not hmac.compare_digest(secret, header_secret):
        _log_event("approval_auth_failed", {"reason": "invalid_secret"})
        return _json_response({"error": "unauthorized"}, 401)

    payload = _request_payload(request)
    draft_id = payload.get("draft_id")
    approved_by = payload.get("approved_by", "founder")
    table_name = payload.get("table_name", "ops_realtors.email_drafts")
    connection = payload.get("db_connection")

    if not draft_id or connection is None:
        _log_event("approval_rejected", {"reason": "missing_inputs", "draft_id": draft_id})
        return _json_response({"error": "draft_id and db_connection are required"}, 400)
    if not TABLE_PATTERN.fullmatch(table_name):
        return _json_response({"error": "unsafe_table_name"}, 400)

    result = _approve_draft(
        connection=connection,
        table_name=table_name,
        draft_id=str(draft_id),
        approved_by=str(approved_by),
    )
    return _json_response(result, 200)


def _approve_draft(connection: Any, table_name: str, draft_id: str, approved_by: str) -> dict[str, Any]:
    now_iso = datetime.now(timezone.utc).isoformat()
    updated_count = 0
    with connection.cursor() as cursor:
        cursor.execute(
            f"SELECT id, send_flag FROM {table_name} WHERE id = %(draft_id)s FOR UPDATE",
            {"draft_id": draft_id},
        )
        existing = cursor.fetchone()
        if not existing:
            _log_event("approval_not_found", {"draft_id": draft_id, "table_name": table_name})
            connection.commit()
            return {"status": "not_found", "draft_id": draft_id, "updated": False}

        if _row_send_flag(existing):
            _log_event("approval_idempotent", {"draft_id": draft_id, "table_name": table_name})
            connection.commit()
            return {"status": "already_approved", "draft_id": draft_id, "updated": False}

        update_sql = (
            f"UPDATE {table_name} "
            "SET send_flag = TRUE, approval_status = 'approved', approved_by = %(approved_by)s, "
            "approved_at = %(approved_at)s "
            "WHERE id = %(draft_id)s AND send_flag = FALSE"
        )
        cursor.execute(
            update_sql,
            {
                "draft_id": draft_id,
                "approved_by": approved_by,
                "approved_at": now_iso,
            },
        )
        updated_count = int(getattr(cursor, "rowcount", 0))

    connection.commit()
    if updated_count == 0:
        _log_event("approval_idempotent_race", {"draft_id": draft_id, "table_name": table_name})
        return {"status": "already_approved", "draft_id": draft_id, "updated": False}

    _log_event("approval_success", {"draft_id": draft_id, "table_name": table_name, "approved_by": approved_by})
    return {"status": "approved", "draft_id": draft_id, "updated": True}


def _row_send_flag(existing: Any) -> bool:
    if isinstance(existing, dict):
        return bool(existing.get("send_flag"))
    if isinstance(existing, (list, tuple)) and len(existing) >= 2:
        return bool(existing[1])
    return False


def _log_event(event: str, fields: dict[str, Any]) -> None:
    logger = logging.getLogger(__name__)
    logger.info("approval_event=%s fields=%s", event, json.dumps(fields, sort_keys=True))


def _request_method(request: Any) -> str:
    method = getattr(request, "method", "POST")
    return str(method).upper()


def _request_header(request: Any, key: str) -> str | None:
    headers = getattr(request, "headers", None)
    if isinstance(headers, dict):
        for header_key, value in headers.items():
            if str(header_key).lower() == key.lower():
                return str(value)
    return None


def _request_payload(request: Any) -> dict[str, Any]:
    if request is None:
        return {}
    get_json = getattr(request, "get_json", None)
    if callable(get_json):
        body = get_json(silent=True)
        if isinstance(body, dict):
            return body
    return {}


def _request_ip(request: Any) -> str:
    forwarded = _request_header(request, "X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip() or "unknown"

    real_ip = _request_header(request, "X-Real-IP")
    if real_ip:
        return real_ip.strip() or "unknown"

    remote_addr = getattr(request, "remote_addr", None)
    if isinstance(remote_addr, str) and remote_addr.strip():
        return remote_addr.strip()

    client = getattr(request, "client", None)
    client_host = getattr(client, "host", None)
    if isinstance(client_host, str) and client_host.strip():
        return client_host.strip()

    return "unknown"


def _is_rate_limited(ip: str) -> bool:
    now = time.monotonic()
    cutoff = now - RATE_LIMIT_WINDOW_SECONDS

    with _RATE_LIMIT_LOCK:
        bucket = _RATE_LIMIT_BUCKETS.setdefault(ip, deque())
        while bucket and bucket[0] <= cutoff:
            bucket.popleft()

        if len(bucket) >= RATE_LIMIT_PER_MINUTE:
            return True

        bucket.append(now)
        return False


def _reset_rate_limiter_for_tests() -> None:
    with _RATE_LIMIT_LOCK:
        _RATE_LIMIT_BUCKETS.clear()


def _json_response(body: dict[str, Any], status: int) -> tuple[str, int, dict[str, str]]:
    return json.dumps(body), status, {"Content-Type": "application/json"}
