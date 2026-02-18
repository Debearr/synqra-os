import json
import logging
import os
from typing import Any

from .metrics import write_run_log
from .sending import send_from_queue
from .sentry_support import with_sentry_guard


@with_sentry_guard(job_name="cron_send", service="ops_worker")
def cron_send(request: Any) -> tuple[str, int, dict[str, str]]:
    payload = _request_payload(request)
    connection = payload.get("db_connection")
    send_email_fn = payload.get("send_email_fn")
    schema = str(payload.get("schema", "ops_realtors"))
    if connection is None or not callable(send_email_fn):
        return _json_response({"error": "db_connection and send_email_fn are required"}, 400)

    result = send_from_queue(
        connection=connection,
        schema=schema,
        send_email_fn=send_email_fn,
        limit=int(payload.get("limit", 25)),
        global_sending_enabled=(str(os.getenv("GLOBAL_SENDING_ENABLED", "true")).lower() == "true"),
        campaign_status=str(payload.get("campaign_status", "active")),
        logger=logging.getLogger(__name__),
    )
    write_run_log(connection, "cron_send", "complete", json.dumps({"schema": schema, **result}))
    return _json_response(result, 200)


def _request_payload(request: Any) -> dict[str, Any]:
    get_json = getattr(request, "get_json", None)
    if callable(get_json):
        body = get_json(silent=True)
        if isinstance(body, dict):
            return body
    return {}


def _json_response(body: dict[str, Any], status: int) -> tuple[str, int, dict[str, str]]:
    return json.dumps(body), status, {"Content-Type": "application/json"}

