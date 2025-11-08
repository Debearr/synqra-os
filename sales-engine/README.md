## Autonomous Sales Engine

Modular pipeline for Synqra / NØID that automates the full sales lifecycle end-to-end—lead capture, qualification, nurturing, closing, onboarding, retention, upsell, and support—while staying isolated from existing customer-facing apps.

### Highlights
- Zero new runtime dependencies; built on native fetch, Supabase REST, and existing platform services.
- Cohesive folder layout: databases, integrations, AI decisions, lifecycle orchestration, and self-healing.
- All exports flow through `sales-engine/index.ts` for clean imports inside Next.js routes.
- Defensive logging and graceful degradation when third-party services are unavailable.

### Layout
- `config.ts` – Environment variable accessors.
- `types.ts` – Shared TypeScript definitions.
- `db/` – Supabase migration script and REST helpers.
- `ai/` – GPT-5 / Kie.AI / DeepSeek orchestration.
- `integrations/` – Telegram, n8n, Stripe adapters.
- `pipeline/` – Lead + retention state machines.
- `cache/` – System cache utilities backed by Supabase.
- `self-healing/` – Daily diagnostics runner and analyzers.
- `index.ts` – Public API consumed by Next.js routes.

### Database Migration
`db/migrations/001_create_sales_engine_tables.sql` can be executed via Supabase SQL editor or CI migration flow. It creates:
- `leads`
- `lead_scores`
- `user_memory`
- `sales_events`
- `system_cache`
- `ai_sessions`

Run locally:
```bash
psql "$SUPABASE_URL" <<'SQL'
\i sales-engine/db/migrations/001_create_sales_engine_tables.sql
SQL
```

### Deployment Checklist
1. Confirm Supabase service key + anon key available in environment.
2. Provide Telegram bot token and target chat ID.
3. Set Stripe API key and pricing table ID.
4. Configure n8n base URL + auth token for webhooks.
5. Optional: supply Kie.AI key and DeepSeek Router credentials for AI reasoning.
6. Schedule the self-healing runner via Railway cron using `sales-engine/self-healing/loop.ts`.

### Cron Runner
Invoke the self-healing loop daily:
```bash
node --loader ts-node/esm sales-engine/self-healing/loop.ts
```
(Adjust command to your runtime; the script is dependency-free aside from Node's native APIs.)
