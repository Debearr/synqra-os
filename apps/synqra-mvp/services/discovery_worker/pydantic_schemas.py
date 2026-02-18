from dataclasses import dataclass, field
from typing import Any

try:
    from pydantic import BaseModel, Field, ValidationError  # type: ignore

    _HAS_PYDANTIC = True
except Exception:  # pragma: no cover
    BaseModel = object  # type: ignore
    Field = None  # type: ignore
    ValidationError = Exception  # type: ignore
    _HAS_PYDANTIC = False


class SchemaValidationError(ValueError):
    pass


if _HAS_PYDANTIC:

    class RealtorEnrichment(BaseModel):
        opportunity_score: int = Field(ge=0, le=100)
        summary: str
        highlights: list[str] = Field(default_factory=list)

    class TravelEnrichment(BaseModel):
        opportunity_score: int = Field(ge=0, le=100)
        summary: str
        highlights: list[str] = Field(default_factory=list)

    class DraftEmail(BaseModel):
        to_email: str
        subject: str
        body: str
        send_flag: bool = False

else:

    @dataclass
    class RealtorEnrichment:
        opportunity_score: int
        summary: str
        highlights: list[str] = field(default_factory=list)

    @dataclass
    class TravelEnrichment:
        opportunity_score: int
        summary: str
        highlights: list[str] = field(default_factory=list)

    @dataclass
    class DraftEmail:
        to_email: str
        subject: str
        body: str
        send_flag: bool = False


def validate_realtor_enrichment(payload: dict[str, Any]) -> dict[str, Any]:
    return _validate(payload, schema_name="realtor")


def validate_travel_enrichment(payload: dict[str, Any]) -> dict[str, Any]:
    return _validate(payload, schema_name="travel")


def _validate(payload: dict[str, Any], schema_name: str) -> dict[str, Any]:
    if _HAS_PYDANTIC:
        schema = RealtorEnrichment if schema_name == "realtor" else TravelEnrichment
        try:
            model = schema.model_validate(payload)
            return model.model_dump()
        except ValidationError as exc:
            raise SchemaValidationError(str(exc)) from exc

    score = payload.get("opportunity_score")
    summary = payload.get("summary")
    highlights = payload.get("highlights", [])
    if not isinstance(score, int) or score < 0 or score > 100:
        raise SchemaValidationError("opportunity_score must be integer between 0 and 100")
    if not isinstance(summary, str) or not summary.strip():
        raise SchemaValidationError("summary is required")
    if not isinstance(highlights, list) or any(not isinstance(item, str) for item in highlights):
        raise SchemaValidationError("highlights must be list[str]")

    return {
        "opportunity_score": score,
        "summary": summary.strip(),
        "highlights": highlights,
    }

