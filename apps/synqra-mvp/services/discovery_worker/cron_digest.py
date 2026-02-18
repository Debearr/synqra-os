import json
import logging
import os
import re
from datetime import datetime, timezone
from typing import Any, Callable
from zoneinfo import ZoneInfo

from .sentry_support import with_sentry_guard

TABLE_PATTERN = re.compile(r"^[a-zA-Z_][a-zA-Z0-9_.]*$")


@with_sentry_guard(job_name="cron_digest", service="ops_worker")
def cron_digest(request: Any) -> tuple[str, int, dict[str, str]]:
    if _request_method(request) != "POST":
        return _json_response({"error": "method_not_allowed"}, 405)

    payload = _request_payload(request)
    connection = payload.get("db_connection")
    send_email_fn = payload.get("send_email_fn")
    founder_email = payload.get("founder_email") or os.getenv("FOUNDER_DIGEST_EMAIL")
    ops_url = payload.get("ops_url") or os.getenv("OPS_DASHBOARD_URL", "/ops")
    table_names = payload.get("table_names") or ["ops_realtors.email_drafts", "ops_travel.email_drafts"]

    if connection is None or not callable(send_email_fn) or not founder_email:
        return _json_response({"error": "db_connection, send_email_fn, and founder_email are required"}, 400)

    now_utc = payload.get("now_utc")
    if isinstance(now_utc, datetime):
        current_utc = now_utc.astimezone(timezone.utc)
    else:
        current_utc = datetime.now(timezone.utc)

    tz_name = os.getenv("FOUNDER_DIGEST_TZ", "UTC")
    try:
        local_time = current_utc.astimezone(ZoneInfo(tz_name))
    except Exception:
        local_time = current_utc

    if local_time.hour != 8:
        return _json_response({"status": "skipped", "reason": "outside_digest_window"}, 200)

    total_pending = _count_pending_drafts(connection=connection, table_names=table_names)

    subject = f"Founder Digest - {local_time.date().isoformat()}"
    body = (
        "Daily founder summary\n"
        f"Pending drafts awaiting manual approval: {total_pending}\n"
        f"Ops dashboard: {ops_url}"
    )
    send_email_fn(founder_email, subject, body)
    logging.getLogger(__name__).info("digest_sent founder_email=%s pending=%s", founder_email, total_pending)

    return _json_response({"status": "sent", "pending_drafts": total_pending}, 200)


def _count_pending_drafts(connection: Any, table_names: list[str]) -> int:
    total = 0
    with connection.cursor() as cursor:
        for table_name in table_names:
            if not isinstance(table_name, str) or not TABLE_PATTERN.fullmatch(table_name):
                raise ValueError(f"Unsafe table_name: {table_name}")
            cursor.execute(
                f"SELECT COUNT(*) FROM {table_name} WHERE approval_status = 'pending' AND send_flag = FALSE"
            )
            row = cursor.fetchone()
            if isinstance(row, (tuple, list)) and row:
                total += int(row[0])
            elif isinstance(row, dict):
                total += int(row.get("count", 0))
    return total


def _request_method(request: Any) -> str:
    method = getattr(request, "method", "POST")
    return str(method).upper()


def _request_payload(request: Any) -> dict[str, Any]:
    if request is None:
        return {}
    get_json = getattr(request, "get_json", None)
    if callable(get_json):
        body = get_json(silent=True)
        if isinstance(body, dict):
            return body
    return {}


def _json_response(body: dict[str, Any], status: int) -> tuple[str, int, dict[str, str]]:
    return json.dumps(body), status, {"Content-Type": "application/json"}
