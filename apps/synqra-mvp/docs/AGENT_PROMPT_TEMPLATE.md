# Synqra Agent Prompt Template

Every execution prompt must follow this structure:

## GOAL
Clear, specific outcome.

## SCOPE
Exact files allowed to change.
No other files.

## CONSTRAINTS
- No new dependencies.
- No architecture changes.
- Follow brand.ts tokens.
- Must pass build + TypeScript.

## ACCEPTANCE CRITERIA
Specific visible behaviors that must work.

## REPORT FORMAT
- What changed
- Why it matters
- How it works
- 3 validation questions

## Rules
- Never send more than 3 prompts at once.
- Wait for confirmation before next task.
- If uncertain, ask a targeted yes/no question.
