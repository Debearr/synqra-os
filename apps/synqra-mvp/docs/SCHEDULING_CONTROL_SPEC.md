# Scheduling Control Specification

## 1. Design Principle
Scheduling is optional, user-controlled, and additive.
It never blocks content generation and never overrides user intent.

## 2. UX Flow
Create -> (Optional) Schedule -> Publish / Export

Detailed flow:
1. User creates content in Studio.
2. System shows scheduling as an optional step after output is ready.
3. User can choose one of three actions:
   - Accept suggested time
   - Pick a manual time
   - Skip scheduling
4. User can proceed to publish/export whether scheduling is used or skipped.

## 3. Scheduling Controls
- Suggested times:
  - Advisory recommendations based on selected platform context.
  - User can ignore with no penalty.
- Manual picker:
  - User can set exact date/time manually.
  - Manual choice always has priority over suggestions.
- Skip option:
  - Always visible.
  - One click to continue without scheduling.

## 4. Non-Blocking Rules
- Generation must complete even when scheduling is disabled.
- Skip cannot reduce output quality, access, or feature availability.
- Publish/export path remains available without any schedule value.

## 5. What Scheduling Does Not Do
- Does not auto-publish without explicit user action.
- Does not force a posting cadence.
- Does not rewrite approved content.
- Does not prevent manual publishing outside Synqra.
- Does not run hidden automation in the background.

## 6. Scope Boundary (Current State)
This spec defines control behavior and UX policy.
No backend automation refactor or new provider integration is included in this scope.
