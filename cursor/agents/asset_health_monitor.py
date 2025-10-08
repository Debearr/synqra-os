#!/usr/bin/env python3
"""
Asset Health Monitor — Visual dashboard of asset health + sync status

Depends on Supabase table: asset_logs

Columns expected (at least):
  - filename (text)
  - size_mb (number)
  - checksum_sha256 (text)
  - last_validated (timestamptz / ISO string)
  - path (text) optional

Usage:
  python cursor/agents/asset_health_monitor.py
"""

import os
from datetime import datetime, timezone
from typing import Optional

import pandas as pd
from supabase import create_client, Client
from rich.console import Console
from rich.table import Table

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

console = Console()

_client: Optional[Client] = None

def get_client() -> Optional[Client]:
    global _client
    if SUPABASE_URL and SUPABASE_KEY:
        if _client is None:
            _client = create_client(SUPABASE_URL, SUPABASE_KEY)
        return _client
    return None


def fetch_asset_data() -> pd.DataFrame:
    client = get_client()
    if client is None:
        return pd.DataFrame(columns=["filename", "size_mb", "checksum_sha256", "last_validated", "path"]) 
    response = client.table("asset_logs").select("*").execute()
    data = getattr(response, "data", []) or []
    return pd.DataFrame(data)


def _parse_dt(value):
    if not isinstance(value, str) or not value:
        return None
    try:
        # handle possible trailing Z
        if value.endswith("Z"):
            value = value[:-1]
        return datetime.fromisoformat(value)
    except Exception:
        return None


def analyze_health(df: pd.DataFrame) -> pd.DataFrame:
    if df.empty:
        return df

    df = df.copy()

    # normalize types
    if "size_mb" in df.columns:
        df["size_mb"] = pd.to_numeric(df["size_mb"], errors="coerce")

    df["parsed_dt"] = df.get("last_validated", pd.Series(dtype=object)).apply(_parse_dt)
    now = datetime.now(tz=timezone.utc).replace(tzinfo=None)

    def compute_days_since(dt):
        if dt is None:
            return None
        delta = now - dt
        return max(delta.days, 0)

    df["time_since_update"] = df["parsed_dt"].apply(compute_days_since)

    def compute_health(row):
        has_size = (row.get("size_mb") or 0) > 0
        has_checksum = bool(row.get("checksum_sha256"))
        has_validated = row.get("parsed_dt") is not None
        if has_size and has_checksum and has_validated:
            if (row.get("time_since_update") or 9999) <= 7:
                return "✅ OK"
            return "ℹ️ Stale"
        return "⚠️ Needs Check"

    df["health_status"] = df.apply(compute_health, axis=1)

    return df


def render_dashboard(df: pd.DataFrame) -> None:
    table = Table(show_header=True, header_style="bold cyan")
    table.add_column("Filename", justify="left")
    table.add_column("Size (MB)", justify="right")
    table.add_column("Checksum", justify="left")
    table.add_column("Last Validated", justify="center")
    table.add_column("Days Since Update", justify="right")
    table.add_column("Health", justify="center")

    if df.empty:
        console.print("\n🧩 ASSET HEALTH MONITOR — No data found.\n", style="bold yellow")
        return

    for _, row in df.sort_values(by=["health_status", "time_since_update"], ascending=[True, True]).iterrows():
        checksum_short = (row.get("checksum_sha256") or "").strip()
        checksum_short = (checksum_short[:10] + "...") if checksum_short else "—"
        last_validated = row.get("last_validated") or "—"
        time_since_update = row.get("time_since_update")
        time_since_update_str = "—" if time_since_update is None else str(time_since_update)

        size_val = row.get("size_mb")
        size_str = "—" if size_val is None else f"{size_val:.3f}"

        table.add_row(
            str(row.get("filename", "—")),
            size_str,
            checksum_short,
            str(last_validated),
            time_since_update_str,
            str(row.get("health_status", "—")),
        )

    console.print("\n🧩 ASSET HEALTH MONITOR — SYNQRA + NØID\n", style="bold yellow")
    console.print(table)


if __name__ == "__main__":
    df = fetch_asset_data()
    df = analyze_health(df)
    render_dashboard(df)
    print("\n✅ Dashboard refreshed successfully.")
