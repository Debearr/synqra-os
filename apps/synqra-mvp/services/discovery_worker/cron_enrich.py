import json
import logging
from typing import Any

from .enrichment import enrich_leads
from .sentry_support import with_sentry_guard


@with_sentry_guard(job_name="cron_enrich", service="ops_worker")
def cron_enrich(request: Any) -> tuple[str, int, dict[str, str]]:
    payload = _request_payload(request)
    connection = payload.get("db_connection")
    leads = payload.get("leads")
    table_name = payload.get("table_name")
    prompt_version = str(payload.get("prompt_version", "v1"))
    vertical = str(payload.get("vertical", "realtor"))

    if connection is None or not isinstance(leads, list) or not table_name:
        return _json_response({"error": "db_connection, leads, and table_name are required"}, 400)

    result = enrich_leads(
        connection=connection,
        table_name=str(table_name),
        leads=leads,
        prompt_version=prompt_version,
        vertical=vertical,
        ollama_client=payload.get("ollama_client"),
        groq_client=payload.get("groq_client"),
        logger=logging.getLogger(__name__),
    )
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

