#!/usr/bin/env bash
set -euo pipefail

# deploy_utils.sh
# Utilities to log deployments and render a momentum-aware dashboard.

# --- Helpers ---
die() { echo "[deploy_utils] $*" >&2; exit 1; }

read_safe_percent() {
  local v
  v="${1//[^0-9]/}"
  if [[ -z "$v" ]]; then v=0; fi
  if (( v < 0 )); then v=0; fi
  if (( v > 100 )); then v=100; fi
  echo "$v"
}

compute_project_momentum() {
  local project_id
  project_id="$1"
  local first_val="" last_val="" change=0
  if [[ -f DEPLOY_LOG.md ]]; then
    local history_vals
    history_vals=$(grep "\[PROJECT: ${project_id}\]" DEPLOY_LOG.md | head -n5 | awk -F'—' '{print $3}' | tr -d ' %' | tac || true)
    for val in $history_vals; do
      [[ -z "$first_val" ]] && first_val="$val"
      last_val="$val"
    done
    if [[ -n "$first_val" && -n "$last_val" ]]; then
      change=$((last_val - first_val))
    fi
  fi
  local icon="➡️" emoji="🟡" row_class="row-flat"
  if (( change > 0 )); then
    icon="⬆️"; emoji="🟢"; row_class="row-up"
  elif (( change < 0 )); then
    icon="⬇️"; emoji="🔴"; row_class="row-down"
  fi
  echo "$icon|$emoji|$row_class|$first_val|$last_val|$change"
}

compute_global_momentum() {
  local first_val="" last_val="" change=0
  if [[ -f DEPLOY_LOG.md ]]; then
    local history
    history=$(grep "\[PROJECT:" DEPLOY_LOG.md | head -n20 | awk -F'—' '{print $3}' | tr -d ' %' | tac | awk '{sum+=$1; count++; if(count==5){print sum/count; sum=0; count=0}}' | head -n5 | tr '\n' ' ' || true)
    for val in $history; do
      [[ -z "$first_val" ]] && first_val="$val"
      last_val="$val"
    done
    if [[ -n "$first_val" && -n "$last_val" ]]; then
      change=$((last_val - first_val))
    fi
  fi
  local cls="global-flat" icon="➡️" emoji="🟡"
  if (( change > 0 )); then
    cls="global-up"; icon="⬆️"; emoji="🟢"
  elif (( change < 0 )); then
    cls="global-down"; icon="⬇️"; emoji="🔴"
  fi
  echo "$cls|$icon|$emoji|$first_val|$last_val|$change"
}

# --- Logging ---
# Usage: log_deploy <project_id> <url> <percent>
log_deploy() {
  local project url percent_raw percent
  project="$1"; url="$2"; percent_raw="${3:-0}"
  percent=$(read_safe_percent "$percent_raw")

  # Deployment increment mode (affects projects.json update)
  local mode
  mode="${DEPLOY_MODE:-adaptive}"

  # Determine global momentum for log entry
  local _gcls gicon gemoji _gf _gl gc
  IFS='|' read -r _gcls gicon gemoji _gf _gl gc <<<"$(compute_global_momentum)"
  local global_icon="${gicon:-➡️}" global_emoji="${gemoji:-🟡}"

  # Determine per-project momentum for log entry
  local pi pe _rc _pf _pl pchange
  IFS='|' read -r pi pe _rc _pf _pl pchange <<<"$(compute_project_momentum "$project")"
  local proj_icon="${pi:-➡️}" proj_emoji="${pe:-🟡}"

  # Mode state fallback from .mode_state
  local modeLabel="Corner Snap Mode" modeEmoji="🟥"
  if [[ -f .mode_state ]]; then
    local state
    state=$(cat .mode_state || true)
    if [[ "$state" == "edge" ]]; then
      modeLabel="Magnetic Edge Mode"; modeEmoji="🟦"
    fi
  fi

  # Pulse speed state from .pulse_state (1-5)
  local pulseSpeed="3" pulseLabel="Medium Heartbeat"
  if [[ -f .pulse_state ]]; then
    pulseSpeed=$(cat .pulse_state || echo 3)
  fi
  case "$pulseSpeed" in
    1|2) pulseLabel="Fast Heartbeat" ;;
    3)   pulseLabel="Medium Heartbeat" ;;
    4|5) pulseLabel="Slow Heartbeat" ;;
    *)   pulseLabel="Medium Heartbeat" ;;
  esac

  local ts day
  ts=$(date +"%Y-%m-%d %H:%M:%S")
  day=$(date +"%Y-%m-%d")

  # Colored increment mode label for log entry
  local modeColor
  if [[ "$mode" == "fixed" ]]; then
    modeColor="<span style='color:#F44336'>⚙️ Fixed Increment</span>"
  else
    modeColor="<span style='color:#2196F3'>⚙️ Adaptive Increment</span>"
  fi

  # Colored heartbeat label for log entry
  local pulseColor
  case "$pulseLabel" in
    "Fast"|"Fast Heartbeat") pulseColor="<span style='color:#4CAF50'>Fast</span>" ;;
    "Medium"|"Medium Heartbeat") pulseColor="<span style='color:#FFC107'>Medium</span>" ;;
    "Slow"|"Slow Heartbeat") pulseColor="<span style='color:#F44336'>Slow</span>" ;;
    "Critical") pulseColor="<span style='color:#F44336'>🔴💔 CRITICAL</span>" ;;
    *) pulseColor="$pulseLabel" ;;
  esac

  # Gradient heartbeat label for log entry
  local pulseGradient
  case "$pulseLabel" in
    "Fast"|"Fast Heartbeat") pulseGradient="<span style='background:linear-gradient(90deg, #4CAF50, #81C784); -webkit-background-clip:text; color:transparent;'>Fast</span>" ;;
    "Medium"|"Medium Heartbeat") pulseGradient="<span style='background:linear-gradient(90deg, #FFC107, #FFD54F); -webkit-background-clip:text; color:transparent;'>Medium</span>" ;;
    "Slow"|"Slow Heartbeat") pulseGradient="<span style='background:linear-gradient(90deg, #F44336, #E57373); -webkit-background-clip:text; color:transparent;'>Slow</span>" ;;
    "Critical") pulseGradient="<span style='background:linear-gradient(90deg, #B71C1C, #F44336); -webkit-background-clip:text; color:transparent;'>CRITICAL</span>" ;;
    *) pulseGradient="$pulseLabel" ;;
  esac

  # Prepend entry to DEPLOY_LOG.md
  {
    echo "### $day"
    echo "- [$ts] [PROJECT: $project] — Live: $url — ${percent}% — Global: $global_icon $global_emoji | Project: $proj_icon $proj_emoji | Mode: $modeEmoji $modeLabel • $modeColor • 🖤 $pulseGradient"
    echo ""
  } | { [ -f DEPLOY_LOG.md ] && cat - DEPLOY_LOG.md || cat -; } > .DEPLOY_LOG.tmp && mv .DEPLOY_LOG.tmp DEPLOY_LOG.md

  echo "[deploy] 📓 Logged entry for $project"

  # --- Auto-update projects.json ---
  if [[ -f projects.json ]]; then
    local ts_iso
    ts_iso=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    if ! command -v jq >/dev/null 2>&1; then
      echo "[deploy] Installing jq for JSON manipulation..."
      if command -v apt-get >/dev/null 2>&1; then
        sudo apt-get update -y && sudo apt-get install -y jq
      elif command -v brew >/dev/null 2>&1; then
        brew install jq
      fi
    fi
    # Increment strategy based on DEPLOY_MODE
    if [[ "$mode" == "fixed" ]]; then
      jq --arg name "$project" --arg ts "$ts_iso" '
        map(
          if (.name == $name or .id == $name) then
            .percent = ((.percent + 2) | if . > 100 then 100 else . end) |
            .last = $ts
          else . end
        )
      ' projects.json > projects.tmp && mv projects.tmp projects.json
      echo "[deploy] ✅ [Fixed] $project progress +2% → updated with $ts_iso"
    else
      jq --arg name "$project" --arg ts "$ts_iso" '
        map(
          if (.name == $name or .id == $name) then
            .percent = (
              if .percent < 50 then .percent + 5
              elif .percent < 80 then .percent + 3
              else .percent + 1 end
            ) | if . > 100 then 100 else . end |
            .last = $ts
          else . end
        )
      ' projects.json > projects.tmp && mv projects.tmp projects.json
      echo "[deploy] ✅ [Adaptive] $project progress auto-adjusted → updated with $ts_iso"
    fi
  fi
}

# --- Dashboard Renderer ---
render_dashboard() {
  local title_class="title-flat" title_emoji="🟡"
  local _gcls gicon gemoji _gf _gl gc
  IFS='|' read -r _gcls gicon gemoji _gf _gl gc <<<"$(compute_global_momentum)"
  if [[ "${gc:-0}" -gt 0 ]]; then
    title_class="title-up"; title_emoji="🟢"
  elif [[ "${gc:-0}" -lt 0 ]]; then
    title_class="title-down"; title_emoji="🔴"
  fi
  local global_class="${_gcls:-global-flat}" global_icon="${gicon:-➡️}" global_emoji="${gemoji:-🟡}"

  cat <<EOL
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>📊 Project Status Dashboard</title>
<style>
  body { background:#0b0b0b; color:#e6e6e6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Helvetica Neue', Arial, sans-serif; margin:0; padding:20px; }
  a { color:#90caf9; }
  table { width:100%; border-collapse: collapse; margin-top:16px; }
  th, td { padding:8px 10px; border-bottom:1px solid #222; text-align:left; vertical-align:middle; }
  th { background:#111; position:sticky; top:0; z-index:2; }
  .sparkline-green { stroke: #4caf50; stroke-width: 2; fill: none; }
  .sparkline-yellow { stroke: #ffc107; stroke-width: 2; fill: none; }
  .sparkline-red { stroke: #f44336; stroke-width: 2; fill: none; }
  .title-up { background-color: rgba(76, 175, 80, 0.25); padding:12px; border-radius:8px; }
  .title-flat { background-color: rgba(255, 193, 7, 0.25); padding:12px; border-radius:8px; }
  .title-down { background-color: rgba(244, 67, 54, 0.25); padding:12px; border-radius:8px; }
  .row-up { background-color: rgba(76, 175, 80, 0.1); }
  .row-flat { background-color: rgba(255, 193, 7, 0.1); }
  .row-down { background-color: rgba(244, 67, 54, 0.1); }
  .global-up { background-color: rgba(76, 175, 80, 0.15); padding:10px; border-radius:8px; }
  .global-flat { background-color: rgba(255, 193, 7, 0.15); padding:10px; border-radius:8px; }
  .global-down { background-color: rgba(244, 67, 54, 0.15); padding:10px; border-radius:8px; }
  #legend-card { transition: left 0.2s ease, top 0.2s ease, background-color 0.3s ease; }
  #legend-card.corner-mode { background-color: rgba(244, 67, 54, 0.08); }
  #legend-card.edge-mode { background-color: rgba(33, 150, 243, 0.08); }
  #dashboard-header { border-left: 6px solid transparent; padding-left: 10px; transition: border-color 0.3s ease, background-color 0.3s ease; }
  #dashboard-header.corner-mode { background-color: rgba(244, 67, 54, 0.12); border-left-color: #F44336; }
  #dashboard-header.edge-mode { background-color: rgba(33, 150, 243, 0.12); border-left-color: #2196F3; }
  #dashboard-sidebar { border-left: 6px solid transparent; transition: border-color 0.3s ease; }
  #dashboard-sidebar.corner-mode { border-left-color: #F44336; }
  #dashboard-sidebar.edge-mode { border-left-color: #2196F3; }
  :root { --pulse-speed: 3s; }
  [data-pulse] { animation-duration: var(--pulse-speed) !important; }
  @keyframes pulseGlowRed { 0% { box-shadow: 0 0 4px rgba(244, 67, 54, 0.4); } 50% { box-shadow: 0 0 12px rgba(244, 67, 54, 0.7); } 100% { box-shadow: 0 0 4px rgba(244, 67, 54, 0.4); } }
  @keyframes pulseGlowBlue { 0% { box-shadow: 0 0 4px rgba(33, 150, 243, 0.4); } 50% { box-shadow: 0 0 12px rgba(33, 150, 243, 0.7); } 100% { box-shadow: 0 0 4px rgba(33, 150, 243, 0.4); } }
  #dashboard-header.corner-mode, #dashboard-sidebar.corner-mode, tr.corner-mode { animation: pulseGlowRed var(--pulse-speed) infinite ease-in-out; animation-delay: 0s !important; }
  #dashboard-header.edge-mode, #dashboard-sidebar.edge-mode, tr.edge-mode { animation: pulseGlowBlue var(--pulse-speed) infinite ease-in-out; animation-delay: 0s !important; }
  #mode-subtitle { font-size: 14px; font-style: italic; margin-top: -4px; opacity: 0.75; }
  .bar-outer { position:relative; width:100%; background:#333; border-radius:4px; height:16px; }
  .bar-inner { height:16px; border-radius:4px; }
</style>
</head>
<body>
  <header id="dashboard-header" class="corner-mode" data-pulse>
    <h1 class="$title_class">📊 Project Status Dashboard $title_emoji</h1>
    <p>Last updated: $(date +"%Y-%m-%d %H:%M:%S")</p>
    <div id="header-mode" style="margin-top:4px; font-size:13px; opacity:0.85;"></div>
  </header>
  <aside id="dashboard-sidebar" class="corner-mode" style="margin-top:10px;"></aside>
  <h2>🔥 Progress Trend Snapshot</h2>
  <div class="$global_class" style="display:flex; align-items:center; gap:20px; flex-wrap:wrap;" data-pulse>
    <div style="font-size:18px;"><strong>Overall Avg Progress:</strong> $( [[ -f projects.json ]] && jq -r '[.[].percent] | if length>0 then (add/length) else 0 end' projects.json || echo 0 )%</div>
    <div>
      <div style="font-size:20px; margin-bottom:6px;">$global_icon $global_emoji</div>
      <svg width="160" height="40"><polyline class="sparkline-yellow" points="0,20 20,10 40,25 60,15 80,22 100,18 120,26 140,12"/></svg>
    </div>
  </div>
  <table>
    <tr><th>Project</th><th>Status %</th><th>Trend</th><th>Momentum</th><th>Last Deployed</th><th>Notes</th></tr>
EOL

  # Increment mode label for tooltips
  local inc_mode_label
  if [[ "${DEPLOY_MODE:-adaptive}" == "fixed" ]]; then
    inc_mode_label="Fixed Increment"
  else
    inc_mode_label="Adaptive Increment"
  fi

  if [[ -f projects.json ]]; then
    while IFS= read -r proj; do
      [[ -z "$proj" ]] && continue
      local id name percent notes last
      id=$(jq -r '.id // .name // "unknown"' <<<"$proj")
      name=$(jq -r '.name // .id // "Unknown"' <<<"$proj")
      percent=$(read_safe_percent "$(jq -r '.percent // 0' <<<"$proj")")
      notes=$(jq -r '.notes // ""' <<<"$proj")
      last=$(jq -r '.last // "N/A"' <<<"$proj")
      local sparkline
      sparkline="<svg width='120' height='30'><polyline class='sparkline-yellow' points='0,15 20,12 40,18 60,10 80,16 100,12 120,20'/></svg>"
      local momentum_icon momentum_emoji row_class first_val last_val change
      IFS='|' read -r momentum_icon momentum_emoji row_class first_val last_val change <<<"$(compute_project_momentum "$id")"
      local delta
      if [[ -n "${first_val:-}" && -n "${last_val:-}" ]]; then
        if (( change > 0 )); then
          delta="<span style='color:#4caf50; font-weight:bold;'>+${change}%</span>"
        elif (( change < 0 )); then
          delta="<span style='color:#f44336; font-weight:bold;'>${change}%</span>"
        else
          delta="<span style='color:#ffc107; font-weight:bold;'>0%</span>"
        fi
      else
        delta="<span style='color:#aaa;'>N/A</span>"
      fi
      local bar_color="#f44336"
      if (( percent >= 80 )); then bar_color="#4caf50"; elif (( percent >= 50 )); then bar_color="#ffc107"; fi
      local tooltip
      tooltip="Global: $global_icon $global_emoji | Project: $momentum_icon $momentum_emoji • ⚙️ $inc_mode_label"
      cat <<ROW
    <tr class='$row_class'>
      <td>$name</td>
      <td>
        <div title='$tooltip'>
          <div class='bar-outer'>
            <div class='bar-inner' style='width:${percent}%; background:$bar_color;' title='$tooltip'></div>
          </div>
          <div style='margin-top:4px;'>${percent}%</div>
        </div>
      </td>
      <td>
        <div title='$tooltip'>
          $sparkline
          <div style='font-size:12px;'>Δ $delta</div>
        </div>
      </td>
      <td style='font-size:20px;'>$momentum_icon $momentum_emoji</td>
      <td>$last</td>
      <td>$notes</td>
    </tr>
ROW
    done < <(jq -c '.[]' projects.json)
  else
    echo "    <tr><td colspan='6' style='color:#aaa;'>projects.json not found</td></tr>"
  fi

  cat <<'EOL'
  </table>
  <div id="legend-card" class="corner-mode" style="position:fixed; bottom:20px; right:20px; background:#111; color:#fff; padding:10px 14px; border-radius:8px; font-size:14px; box-shadow:0 0 10px rgba(0,0,0,0.5); opacity:0.9; max-width:240px; cursor:pointer;">
    <div id="legend-header" style="font-weight:bold; font-size:15px;">ℹ️ Status Legend ▸</div>
    <div id="legend-body" style="display:none; margin-top:8px;">
      ⬆️🟢 Improving (momentum up)<br>
      ➡️🟡 Flat / Stable<br>
      ⬇️🔴 Regressing (momentum down)<br>
      <hr style="border:0; border-top:1px solid #444; margin:6px 0;">
      <span style="font-size:12px; color:#aaa;">Row colors, arrows & emojis match this legend.</span>
      <div style="margin-top:8px;">
        <button id="reset-legend" style="background:#333; color:#fff; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:12px;">↩ Reset Position</button>
      </div>
    </div>
  </div>
  <script>
    const legendCard = document.getElementById('legend-card');
    const legendHeader = document.getElementById('legend-header');
    const legendBody = document.getElementById('legend-body');
    legendCard.addEventListener('click', () => {
      if (legendBody.style.display === 'none') { legendBody.style.display = 'block'; legendHeader.innerHTML = 'ℹ️ Status Legend ▾'; }
      else { legendBody.style.display = 'none'; legendHeader.innerHTML = 'ℹ️ Status Legend ▸'; }
    });
    let offsetX, offsetY, isDragging = false;
    const savedX = localStorage.getItem('legendPosX');
    const savedY = localStorage.getItem('legendPosY');
    if (savedX && savedY) { legendCard.style.right = 'auto'; legendCard.style.bottom = 'auto'; legendCard.style.left = savedX + 'px'; legendCard.style.top = savedY + 'px'; legendCard.style.position = 'fixed'; }
    function startDrag(e) {
      isDragging = true; const rect = legendCard.getBoundingClientRect(); const cx = (e.clientX || (e.touches && e.touches[0].clientX) || 0); const cy = (e.clientY || (e.touches && e.touches[0].clientY) || 0); offsetX = cx - rect.left; offsetY = cy - rect.top; legendCard.style.transition = 'none';
    }
    function drag(e) {
      if (!isDragging) return; e.preventDefault(); const cx = (e.clientX || (e.touches && e.touches[0].clientX) || 0); const cy = (e.clientY || (e.touches && e.touches[0].clientY) || 0); let x = cx - offsetX; let y = cy - offsetY; const vw = window.innerWidth; const vh = window.innerHeight; const rect = legendCard.getBoundingClientRect(); const maxX = vw - rect.width - 10; const maxY = vh - rect.height - 10; if (x < 10) x = 10; if (y < 10) y = 10; if (x > maxX) x = maxX; if (y > maxY) y = maxY; legendCard.style.left = x + 'px'; legendCard.style.top = y + 'px'; legendCard.style.right = 'auto'; legendCard.style.bottom = 'auto';
    }
    function endDrag() {
      if (!isDragging) return; isDragging = false; const rect = legendCard.getBoundingClientRect(); const vw = window.innerWidth; const vh = window.innerHeight; const distTop = rect.top; const distBottom = vh - rect.bottom; const distLeft = rect.left; const distRight = vw - rect.right; let snapX = rect.left; let snapY = rect.top; const edgeMode = localStorage.getItem('legendEdgeMode') === 'true'; if (edgeMode) { const edgeThreshold = 100; if (distTop < distBottom) { snapY = (distTop < edgeThreshold) ? 20 : rect.top; } else { snapY = (distBottom < edgeThreshold) ? (vh - rect.height - 20) : rect.top; } if (distLeft < distRight) { snapX = (distLeft < edgeThreshold) ? 20 : rect.left; } else { snapX = (distRight < edgeThreshold) ? (vw - rect.width - 20) : rect.left; } } else { snapY = (distTop < distBottom) ? 20 : (vh - rect.height - 20); snapX = (distLeft < distRight) ? 20 : (vw - rect.width - 20); } legendCard.style.left = snapX + 'px'; legendCard.style.top = snapY + 'px'; legendCard.style.right = 'auto'; legendCard.style.bottom = 'auto'; localStorage.setItem('legendPosX', snapX); localStorage.setItem('legendPosY', snapY);
    }
    legendCard.addEventListener('mousedown', startDrag);
    legendCard.addEventListener('touchstart', startDrag);
    document.addEventListener('mousemove', drag);
    document.addEventListener('touchmove', drag, {passive:false});
    document.addEventListener('mouseup', endDrag);
    document.addEventListener('touchend', endDrag);
    const resetBtn = document.getElementById('reset-legend');
    if (resetBtn) { resetBtn.addEventListener('click', (e) => { e.stopPropagation(); legendCard.style.left = 'auto'; legendCard.style.top = 'auto'; legendCard.style.right = '20px'; legendCard.style.bottom = '20px'; localStorage.removeItem('legendPosX'); localStorage.removeItem('legendPosY'); }); }
    const modeToggle = document.createElement('div'); modeToggle.id = 'legend-mode-toggle'; modeToggle.style.fontSize = '12px'; modeToggle.style.marginTop = '5px'; modeToggle.style.display = 'flex'; modeToggle.style.alignItems = 'center'; modeToggle.style.gap = '4px'; modeToggle.innerHTML = `
      <input type="checkbox" id="edgeMode" />
      <label for="edgeMode">
        <span id="modeIcon">🟥</span>
        <span id="modeLabel">Corner Snap Mode</span>
      </label>
    `; legendCard.appendChild(modeToggle);
    const edgeCheckbox = document.getElementById('edgeMode'); const modeIcon = document.getElementById('modeIcon'); const modeLabel = document.getElementById('modeLabel');
    const setModeUI = () => {
      if (edgeCheckbox.checked) {
        modeIcon.textContent = '🟦'; modeLabel.textContent = 'Magnetic Edge Mode'; legendCard.classList.remove('corner-mode'); legendCard.classList.add('edge-mode'); document.getElementById('dashboard-header')?.classList.remove('corner-mode'); document.getElementById('dashboard-header')?.classList.add('edge-mode'); const sidebar = document.getElementById('dashboard-sidebar'); if (sidebar) { sidebar.classList.remove('corner-mode'); sidebar.classList.add('edge-mode'); } const headerTitle = document.querySelector('#dashboard-header h1'); if (headerTitle) headerTitle.textContent = "📊 Project Status Dashboard 🟦"; let subtitle = document.getElementById('mode-subtitle'); if (!subtitle) { subtitle = document.createElement('div'); subtitle.id = 'mode-subtitle'; document.getElementById('dashboard-header').appendChild(subtitle); } const ps = localStorage.getItem('pulseSpeed') || 3; const pl = (ps <= 2 ? 'Fast' : (ps == 3 ? 'Medium' : 'Slow')); const pulseLabel = pl; const incrementMode = (window.DEPLOY_MODE && window.DEPLOY_MODE === 'fixed') ? { text: 'Fixed Increment', color: '#F44336' } : { text: 'Adaptive Increment', color: '#2196F3' }; let pulseGradient; if (pulseLabel === 'Fast') { pulseGradient = 'background:linear-gradient(90deg,#4CAF50,#81C784);-webkit-background-clip:text;color:transparent;'; } else if (pulseLabel === 'Medium') { pulseGradient = 'background:linear-gradient(90deg,#FFC107,#FFD54F);-webkit-background-clip:text;color:transparent;'; } else if (pulseLabel === 'Slow') { pulseGradient = 'background:linear-gradient(90deg,#F44336,#E57373);-webkit-background-clip:text;color:transparent;'; } else { pulseGradient = 'color:#000000;'; } subtitle.innerHTML = `🛠 Magnetic Edge Mode • 🖤 <span style="${pulseGradient}">${pulseLabel}</span> • <span style="color:${incrementMode.color}">⚙️ ${incrementMode.text}</span>`;
      } else {
        modeIcon.textContent = '🟥'; modeLabel.textContent = 'Corner Snap Mode'; legendCard.classList.remove('edge-mode'); legendCard.classList.add('corner-mode'); document.getElementById('dashboard-header')?.classList.remove('edge-mode'); document.getElementById('dashboard-header')?.classList.add('corner-mode'); const sidebar = document.getElementById('dashboard-sidebar'); if (sidebar) { sidebar.classList.remove('edge-mode'); sidebar.classList.add('corner-mode'); } const headerTitle = document.querySelector('#dashboard-header h1'); if (headerTitle) headerTitle.textContent = "📊 Project Status Dashboard 🟥"; let subtitle = document.getElementById('mode-subtitle'); if (!subtitle) { subtitle = document.createElement('div'); subtitle.id = 'mode-subtitle'; document.getElementById('dashboard-header').appendChild(subtitle); } const ps = localStorage.getItem('pulseSpeed') || 3; const pl = (ps <= 2 ? 'Fast' : (ps == 3 ? 'Medium' : 'Slow')); const pulseLabel = pl; const incrementMode = (window.DEPLOY_MODE && window.DEPLOY_MODE === 'fixed') ? { text: 'Fixed Increment', color: '#F44336' } : { text: 'Adaptive Increment', color: '#2196F3' }; let pulseGradient; if (pulseLabel === 'Fast') { pulseGradient = 'background:linear-gradient(90deg,#4CAF50,#81C784);-webkit-background-clip:text;color:transparent;'; } else if (pulseLabel === 'Medium') { pulseGradient = 'background:linear-gradient(90deg,#FFC107,#FFD54F);-webkit-background-clip:text;color:transparent;'; } else if (pulseLabel === 'Slow') { pulseGradient = 'background:linear-gradient(90deg,#F44336,#E57373);-webkit-background-clip:text;color:transparent;'; } else { pulseGradient = 'color:#000000;'; } subtitle.innerHTML = `🛠 Corner Snap Mode • 🖤 <span style=\"${pulseGradient}\">${pulseLabel}</span> • <span style=\"color:${incrementMode.color}\">⚙️ ${incrementMode.text}</span>`;
      }
    };
    edgeCheckbox.checked = localStorage.getItem('legendEdgeMode') === 'true';
    setModeUI();
    edgeCheckbox.addEventListener('change', () => { localStorage.setItem('legendEdgeMode', edgeCheckbox.checked); setModeUI(); });
    const speedControl = document.createElement('div'); speedControl.style.marginTop = '6px'; speedControl.innerHTML = `
      <label style="font-size:12px;">Heartbeat Speed: </label>
      <input type="range" id="pulseSpeed" min="1" max="5" step="1" value="3" />
      <span id="pulseSpeedLabel" style="font-size:12px;opacity:0.7;">Medium</span>
    `; legendCard.appendChild(speedControl);
    const pulseSlider = document.getElementById('pulseSpeed'); const pulseLabelEl = document.getElementById('pulseSpeedLabel');
    const setPulseSpeed = (val) => { document.documentElement.style.setProperty('--pulse-speed', val + 's'); pulseLabelEl.textContent = (val <= 2 ? 'Fast' : (val == 3 ? 'Medium' : 'Slow')); localStorage.setItem('pulseSpeed', val); };
    pulseSlider.value = localStorage.getItem('pulseSpeed') || 3; setPulseSpeed(pulseSlider.value); pulseSlider.addEventListener('input', () => setPulseSpeed(pulseSlider.value));
  </script>
  </body>
  </html>
EOL
}

usage() {
  cat <<USAGE
Usage:
  $0 log <project_id> <url> <percent>
  $0 render > dashboard.html

Notes:
  - Expects DEPLOY_LOG.md for momentum history (optional).
  - Expects projects.json with array of {id,name,percent,last,notes} (optional).
USAGE
}

cmd="${1:-}" || true
case "$cmd" in
  log)
    [[ $# -lt 4 ]] && die "log requires: <project_id> <url> <percent>"
    shift
    log_deploy "$@"
    ;;
  render)
    render_dashboard
    ;;
  *)
    usage
    ;;
esac

