# IDENTITY PROMPT GUARDRAILS

**Status:** Authoritative  
**Scope:** Prompt templates, config, and docs only  
**Applies To:** Synqra, NØID, AuraFX prompt outputs

---

## Purpose

This document defines deterministic identity rules for all generation prompts so outputs remain non-conflicting and clone-safe.

---

## Identity Hierarchy

1. **System Seal (Halo)**
2. **Monogram Stamp**
3. **Creator Stamp**

Hierarchy is strict and cannot be reordered.

---

## Conflict Rule

- No output surface may contain more than one identity asset.
- Never combine System Seal and Monogram Stamp on the same surface.
- Never combine Creator Stamp with any other identity asset on the same surface.

---

## Asset Rules

### System Seal (Halo)
- Purpose: authority, access, system entry, restricted state indication.
- Behavior: static, non-decorative.
- Prohibition: never used inside content creation flows.

### Monogram Stamp
- Purpose: compact identity marker.
- Surfaces: favicon, avatar, optional attribution.
- Behavior: minimal and secondary to content.

### Creator Stamp (Optional)
- Purpose: attribution on generated media/docs.
- Placement: bottom-right only.
- Behavior: extremely subtle, never mandatory, never louder than content.
- Text allowance: Synqra name or monogram only.

---

## Viral Loop Constraint

Attribution must feel earned, not promotional.

Forbidden in attribution:
- Calls to action
- Marketing language
- Decorative logo treatment
- Enlarged attribution

---

## Clone Safety Rule

Each generation must activate exactly one identity profile:
- `synqra`
- `noid`
- `aurafx`

Cross-profile mixing in one output is forbidden.

---

## Prompt Enforcement Snippet

Use this block in system prompts/templates:

```text
IDENTITY ENFORCEMENT:
- Identity hierarchy is fixed: System Seal > Monogram Stamp > Creator Stamp.
- Only one identity asset per surface; no competing marks.
- Creator Stamp is optional, bottom-right only, extremely subtle, never mandatory.
- Attribution must feel earned, never promotional.
- No calls to action, no marketing language, no decorative logos, no enlarged attribution.
- Activate exactly one identity profile per output: synqra OR noid OR aurafx.
```

