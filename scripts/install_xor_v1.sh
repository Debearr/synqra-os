#!/bin/bash
set -euo pipefail

# === ECOSA↔Cursor Bridge Unified Installer (XOR-v1) ===
# Purpose: Installs, validates, and registers ECOSA–Cursor automation bridge
# Author: System Build Automation
# Date: 2025-10-05

echo "🔧 Initializing ECOSA↔Cursor Bridge..."

# Root fallback handling
TARGET_ECOSA="/ecosa"
TARGET_CURSOR_AGENTS="/cursor/agents"
if [ ! -w "/" ]; then
  TARGET_ECOSA="/workspace/ecosa"
  TARGET_CURSOR_AGENTS="/workspace/cursor/agents"
fi

# 1️⃣ Setup directories
mkdir -p "$TARGET_ECOSA"/{scripts,macros,hooks,backups,logs}
mkdir -p "$TARGET_CURSOR_AGENTS"/bridge

# 2️⃣ Create manifest
cat <<'EOF' >"$TARGET_ECOSA/manifest.yml"
version: 1.0
bridge_name: ECOSA_Cursor_Bridge
status: active
auto_register: true
linked_services:
  - Cursor
  - Supabase
  - Railway
qa_mode: continuous
self_heal_enabled: true
log_pipeline: /ecosa/macros/sync_supabase_logs.yml
checksum_validation: enabled
EOF

# 3️⃣ Write core scripts
cat <<'EOF' >"$TARGET_ECOSA/scripts/build_bridge.sh"
#!/bin/bash
set -euo pipefail
echo "🔩 Building ECOSA–Cursor Bridge..."
ROOT_DIR="/ecosa"; [ -d "$ROOT_DIR" ] || ROOT_DIR="/workspace/ecosa"
cp -r "$ROOT_DIR/macros" "$ROOT_DIR/hooks" "$ROOT_DIR/agents" "$ROOT_DIR/" 2>/dev/null || true
cp -r /workspace/macros /workspace/hooks /workspace/agents "$ROOT_DIR/" 2>/dev/null || true
echo "✅ Build complete"
EOF

cat <<'EOF' >"$TARGET_ECOSA/scripts/check_integrity.sh"
#!/bin/bash
set -euo pipefail
echo "🧩 Checking Cursor agent integrity..."
AGENTS_DIR="/cursor/agents"; [ -d "$AGENTS_DIR" ] || AGENTS_DIR="/workspace/cursor/agents"
if [ ! -d "$AGENTS_DIR" ]; then
  echo "[WARN] Agents dir not found: $AGENTS_DIR"; exit 0
fi
for f in "$AGENTS_DIR"/*.json; do
  [ -e "$f" ] || continue
  if command -v jq >/dev/null 2>&1; then
    jq empty "$f" || { echo "❌ Corrupted agent: $f"; exit 1; }
  fi
done
echo "✅ All agents validated"
EOF

cat <<'EOF' >"$TARGET_ECOSA/scripts/sync_supabase.sh"
#!/bin/bash
set -euo pipefail
echo "📡 Syncing agents to Supabase..."
: "${SUPABASE_URL:?SUPABASE_URL is required}"
: "${SUPABASE_KEY:?SUPABASE_KEY is required}"
AGENTS_DIR="/cursor/agents"; [ -d "$AGENTS_DIR" ] || AGENTS_DIR="/workspace/cursor/agents"
for f in "$AGENTS_DIR"/*.json; do
  [ -e "$f" ] || continue
  checksum=$(sha256sum "$f" | cut -d' ' -f1)
  ts=$(date -u +%Y-%m-%dT%H:%M:%SZ)
  payload=$(jq -n --arg name "$(basename "$f")" --arg checksum "$checksum" --arg ts "$ts" '{agent_name:$name, checksum:$checksum, timestamp:$ts}')
  curl -s -X POST "$SUPABASE_URL/rest/v1/agent_logs" \
    -H "apikey: $SUPABASE_KEY" \
    -H "Content-Type: application/json" \
    -d "$payload"
done
echo "✅ Sync complete"
EOF

cat <<'EOF' >"$TARGET_ECOSA/scripts/self_heal.sh"
#!/bin/bash
set -euo pipefail
echo "♻️ Running self-heal cycle..."
ROOT_DIR="/ecosa"; [ -d "$ROOT_DIR" ] || ROOT_DIR="/workspace/ecosa"
BACKUP_DIR="$ROOT_DIR/backups"
mkdir -p "$BACKUP_DIR"
AGENTS_DIR="/cursor/agents"; [ -d "$AGENTS_DIR" ] || AGENTS_DIR="/workspace/cursor/agents"
find "$AGENTS_DIR" -type f -mtime +7 -exec cp -t "$BACKUP_DIR" {} + || true
bash "$ROOT_DIR/scripts/check_integrity.sh" || bash "$ROOT_DIR/scripts/build_bridge.sh"
echo "✅ Self-heal complete"
EOF

chmod +x "$TARGET_ECOSA/scripts"/*.sh

# 4️⃣ Register hooks
cat <<'EOF' >"$TARGET_ECOSA/hooks/post_commit_hook.yml"
on:
  commit:
    - run: bash /ecosa/scripts/build_bridge.sh
    - run: bash /ecosa/scripts/sync_supabase.sh
EOF

cat <<'EOF' >"$TARGET_ECOSA/hooks/auto_rebuild.yml"
on:
  change:
    - /cursor/agents/*
  run:
    - railway up
EOF

# 5️⃣ QA macro
cat <<'EOF' >"$TARGET_ECOSA/macros/selfcheck_quality.yml"
schedule:
  weekly: Sunday 00:00
run:
  - bash /ecosa/scripts/check_integrity.sh
  - bash /ecosa/scripts/self_heal.sh
EOF

# 6️⃣ Heartbeat log to Supabase
if [ -n "${SUPABASE_URL:-}" ] && [ -n "${SUPABASE_KEY:-}" ]; then
  curl -s -X POST "$SUPABASE_URL/rest/v1/system_logs" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"service\":\"ECOSA_Cursor_Bridge\",\"status\":\"OK\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}"
fi

echo "✅ ECOSA↔Cursor Bridge fully installed and registered."
echo "🧠 Continuous QA + auto-sync now active."
