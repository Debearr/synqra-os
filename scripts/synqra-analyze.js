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

function loadAnalytics() {
  try {
    const raw = fs.readFileSync('synqra-analytics.json', 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    console.error('synqra-analytics.json not found. Run fetchLinkedInData first.');
    process.exit(1);
  }
}

function analyze(analytics, metricsList) {
  const result = { total: {}, notes: [] };
  for (const metric of metricsList) {
    // naive aggregation: count occurrences if present anywhere in JSON
    const text = JSON.stringify(analytics).toLowerCase();
    const count = (text.match(new RegExp(metric.toLowerCase(), 'g')) || []).length;
    result.total[metric] = count;
  }
  result.notes.push('Heuristic counts computed over raw JSON.');
  return result;
}

async function main() {
  const args = parseArgs(process.argv);
  const source = args.source || 'linkedin';
  const metrics = (args.metrics || 'impressions,comments,shares,likes')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  const analytics = loadAnalytics();
  const insights = analyze(analytics, metrics);

  const output = {
    source,
    analyzedAt: new Date().toISOString(),
    metricsAnalyzed: metrics,
    insights,
  };

  fs.writeFileSync('synqra-output.json', JSON.stringify(output, null, 2));
  console.log('✅ Wrote synqra-output.json');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
