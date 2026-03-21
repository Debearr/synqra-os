# Penny Post-V1 Backlog

## Already built in V1

- Block 1: Penny identity, voice, and workspace preload.
- Block 2: Penny memory, reminders, tasks, and structured state foundation.
- Block 3: Founder control, private-by-default security, and Penny access model.
- Block 4: Internal AuraFX signal pipeline, founder bootstrap, delivery ledger, and provider abstraction.
- Block 5: Premium message formatting and subscriber-safe output structure.
- Block 6: Founder readiness check, fail-closed diagnostics, and idempotency verification.

## Phase 2 candidates

- Live market-data fetch wiring after real provider symbol coverage is verified.
- Signal lifecycle updates beyond first alert: partials, closure, invalidation, and recap states.
- Founder-safe automation around skipped trades, missed trades, and recap generation.
- Tighter operational dashboards for founder-only monitoring.

## Later backlog

- Broader instrument coverage only after V1 operating discipline holds.
- Richer card/rendering formats beyond plain-text Telegram output.
- Subscriber-facing polish that does not weaken founder-first control.
- Broker or execution ideas only as a separate, explicitly scoped phase.

## Risks / drift to avoid

- Do not reopen Blocks 1–6 without a real bug or blocker.
- Do not add multiple live market-data providers at once.
- Do not mix founder diagnostics with public or subscriber UX.
- Do not let Penny grow into a generic assistant without preserving the trading-specific operating core.
- Do not add Phase 2 work silently through “small cleanup” changes.

## Notes on native workspace pattern

- Keep Penny as a native workspace pattern inside `apps/synqra-mvp`, not a bolted-on side system.
- Prefer Penny-scoped libs, routes, and internal helpers over cross-app leakage.
- Keep one clear founder truth path for readiness, control, and diagnostics.
- Reuse the existing private-by-default route, storage, and worker patterns before inventing new ones.

## Naming rule: use DeBear correctly

- Use `DeBear` exactly with capital `D` and capital `B`.
- Do not rewrite it as `Debear`, `debear`, or `De Bear` unless the user explicitly asks for a spaced brand form in copy.
