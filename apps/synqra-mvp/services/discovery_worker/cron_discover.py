import json
import logging
import os
from typing import Any

from .discovery import discover_city
from .http_fetch import HttpFetchConfig, HttpFetcher
from .sentry_support import with_sentry_guard


@with_sentry_guard(job_name="cron_discover", service="ops_worker")
def cron_discover(request: Any) -> tuple[str, int, dict[str, str]]:
    payload = _request_payload(request)

    api_key = payload.get("api_key") or os.getenv("GOOGLE_PLACES_API_KEY")
    city = payload.get("city")
    query = payload.get("query")
    table_name = payload.get("table_name")

    if not api_key or not city or not query or not table_name:
        return _json_response({"error": "api_key, city, query, and table_name are required"}, 400)

    fetcher = HttpFetcher(
        config=HttpFetchConfig(
            timeout_seconds=float(os.getenv("DISCOVERY_HTTP_TIMEOUT_SECONDS", "10")),
            max_concurrent_requests=int(os.getenv("DISCOVERY_HTTP_MAX_CONCURRENCY", "5")),
            max_retries=int(os.getenv("DISCOVERY_HTTP_MAX_RETRIES", "3")),
            backoff_base_seconds=float(os.getenv("DISCOVERY_HTTP_BACKOFF_BASE_SECONDS", "0.5")),
        )
    )

    connection = payload.get("db_connection")
    if connection is None:
        return _json_response({"error": "db_connection is required for cron_discover execution"}, 400)

    inserted = discover_city(
        fetcher=fetcher,
        connection=connection,
        api_key=api_key,
        city=city,
        query=query,
        table_name=table_name,
        logger=logging.getLogger(__name__),
    )

    if inserted == 0:
        _record_silent_failure_and_alert(
            connection=connection,
            payload=payload,
            city=city,
            query=query,
            table_name=table_name,
            leads_processed=inserted,
        )
        return _json_response({"inserted": inserted, "city": city, "query": query, "status": "silent_failure"}, 200)

    return _json_response({"inserted": inserted, "city": city, "query": query}, 200)


def _request_payload(request: Any) -> dict[str, Any]:
    if request is None:
        return {}
    get_json = getattr(request, "get_json", None)
    if callable(get_json):
        body = get_json(silent=True)
        if isinstance(body, dict):
            return body
    return {}


def _record_silent_failure_and_alert(
    connection: Any,
    payload: dict[str, Any],
    city: str,
    query: str,
    table_name: str,
    leads_processed: int,
) -> None:
    logger = logging.getLogger(__name__)

    metadata = {
        "city": city,
        "query": query,
        "table_name": table_name,
        "leads_processed": leads_processed,
    }

    try:
        with connection.cursor() as cursor:
            cursor.execute(
                "INSERT INTO ops_audit.run_log (job_name, status, metadata) "
                "VALUES (%(job_name)s, %(status)s, %(metadata)s::jsonb)",
                {
                    "job_name": "cron_discover",
                    "status": "silent_failure",
                    "metadata": json.dumps(metadata),
                },
            )
        connection.commit()
    except Exception as exc:
        logger.warning("silent_failure_run_log_write_failed error=%s", exc)

    send_email_fn = payload.get("send_email_fn")
    founder_email = payload.get("founder_email") or os.getenv("FOUNDER_DIGEST_EMAIL")
    ops_url = payload.get("ops_url") or os.getenv("OPS_DASHBOARD_URL", "/ops")

    if callable(send_email_fn) and founder_email:
        try:
            send_email_fn(
                founder_email,
                "Silent Failure Alert - Discovery",
                (
                    "Discovery run completed with zero processed leads and no exception.\n"
                    f"City: {city}\n"
                    f"Query: {query}\n"
                    f"Table: {table_name}\n"
                    f"Leads processed: {leads_processed}\n"
                    f"Ops dashboard: {ops_url}"
                ),
            )
        except Exception as exc:
            logger.warning("silent_failure_alert_email_failed error=%s", exc)
    else:
        logger.warning("silent_failure_alert_not_sent missing_email_or_sender")


def _json_response(body: dict[str, Any], status: int) -> tuple[str, int, dict[str, str]]:
    return json.dumps(body), status, {"Content-Type": "application/json"}
