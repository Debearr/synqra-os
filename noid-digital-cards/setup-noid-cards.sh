#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

echo "➡️  NØID Digital Cards :: automated setup"

if ! command -v npm >/dev/null 2>&1; then
  echo "❌ npm is required but not available on PATH." >&2
  exit 1
fi

printf '\n▶︎ Installing dependencies\n'
npm install

printf '\n▶︎ Linting\n'
npm run lint

printf '\n▶︎ Type checking\n'
npm run type-check

printf '\n▶︎ Building production bundle\n'
npm run build

printf '\n▶︎ Verifying card dataset\n'
node <<'NODE'
const handles = ["debear", "andre", "swapnil", "josh", "mustafa"];
const missing = handles.filter((handle) => {
  try {
    // eslint-disable-next-line import/no-dynamic-require, global-require
    require(`./src/content/cards/${handle}.json`);
    return false;
  } catch (error) {
    console.error(`Missing profile for /card/${handle}`);
    return true;
  }
});

if (missing.length) {
  process.exitCode = 1;
} else {
  console.log(`All handles present: ${handles.join(", ")}`);
}
NODE

printf "\n✅ Setup complete. Run 'npm run dev' for local preview or 'vercel --prod' to deploy.\n"
