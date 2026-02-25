import asyncio
import json
import logging
import os
import sys
import time
import uuid
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, HTTPException, Request, status
from pydantic import BaseModel, Field

try:
    from .router import InferenceRouter
except ImportError:
    from router import InferenceRouter


class JsonFormatter(logging.Formatter):
    _reserved = set(logging.LogRecord("", 0, "", 0, "", (), None).__dict__.keys())

    def format(self, record: logging.LogRecord) -> str:
        payload: dict[str, Any] = {
            "ts": self.formatTime(record, datefmt="%Y-%m-%dT%H:%M:%S"),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        for key, value in record.__dict__.items():
            if key not in self._reserved and not key.startswith("_"):
                payload[key] = value

        if record.exc_info:
            payload["exc_info"] = self.formatException(record.exc_info)

        return json.dumps(payload, default=str, separators=(",", ":"))


def configure_logging() -> None:
    level = os.getenv("LOG_LEVEL", "INFO").upper()
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JsonFormatter())

    root = logging.getLogger()
    root.handlers.clear()
    root.setLevel(level)
    root.addHandler(handler)


configure_logging()
logger = logging.getLogger(__name__)
GLOBAL_REQUEST_TIMEOUT_SECONDS = int(os.getenv("GLOBAL_TIMEOUT_SECONDS", "30"))
MAX_PROMPT_CHARS = int(os.getenv("MAX_PROMPT_CHARS", "16000"))


class InferenceRequest(BaseModel):
    product: str = Field(..., description="Product identifier, e.g. synqra")
    prompt: str = Field(default="", description="Prompt text")
    media_url: str | None = Field(default=None, description="Optional media URL for media tasks")
    metadata: dict[str, Any] = Field(default_factory=dict)


class InferenceResponse(BaseModel):
    request_id: str
    provider: str
    route: str
    output: Any
    cached: bool
    deduped: bool
    claude_escalated: bool


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.router = InferenceRouter.from_env()
    logger.info("service.started")
    try:
        yield
    finally:
        await app.state.router.close()
        logger.info("service.stopped")


app = FastAPI(title="Synqra Async Inference Router", version="1.0.0", lifespan=lifespan)


@app.middleware("http")
async def request_logging_middleware(request: Request, call_next):
    request_id = request.headers.get("x-request-id", str(uuid.uuid4()))
    request.state.request_id = request_id
    started = time.perf_counter()

    try:
        response = await call_next(request)
        response.headers["x-request-id"] = request_id
        return response
    finally:
        duration_ms = int((time.perf_counter() - started) * 1000)
        status_code = getattr(locals().get("response"), "status_code", 500)
        logger.info(
            "http.request",
            extra={
                "request_id": request_id,
                "path": request.url.path,
                "method": request.method,
                "status_code": status_code,
                "duration_ms": duration_ms,
            },
        )


@app.post("/infer", response_model=InferenceResponse)
async def infer(req: InferenceRequest, request: Request):
    if not req.prompt and not req.media_url:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Either prompt or media_url must be provided",
        )
    if len(req.prompt) > MAX_PROMPT_CHARS:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Prompt exceeds {MAX_PROMPT_CHARS} characters",
        )

    request_id = request.state.request_id
    payload = req.model_dump()
    try:
        result = await asyncio.wait_for(
            app.state.router.route_request(payload=payload, request_id=request_id),
            timeout=GLOBAL_REQUEST_TIMEOUT_SECONDS,
        )
        return InferenceResponse(**result)
    except asyncio.TimeoutError as exc:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="Global request timeout reached (30s)",
        ) from exc


@app.get("/health")
async def health() -> dict[str, Any]:
    return await app.state.router.health()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", "8000")), reload=False)
