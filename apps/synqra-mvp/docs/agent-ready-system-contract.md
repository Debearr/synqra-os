# Agent-Ready System Contract

Factual reference for AI/agent integrators. Describes what agent flows may do, what is blocked, and how safeguards are enforced today.

## Scope
- Applies to agent- and AI-facing API routes under `apps/synqra-mvp/app/api/**` that already use the safeguards helpers.
- Reflects current behavior only; no future commitments.

## What agents can do
- Invoke configured agent routing (`/api/agents`) with validated payloads and required human confirmation.
- Generate content variants via `/api/generate`.
- Request AuraFX analytics and signaling (`/api/aura-fx/*`) including optional `dryRun` query flags for simulation.
- Query model status/benchmark/init endpoints (`/api/models/*`) where kill switches permit.

## What agents cannot do
- Bypass confirmation gates (`requireConfirmation`) for protected actions.
- Proceed when the global or scoped kill switch is active (`enforceKillSwitch`).
- Ignore cost limits enforced by `enforceBudget` where applied.
- Suppress correlation identifiers; every safeguarded response returns a correlation ID.
- Force side effects when `dryRun=1` is provided on AuraFX signal, broadcast, or update routes.

## Failure handling
- Errors are normalized with `normalizeError` into additive agent-safe envelopes; server traces are not exposed.
- `buildAgentErrorEnvelope` returns `{ ok: false, error, code, safeMessage, correlationId, ...extras }` without removing legacy fields.
- HTTP status codes align with the normalized error (e.g., 400 validation, 403 confirmation required, 429 budget cap, 503 kill switch).
- Structured safeguard logs emit start/success/error events with `message`, `scope`, `level`, and `correlationId`.

## Cost enforcement
- Budget caps follow `evaluateBudget`/`enforceBudget` using environment-configured per-request, daily, and monthly limits.
- Fail-closed defaults are enabled unless `SAFEGUARDS_FAIL_CLOSED=false`.
- Confirmation gates and kill switches run before costed work; actions pause when safeguards block.
- AuraFX external sends honor `dryRun=1` to simulate without dispatching messages.

## Correlation IDs
- Generated with `ensureCorrelationId` and propagated through responses, error envelopes, and safeguard logs.
- Client-provided `x-correlation-id` is accepted when non-empty; otherwise, a UUID is created.

## Guardrails checklist (current behavior)
- Kill switches: `enforceKillSwitch` protects agent, generate, AuraFX, and model endpoints.
- Confirmation: `requireConfirmation` required for `/api/agents` POST and other guarded flows where already wired.
- Error envelopes: `buildAgentErrorEnvelope` used for agent, generate, AuraFX, and model routes to keep responses additive.
- Logging: `logSafeguard` used for start/success/error on AuraFX routes and other safeguarded handlers for operational visibility.
