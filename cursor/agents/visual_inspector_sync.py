# /cursor/agents/visual_inspector_sync.py
# Extends the Visual Inspector with Supabase + Google Sheets auto-sync

import json
import requests
from supabase import create_client, Client
import os

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_SERVICE_KEY")
SHEETS_WEBHOOK_URL = os.getenv("SHEETS_WEBHOOK_URL")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
LOG_PATH = "./logs/visual_inspector_log.json"

def sync_to_supabase(entry):
    try:
        supabase.table("asset_logs").update({
            "validation_status": "✅" if entry.get("compliant") else "❌",
            "dominant_color": str(entry.get("dominant_color")),
            "last_scan": entry.get("timestamp")
        }).eq("file_name", entry.get("filename")).execute()
        print(f"🔁 Updated Supabase for {entry['filename']}")
    except Exception as e:
        print("❌ Supabase update failed:", e)

def sync_to_sheets(entry):
    if not SHEETS_WEBHOOK_URL:
        return
    payload = {
        "filename": entry.get("filename"),
        "validation": "✅" if entry.get("compliant") else "❌",
        "dominant_color": entry.get("dominant_color"),
        "timestamp": entry.get("timestamp")
    }
    try:
        requests.post(SHEETS_WEBHOOK_URL, json=payload, timeout=10)
        print(f"📊 Synced to Google Sheets: {entry['filename']}")
    except Exception as e:
        print("❌ Sheets sync failed:", e)

def run_sync():
    with open(LOG_PATH, "r") as f:
        data = json.load(f)
        for entry in data:
            sync_to_supabase(entry)
            sync_to_sheets(entry)
    print("✅ All inspection logs synced successfully.")

if __name__ == "__main__":
    run_sync()
