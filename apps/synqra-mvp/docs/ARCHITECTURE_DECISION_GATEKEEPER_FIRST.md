# Architecture Decision: Gatekeeper-First Journey

## Status
Accepted

## Decision
Synqra uses a Gatekeeper-first product flow as the canonical user journey:

`/` (Access Code Gatekeeper)  
-> Request Access  
-> `/waitlist` or `/pilot/apply`  
-> `/studio`

This is an intentional product decision and is treated as baseline behavior.

## Why this is intentional
- Synqra Studio is a controlled environment, not an open self-serve surface.
- Access Code entry preserves positioning, invite-only onboarding, and operator control.
- Request Access routes capture demand without bypassing access control.

## Role of marketing and intake surfaces
- Marketing, waitlist, and pilot application pages are secondary entry points.
- These surfaces support qualification and pipeline building.
- They do not replace Gatekeeper as the canonical product front door.

## Non-goal
- This routing pattern is not technical debt and should not be treated as a temporary workaround.
