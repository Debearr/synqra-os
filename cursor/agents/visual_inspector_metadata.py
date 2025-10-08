#!/usr/bin/env python3
"""
Visual Inspector — Metadata Enhancer
- Recursively scans asset folders
- Computes sha256, size (MB), UTC timestamp
- Updates Supabase `asset_logs` via upsert (by filename)
- Writes local JSON and CSV mirrors for human-readable dashboards

Env:
  SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY

Usage:
  python cursor/agents/visual_inspector_metadata.py
"""

import hashlib
import os
import json
import csv
from datetime import datetime, timezone
from typing import Dict, List

from supabase import create_client, Client

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

ASSET_PATHS = ["./assets/static", "./assets/motion"]
LOG_JSON = "./logs/visual_inspector_log.json"
LOG_CSV = "./logs/visual_inspector_log.csv"
SUPPORTED_EXTENSIONS = (".png", ".jpg", ".jpeg", ".mp4", ".webp", ".gif", ".svg")


def ensure_dirs() -> None:
    logs_dir = os.path.dirname(LOG_JSON) or "."
    os.makedirs(logs_dir, exist_ok=True)


def compute_sha256(filepath: str) -> str:
    hash_obj = hashlib.sha256()
    with open(filepath, "rb") as file_handle:
        for chunk in iter(lambda: file_handle.read(1024 * 1024), b""):
            hash_obj.update(chunk)
    return hash_obj.hexdigest()


ess: Client | None = None

def get_supabase_client() -> Client | None:
    global ess
    if SUPABASE_URL and SUPABASE_KEY:
        if ess is None:
            ess = create_client(SUPABASE_URL, SUPABASE_KEY)
        return ess
    return None


def utc_now_iso() -> str:
    return datetime.now(tz=timezone.utc).isoformat()


def get_file_metadata(filepath: str) -> Dict[str, object]:
    stats = os.stat(filepath)
    size_mb = round(stats.st_size / (1024 * 1024), 3)
    checksum = compute_sha256(filepath)
    timestamp = utc_now_iso()
    return {
        "filename": os.path.basename(filepath),
        "path": filepath,
        "size_mb": size_mb,
        "checksum_sha256": checksum,
        "timestamp": timestamp,
    }


def iter_asset_files() -> List[str]:
    files: List[str] = []
    for root in ASSET_PATHS:
        if not os.path.isdir(root):
            continue
        for dirpath, _, filenames in os.walk(root):
            for name in filenames:
                if name.lower().endswith(SUPPORTED_EXTENSIONS):
                    files.append(os.path.join(dirpath, name))
    return files


def upsert_supabase(metadata: Dict[str, object]) -> None:
    client = get_supabase_client()
    if client is None:
        return
    # Try update by filename; if no row, insert
    filename = metadata["filename"]
    update_payload = {
        "size_mb": metadata["size_mb"],
        "checksum_sha256": metadata["checksum_sha256"],
        "last_validated": metadata["timestamp"],
        "path": metadata["path"],
    }

    # Update first
    update_resp = client.table("asset_logs").update(update_payload).eq("filename", filename).execute()

    try:
        updated_count = len(update_resp.data) if getattr(update_resp, "data", None) else 0
    except Exception:
        updated_count = 0

    if updated_count == 0:
        insert_payload = {
            "filename": filename,
            **update_payload,
        }
        client.table("asset_logs").insert(insert_payload).execute()


def write_json_log(all_metadata: List[Dict[str, object]]) -> None:
    with open(LOG_JSON, "w", encoding="utf-8") as fp:
        json.dump(all_metadata, fp, indent=2, ensure_ascii=False)


def write_csv_log(all_metadata: List[Dict[str, object]]) -> None:
    if not all_metadata:
        # still create an empty CSV with headers
        headers = ["filename", "path", "size_mb", "checksum_sha256", "timestamp"]
        with open(LOG_CSV, "w", newline="", encoding="utf-8") as fp:
            writer = csv.writer(fp)
            writer.writerow(headers)
        return

    headers = list(all_metadata[0].keys())
    with open(LOG_CSV, "w", newline="", encoding="utf-8") as fp:
        writer = csv.DictWriter(fp, fieldnames=headers)
        writer.writeheader()
        writer.writerows(all_metadata)


def scan_and_update() -> None:
    ensure_dirs()
    all_metadata: List[Dict[str, object]] = []

    asset_files = iter_asset_files()
    for index, filepath in enumerate(asset_files, start=1):
        metadata = get_file_metadata(filepath)
        all_metadata.append(metadata)
        upsert_supabase(metadata)
        print(f"✅ [{index}/{len(asset_files)}] {metadata['filename']} — {metadata['size_mb']} MB")

    write_json_log(all_metadata)
    write_csv_log(all_metadata)
    print("\n📊 Metadata sync complete — Supabase + local JSON/CSV updated.")


if __name__ == "__main__":
    scan_and_update()
