# Red Team Audit Suite ("War Games")

Adversarial testing suite for Synqra Sovereign Edition.

## Purpose

This suite validates system integrity through adversarial simulation, not happy-path unit testing.

## Bots

### Greed Bot
Tests risk engine against:
- Direct risk violations
- Indirect risk inflation (stop manipulation)
- Funded cap violations

### Hype Bot
Tests tone guard against 100+ hype phrases.

### Gate Crasher
Tests access control:
- Backend capability checks
- UI component gates

### Auditor
Runs all bots and generates final verdict.

## Execution

```bash
npm run test:red-team
# or
ts-node tests/red-team/audit-report.ts
```

## Output

- `audit-report.json`: Machine-readable verdict
- Exit code: 0 = SOVEREIGN, 1 = COMPROMISED

## Deployment Gating

If verdict ≠ "SOVEREIGN", deployment MUST STOP.

