# SYNQRA / NØID Pipeline

## Database schema

Apply the migration in `db/migrations/2025-10-08-0001_synqra_core.sql` to your Postgres (Supabase) project. It creates:
- `content_intents`, `error_log`, `service_health`, `idempotency_keys`
- helper functions: `record_service_failure`, `record_service_success`
- RLS enabled with a simple `service_role` policy

## n8n workflow

Import `automation/n8n/NOID_Unified_Pipeline_v2_1.json` into n8n. Configure environment variables on the n8n instance:
- `OPENAI_API_KEY`, `AURAFX_API_KEY`, `LEONARDO_API_KEY`, `SYNQRA_API_KEY`
- `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`

The workflow:
- fetches one `pending` intent
- parses marketing attributes via OpenAI
- checks AuraFX/Leonardo circuit state
- calls AuraFX (timing) and Leonardo (image) with retries
- creates a SYNQRA draft
- marks the intent as `completed`
- logs errors to `error_log`

## Visual prompt presets

`automation/prompts/SYNQRA_Visual_Prompt_LuxuryTech_v1.json` contains a Leonardo preset prompt for luxury-tech visuals.

## Smoke test

Export secrets then run a simple check:

```bash
export OPENAI_API_KEY="sk-..."
export AURAFX_API_KEY="afx_..."
export LEONARDO_API_KEY="leo_..."
export SYNQRA_API_KEY="syn_..."
export SUPABASE_URL="https://..."
export SUPABASE_SERVICE_KEY="eyJ..."

# Seed a pending intent (either via Supabase SQL editor or psql)
psql "$SUPABASE_DB_URL" -f /workspace/scripts/seed_intent.sql || true

# Or paste this into Supabase SQL editor:
# INSERT INTO content_intents(transcript, platform, audience) VALUES
# ('Launch fall tasting menu next Friday 7pm, highlight chef table, Instagram focus, locals 25-40', 'Instagram', 'Toronto foodies');

# After the n8n workflow runs, check latest intents
curl -sS \
  -H "apikey: $SUPABASE_SERVICE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
  "$SUPABASE_URL/rest/v1/content_intents?select=id,platform,audience,status,updated_at&order=updated_at.desc&limit=5" | jq '.[]'
```

Expected: status becomes `completed` and SYNQRA draft is created with an image preview URL.
