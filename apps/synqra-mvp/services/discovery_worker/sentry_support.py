import json
import os
from functools import wraps
from typing import Any, Callable

try:
    import sentry_sdk  # type: ignore
except Exception:  # pragma: no cover
    sentry_sdk = None

_SENTRY_INITIALIZED = False


def with_sentry_guard(job_name: str, service: str = "ops_worker") -> Callable[[Callable[..., Any]], Callable[..., Any]]:
    def decorator(handler: Callable[..., Any]) -> Callable[..., Any]:
        @wraps(handler)
        def wrapped(request: Any, *args: Any, **kwargs: Any) -> Any:
            _init_sentry(service=service)
            payload = _request_payload(request)
            tags = {
                "job_name": job_name,
                "service": service,
                "vertical": str(payload.get("vertical", "unknown")),
                "run_id": str(payload.get("run_id", "unknown")),
            }
            try:
                _set_tags(tags)
                return handler(request, *args, **kwargs)
            except Exception as exc:  # pragma: no cover - exercised via tests
                _capture_exception(exc, tags)
                return _json_response({"error": "internal_error", "job_name": job_name}, 500)

        return wrapped

    return decorator


def _init_sentry(service: str) -> None:
    global _SENTRY_INITIALIZED
    if _SENTRY_INITIALIZED:
        return

    dsn = os.getenv("SENTRY_DSN", "").strip()
    if not dsn or sentry_sdk is None:
        _SENTRY_INITIALIZED = True
        return

    sentry_sdk.init(
        dsn=dsn,
        environment=os.getenv("SENTRY_ENVIRONMENT", "development"),
        release=os.getenv("SENTRY_RELEASE") or None,
        traces_sample_rate=0.0,
    )
    if sentry_sdk is not None:
        sentry_sdk.set_tag("service", service)
    _SENTRY_INITIALIZED = True


def _set_tags(tags: dict[str, str]) -> None:
    if sentry_sdk is None:
        return
    for key, value in tags.items():
        sentry_sdk.set_tag(key, value)


def _capture_exception(exc: Exception, tags: dict[str, str]) -> None:
    if sentry_sdk is not None:
        with sentry_sdk.push_scope() as scope:
            for key, value in tags.items():
                scope.set_tag(key, value)
            sentry_sdk.capture_exception(exc)


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

