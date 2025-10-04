#!/usr/bin/env bash

echo "Choose rollback type: 1) Safe (remove file only)  2) Hard (erase last commit)"
read -r choice

if [ "$choice" == "1" ]; then
  git rm playbooks/grokLaunchPlaybook.md && \
  git commit -m "revert: remove Grok virality playbook (Chaos Tax campaign)" && \
  git push origin main && \
  echo "✅ SAFE rollback complete (file removed, history preserved)"
elif [ "$choice" == "2" ]; then
  git reset --hard HEAD~1 && \
  git push origin main --force && \
  echo "⚠️ HARD reset complete (commit erased from history)"
else
  echo "❌ Invalid choice, exiting."
fi
