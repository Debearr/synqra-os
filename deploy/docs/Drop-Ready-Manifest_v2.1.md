---
title: Drop-Ready Manifest
version: 2.1
brand: NØID / SYNQRA
date: 2025-10-08
---

## Overview

This manifest documents the assets and automation used to generate marketing drafts via the NØID/SYNQRA/AuraFX pipeline.

## Pipeline

1. Ingest transcript to `content_intents`
2. Parse with OpenAI
3. Timing forecast via AuraFX
4. Visual preview via Leonardo
5. Draft creation in SYNQRA

## Tables

- `content_intents` (with `preview_url`, `scheduled_time`)
- `error_log`
- `service_health`
- `idempotency_keys`

## Prompts

- `SYNQRA_Visual_Prompt_LuxuryTech_v1` (Leonardo preset)

## Notes

RLS is enabled; service access via `service_role`.

