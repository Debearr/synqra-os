# Synqra-OS-Intake

**Autonomous Ingestion & Intelligence Layer**

This project provides an autonomous system for collecting, processing, and distributing operational data within Synqra OS.

## Architecture

1. **Synqra-Raw-Collector**: Collects anonymous data from various sources (logs, listings, compliance).
2. **Synqra-Insight-Engine**: Analyzes raw data to generate AI insights, recommended actions, and severity ratings.
3. **Synqra-Pipeline**: Distributes processed entries to multiple targets:
    * Google Sheets
    * Supabase
    * Railway Postgres
    * Local JSON
    * Synqra Central Memory Bus

## Usage

### Development

```bash
pnpm dev
```

### Build

```bash
pnpm build
```

### Start

```bash
pnpm start
```

## Configuration

Ensure environment variables are set for:

* `SUPABASE_URL`
* `SUPABASE_KEY`
* `GOOGLE_SHEETS_CREDENTIALS`
* `POSTGRES_CONNECTION_STRING`
