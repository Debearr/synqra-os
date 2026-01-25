# queryCouncil (Synqra)

## Purpose
`queryCouncil` is a lightweight, production-safe helper that gathers multiple AI perspectives using the existing shared AI client and produces a single synthesized answer. It is additive and does **not** alter existing architecture, UI, or auth flows.

## Location
- Implementation: `shared/ai/council.ts`
- Logging helpers: `shared/db/supabase.ts`
- Tables: `supabase/migrations/20251130_council_logging.sql`

## Usage (Server-Only)
```ts
import { queryCouncil } from "@/shared";

const result = await queryCouncil({
  app: "synqra",
  prompt: "Draft a premium onboarding email for a pilot user.",
  systemPrompt: "You are Synqra's executive copy assistant.",
  requester: "onboard-flow",
});

if (result.error) {
  console.error(result.error);
} else {
  console.log(result.final.content);
}
```

## Default Council
If no members are supplied, `queryCouncil` runs a minimal 3-member council:
- Strategist (strategic framing)
- Architect (structured solution)
- Refiner (clarity and polish)

## Logging
When `log: true` (default), `queryCouncil` writes:
- `council_queries` for the top-level request
- `council_responses` for each member response
- `council_decisions` for the synthesis decision

Logging is non-blocking; failures do **not** break the request.

## Notes
- Uses Groq only at runtime (no Anthropic/OpenAI/Gemini fallbacks).
- Requires `GROQ_API_KEY` to be configured in the server runtime.
- No streaming, no background jobs.
- Intended for server-side flows and shared orchestration only.
