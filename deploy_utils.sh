#!/usr/bin/env bash

# Function: update_dashboard
update_dashboard() {
  if ! command -v jq >/dev/null 2>&1; then
    echo "[deploy-utils] Error: jq is required. Please install jq and rerun." >&2
    return 1
  fi
  if [ ! -f projects.json ]; then
    echo "[deploy-utils] Error: projects.json not found in $(pwd)" >&2
    return 1
  fi

  # Parse projects.json
  projects=$(jq -c '.[]' projects.json)

  cat > dashboard.html <<EOL
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Project Status Dashboard</title>
  <style>
    body { font-family: Arial, sans-serif; background: #111; color: #eee; padding: 20px; }
    h1 { color: #00ffcc; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { padding: 12px; border: 1px solid #444; text-align: center; }
    th { background: #222; }
    tr:nth-child(even) { background: #1b1b1b; }
    .high { color: #4caf50; font-weight: bold; }
    .mid { color: #ffc107; font-weight: bold; }
    .low { color: #f44336; font-weight: bold; }
    .progress-container {
      width: 120px;
      background: #333;
      border-radius: 6px;
      overflow: hidden;
      margin: auto;
    }
    .progress-bar {
      height: 14px;
      text-align: right;
      padding-right: 4px;
      color: #111;
      font-size: 11px;
      line-height: 14px;
    }
    .bar-green { background: linear-gradient(90deg, #4caf50, #2e7d32); }
    .bar-yellow { background: linear-gradient(90deg, #ffc107, #ff9800); }
    .bar-red { background: linear-gradient(90deg, #f44336, #c62828); }
  </style>
  <style>
    /* --- Responsive tweaks --- */
    @media (max-width: 700px) {
      table, thead, tbody, th, td, tr { display: block; }
      thead tr { display: none; }
      tr { margin: 0 0 1rem 0; background: #1b1b1b; border-radius: 8px; padding: 10px; }
      td { border: none; padding: 6px 10px; text-align: left; }
      td:before {
        content: attr(data-label);
        font-weight: bold;
        display: block;
        margin-bottom: 2px;
        color: #00ffcc;
      }
      .progress-container {
        width: 100%;
      }
    }
  </style>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="icon" href="data:,">
</head>
<body>
  <h1>📊 Project Status Dashboard</h1>
  <p>Last updated: $(date +"%Y-%m-%d %H:%M:%S")</p>
  <table>
    <tr><th>Project</th><th>Status %</th><th>Last Deployed</th><th>Notes</th></tr>
EOL

  # Loop through projects.json
  for row in $projects; do
    name=$(echo "$row" | jq -r '.name')
    id=$(echo "$row" | jq -r '.id')
    percent=$(echo "$row" | jq -r '.percent')
    notes=$(echo "$row" | jq -r '.notes')
    # Extract date/time before an em dash — if present
    last_deploy=$(grep -m1 "$id" DEPLOY_LOG.md 2>/dev/null | cut -d '—' -f1 | xargs)

    css_class="mid"
    if [ "$percent" -ge 80 ] 2>/dev/null; then css_class="high"; fi
    if [ "$percent" -lt 50 ] 2>/dev/null; then css_class="low"; fi

    # Assign bar color based on % thresholds
    bar_class="bar-yellow"
    if [ "$percent" -ge 80 ] 2>/dev/null; then bar_class="bar-green"; fi
    if [ "$percent" -lt 50 ] 2>/dev/null; then bar_class="bar-red"; fi

    tooltip="${name} — ${percent}% (Last deployed: ${last_deploy:-N/A})"

    echo "    <tr>" >> dashboard.html
    echo "      <td data-label=\"Project\">${name}</td>" >> dashboard.html
    echo "      <td data-label=\"Status %\"><div class=\"progress-container\"><div class=\"progress-bar ${bar_class}\" style=\"width:${percent}%;\" title=\"${tooltip}\">${percent}%</div></div></td>" >> dashboard.html
    echo "      <td data-label=\"Last Deployed\">${last_deploy}</td>" >> dashboard.html
    echo "      <td data-label=\"Notes\">${notes}</td>" >> dashboard.html
    echo "    </tr>" >> dashboard.html
  done

  cat >> dashboard.html <<EOL
  </table>
</body>
</html>
EOL

  git add dashboard.html >/dev/null 2>&1 || true
  git commit -m "chore: auto-update dashboard dynamically" >/dev/null 2>&1 || true
  git push origin main >/dev/null 2>&1 || true
  echo "[deploy-utils] 📊 Dashboard updated dynamically"
}

