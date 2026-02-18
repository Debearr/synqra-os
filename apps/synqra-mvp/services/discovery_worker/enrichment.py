import json
import logging
import os
import time
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FuturesTimeoutError
from dataclasses import dataclass
from typing import Any, Callable
from urllib.request import Request, urlopen

from .groq_client import GroqEnrichmentClient
from .pydantic_schemas import SchemaValidationError, validate_realtor_enrichment, validate_travel_enrichment

OLLAMA_MAX_LEADS_PER_RUN = int(os.getenv("OLLAMA_MAX_LEADS_PER_RUN", "100"))
ENRICHMENT_TIMEOUT_SECONDS = float(os.getenv("ENRICHMENT_TIMEOUT_SECONDS", "20"))
LOW_SCORE_THRESHOLD = 40


@dataclass
class EnrichmentResult:
    lead_id: str
    enrichment_status: str
    prompt_version: str
    model_used: str
    raw_response: str | None
    enriched_payload: dict[str, Any] | None
    should_generate_draft: bool


class OllamaEnrichmentClient:
    def __init__(
        self,
        base_url: str | None = None,
        model: str | None = None,
        timeout_seconds: float = ENRICHMENT_TIMEOUT_SECONDS,
    ) -> None:
        self._base_url = (base_url or os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")).rstrip("/")
        self._model = (model or os.getenv("OLLAMA_MODEL", "llama3.1:8b")).strip()
        self._timeout_seconds = timeout_seconds

    @property
    def model_name(self) -> str:
        return self._model

    def health_check(self) -> bool:
        request = Request(f"{self._base_url}/api/tags", method="GET")
        try:
            with urlopen(request, timeout=min(self._timeout_seconds, 5.0)) as response:
                return response.status == 200
        except Exception:
            return False

    def generate_enrichment(self, prompt: str) -> dict[str, Any]:
        payload = {"model": self._model, "prompt": prompt, "stream": False}
        request = Request(
            f"{self._base_url}/api/generate",
            data=json.dumps(payload).encode("utf-8"),
            method="POST",
            headers={"Content-Type": "application/json"},
        )
        with urlopen(request, timeout=self._timeout_seconds) as response:
            raw = json.loads(response.read().decode("utf-8"))
        output = raw.get("response")
        if isinstance(output, str):
            return json.loads(output)
        if isinstance(output, dict):
            return output
        raise RuntimeError("Ollama response missing JSON payload")


def enrich_leads(
    connection: Any,
    table_name: str,
    leads: list[dict[str, Any]],
    prompt_version: str,
    vertical: str = "realtor",
    ollama_client: Any | None = None,
    groq_client: Any | None = None,
    logger: logging.Logger | None = None,
    sleep_fn: Callable[[float], None] = time.sleep,
    timeout_seconds: float = ENRICHMENT_TIMEOUT_SECONDS,
    max_leads: int | None = None,
) -> dict[str, Any]:
    logger = logger or logging.getLogger(__name__)
    cap = min(max_leads or OLLAMA_MAX_LEADS_PER_RUN, OLLAMA_MAX_LEADS_PER_RUN, len(leads))
    selected_leads = leads[:cap]

    ollama = ollama_client or OllamaEnrichmentClient(timeout_seconds=timeout_seconds)
    groq = groq_client
    if groq is None and os.getenv("GROQ_API_KEY", "").strip():
        groq = GroqEnrichmentClient(timeout_seconds=timeout_seconds)

    ollama_healthy = bool(getattr(ollama, "health_check", lambda: False)())
    use_groq_by_default = not ollama_healthy and _is_groq_available(groq)
    if not ollama_healthy:
        logger.warning("ollama_health_check_failed fallback_to_groq=%s", use_groq_by_default)

    results: list[EnrichmentResult] = []
    for index, lead in enumerate(selected_leads):
        result = _enrich_single_lead(
            lead=lead,
            prompt_version=prompt_version,
            vertical=vertical,
            ollama_client=ollama,
            groq_client=groq,
            use_groq_by_default=use_groq_by_default,
            timeout_seconds=timeout_seconds,
            logger=logger,
        )
        _upsert_enrichment_row(connection=connection, table_name=table_name, result=result)
        results.append(result)
        if index < len(selected_leads) - 1:
            sleep_fn(1.0)

    return {
        "processed": len(results),
        "complete": sum(1 for item in results if item.enrichment_status == "complete"),
        "low_score": sum(1 for item in results if item.enrichment_status == "low_score"),
        "failed": sum(1 for item in results if item.enrichment_status == "failed"),
        "invalid_output": sum(1 for item in results if item.enrichment_status == "invalid_output"),
    }


def _enrich_single_lead(
    lead: dict[str, Any],
    prompt_version: str,
    vertical: str,
    ollama_client: Any,
    groq_client: Any | None,
    use_groq_by_default: bool,
    timeout_seconds: float,
    logger: logging.Logger,
) -> EnrichmentResult:
    lead_id = str(lead.get("id") or lead.get("lead_id") or "")
    prompt = _build_prompt(lead=lead, vertical=vertical)
    raw_response: Any = None

    for attempt in range(2):
        try:
            raw_response: dict[str, Any]
            model_used: str

            if use_groq_by_default:
                raw_response = _run_with_timeout(lambda: groq_client.generate_enrichment(prompt), timeout_seconds)
                model_used = "groq"
            else:
                try:
                    raw_response = _run_with_timeout(lambda: ollama_client.generate_enrichment(prompt), timeout_seconds)
                    model_used = "ollama"
                except TimeoutError:
                    if _is_groq_available(groq_client):
                        raw_response = _run_with_timeout(lambda: groq_client.generate_enrichment(prompt), timeout_seconds)
                        model_used = "groq"
                    else:
                        raise

            validated = _validate_output(raw_response, vertical=vertical)
            score = int(validated["opportunity_score"])
            if score < LOW_SCORE_THRESHOLD:
                logger.info("enrichment_low_score lead_id=%s score=%s", lead_id, score)
                return EnrichmentResult(
                    lead_id=lead_id,
                    enrichment_status="low_score",
                    prompt_version=prompt_version,
                    model_used=model_used,
                    raw_response=json.dumps(raw_response),
                    enriched_payload=validated,
                    should_generate_draft=False,
                )

            return EnrichmentResult(
                lead_id=lead_id,
                enrichment_status="complete",
                prompt_version=prompt_version,
                model_used=model_used,
                raw_response=json.dumps(raw_response),
                enriched_payload=validated,
                should_generate_draft=True,
            )
        except SchemaValidationError:
            logger.warning(
                "invalid_output lead_id=%s raw_response=%s",
                lead_id,
                json.dumps(raw_response) if isinstance(raw_response, dict) else str(raw_response),
            )
            return EnrichmentResult(
                lead_id=lead_id,
                enrichment_status="invalid_output",
                prompt_version=prompt_version,
                model_used="groq" if use_groq_by_default else "ollama",
                raw_response=json.dumps(raw_response) if isinstance(raw_response, dict) else str(raw_response),
                enriched_payload=None,
                should_generate_draft=False,
            )
        except Exception as exc:
            if attempt == 0:
                continue
            logger.warning("enrichment_failed lead_id=%s error=%s", lead_id, exc)
            return EnrichmentResult(
                lead_id=lead_id,
                enrichment_status="failed",
                prompt_version=prompt_version,
                model_used="groq" if use_groq_by_default else "ollama",
                raw_response=str(exc),
                enriched_payload=None,
                should_generate_draft=False,
            )

    return EnrichmentResult(
        lead_id=lead_id,
        enrichment_status="failed",
        prompt_version=prompt_version,
        model_used="groq" if use_groq_by_default else "ollama",
        raw_response="unknown",
        enriched_payload=None,
        should_generate_draft=False,
    )


def _upsert_enrichment_row(connection: Any, table_name: str, result: EnrichmentResult) -> None:
    sql = (
        f"INSERT INTO {table_name} "
        "(lead_id,enrichment_status,prompt_version,model_used,raw_response,enriched_payload,updated_at) "
        "VALUES (%(lead_id)s,%(enrichment_status)s,%(prompt_version)s,%(model_used)s,%(raw_response)s,%(enriched_payload)s::jsonb,now()) "
        "ON CONFLICT (lead_id) DO UPDATE SET "
        "enrichment_status = EXCLUDED.enrichment_status, "
        "prompt_version = EXCLUDED.prompt_version, "
        "model_used = EXCLUDED.model_used, "
        "raw_response = EXCLUDED.raw_response, "
        "enriched_payload = EXCLUDED.enriched_payload, "
        "updated_at = now()"
    )
    with connection.cursor() as cursor:
        cursor.execute(
            sql,
            {
                "lead_id": result.lead_id,
                "enrichment_status": result.enrichment_status,
                "prompt_version": result.prompt_version,
                "model_used": result.model_used,
                "raw_response": result.raw_response,
                "enriched_payload": json.dumps(result.enriched_payload or {}),
            },
        )
    connection.commit()


def _validate_output(payload: dict[str, Any], vertical: str) -> dict[str, Any]:
    if vertical == "travel":
        return validate_travel_enrichment(payload)
    return validate_realtor_enrichment(payload)


def _build_prompt(lead: dict[str, Any], vertical: str) -> str:
    return json.dumps({"vertical": vertical, "lead": lead}, separators=(",", ":"))


def _run_with_timeout(callable_fn: Callable[[], dict[str, Any]], timeout_seconds: float) -> dict[str, Any]:
    with ThreadPoolExecutor(max_workers=1) as pool:
        future = pool.submit(callable_fn)
        try:
            return future.result(timeout=timeout_seconds)
        except FuturesTimeoutError as exc:
            raise TimeoutError("llm_call_timeout") from exc


def _is_groq_available(groq_client: Any | None) -> bool:
    if groq_client is None:
        return False
    configured = getattr(groq_client, "is_configured", None)
    if callable(configured):
        return bool(configured())
    return True
