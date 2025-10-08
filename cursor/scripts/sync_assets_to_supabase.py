#!/usr/bin/env python3
"""
Sync Assets to Supabase
- Recursively scans assets folders
- Computes sha256 checksums and size (MB)
- Detects project from filename or folder
- Upserts into Supabase `asset_logs`

Folders:
  assets/static
  assets/motion

Env:
  SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY

Usage:
  python cursor/scripts/sync_assets_to_supabase.py
"""

import os
import hashlib
from datetime import datetime, timezone
from typing import Iterable

from supabase import create_client

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

action_client = None
if SUPABASE_URL and SUPABASE_KEY:
    action_client = create_client(SUPABASE_URL, SUPABASE_KEY)

ASSET_FOLDERS = ["assets/static", "assets/motion", "assets/motions"]
SUPPORTED_EXTENSIONS = (".png", ".jpg", ".jpeg", ".webp", ".svg", ".gif", ".mp4", ".mov")


def utc_now_iso() -> str:
    return datetime.now(tz=timezone.utc).isoformat()


def sha256_checksum(path: str) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def iter_files(paths: Iterable[str]):
    for root in paths:
        if not os.path.isdir(root):
            continue
        for dirpath, _, filenames in os.walk(root):
            for name in filenames:
                if name.lower().endswith(SUPPORTED_EXTENSIONS):
                    yield os.path.join(dirpath, name)


def infer_project(filename: str, fullpath: str) -> str:
    name_upper = filename.upper()
    if "SYNQRA" in name_upper or "SYNQRA" in fullpath.upper():
        return "synqra"
    if "NOID" in name_upper or "NOID" in fullpath.upper():
        return "noid"
    # default by folder
    uniform = fullpath.replace("\\", "/")
    if "/motion/" in uniform or "/motions/" in uniform:
        return "synqra"
    return "noid"


def sync_assets() -> None:
    if action_client is None:
        print("Supabase client not configured — set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY")
        return

    files = list(iter_files(ASSET_FOLDERS))
    total = len(files)
    for idx, fpath in enumerate(files, start=1):
        filename = os.path.basename(fpath)
        size_mb = round(os.path.getsize(fpath) / (1024 * 1024), 3)
        checksum = sha256_checksum(fpath)
        project = infer_project(filename, fpath)
        payload = {
            "filename": filename,
            "size_mb": size_mb,
            "checksum_sha256": checksum,
            "last_validated": utc_now_iso(),
            "path": fpath,
            "project": project,
        }
        action_client.table("asset_logs").upsert(payload, on_conflict="filename").execute()
        print(f"✅ [{idx}/{total}] {filename} — {size_mb} MB — {project}")
    print("\n✅ Asset folders synced to Supabase.")


if __name__ == "__main__":
    sync_assets()
