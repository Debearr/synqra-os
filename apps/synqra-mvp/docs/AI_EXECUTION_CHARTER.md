# Synqra AI Execution Charter

## Purpose
This document defines how AI agents (Codex App, Codex 5.3, ChatGPT 5.2, Claude Sonnet 4.6, and future agents) are allowed to operate within the Synqra ecosystem.

## Core Rules
1. AI executes only within defined roadmap scope.
2. No architectural changes unless explicitly approved.
3. No new dependencies without written plain-English justification.
4. All changes must be small, scoped, and testable.
5. No hardcoded values — use lib/brand.ts.
6. Never modify middleware.ts, lib/redirects.ts, lib/user-role-state.ts, Stripe handlers, or Supabase RLS.
7. Every block must pass pnpm build and pnpm exec tsc --noEmit before deployment.
8. Every block must produce a 150–300 word plain-English report.

## Reporting Standard
- What changed (max 5 bullets)
- Why it matters (max 3 bullets)
- How it works (simple explanation)
- Max 3–5 validation questions

This charter applies to Synqra, AuraFX, NØID, and all future NoID Labs projects.

---

## Enforcement Protocol (Phase Discipline)

1. All work must occur on a named feature branch.
2. No direct commits to `main`.
3. Every phase must follow:
   - Branch -> Commit -> Push -> PR -> Merge -> Sync -> Delete branch
4. Owner report must include:
   - Status
   - Risk level
   - Confidence score
5. Protected files may not be modified without explicit review.

Violation of this protocol invalidates phase completion.

---

## Branch Naming Standard

Format:

codex/<domain>-phase-<number>

Examples:

- codex/governance-phase-2
- codex/auth-phase-3
- codex/ui-phase-4

Branches must describe scope and phase.
