# Symphony Orchestrator (NØID Labs)

Purpose: automate AI Council handoffs (Claude → DeepSeek → Gemini → Copilot), log activity, and prepare for fully autonomous upgrades.

## How it works
- Watches for required files (e.g., Claude output + DeepSeek brief).
- When prerequisites exist, runs the appropriate hook to generate the next output.
- Logs all steps to logs/symphony_log.json
- (Optional) Opens PRs via scripts/open_pr.sh (wire to GitHub CLI).

## Run
bash scripts/run_council.sh

## Replace hooks with real model calls
- orchestrator/hooks/run_deepseek.js
- orchestrator/hooks/run_gemini.js
- orchestrator/hooks/run_copilot.js

Each should:
1) Read its brief and referenced inputs.
2) Call the model/tooling you use.
3) Write the expected JSON output to /evaluations.

## Supabase + n8n
Use supabase/schema/evaluations_triggers.sql to emit flags on new evaluations.
Have n8n poll `council_flags` to trigger downstream automations.
