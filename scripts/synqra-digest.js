import 'dotenv/config';
import fs from 'fs';

function parseArgs(argv) {
  const opts = {};
  for (const arg of argv.slice(2)) {
    if (arg.startsWith('--')) {
      const [key, ...rest] = arg.replace(/^--/, '').split('=');
      const value = rest.join('=');
      opts[key] = value ?? true;
    }
  }
  return opts;
}

async function main() {
  const args = parseArgs(process.argv);
  const email = args.email || args.e;

  let summary = 'No summary available';
  try {
    const raw = JSON.parse(fs.readFileSync('synqra-output.json', 'utf8'));
    summary = `Source: ${raw.source}\nMetrics: ${raw.metricsAnalyzed.join(', ')}\nAnalyzed: ${raw.analyzedAt}`;
  } catch (_) {}

  fs.mkdirSync('reports/digests', { recursive: true });
  const outfile = `reports/digests/digest-${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;
  fs.writeFileSync(outfile, summary + (email ? `\nEmail: ${email}` : ''));

  if (email) {
    console.log(`📧 (MOCK) Sent summary email to ${email}`);
  }
  console.log(`✅ Wrote digest to ${outfile}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
