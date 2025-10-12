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

function parseIntervalToMs(interval) {
  if (!interval) return 0;
  const m = interval.match(/^(\d+)([smhd])$/i);
  if (!m) return 0;
  const n = Number(m[1]);
  const u = m[2].toLowerCase();
  const map = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return n * (map[u] || 0);
}

async function main() {
  const args = parseArgs(process.argv);
  const source = args.source || 'posts';
  const platform = args.platform || 'linkedin';
  const mode = args.mode || 'auto';
  const intervalMs = parseIntervalToMs(args.interval || '48h');

  let pending = [];
  try {
    pending = JSON.parse(fs.readFileSync('pending-posts.json', 'utf8'));
  } catch (_) {}

  if (pending.length === 0) {
    console.log('No pending posts to schedule/publish.');
    return;
  }

  const now = Date.now();
  fs.mkdirSync('logs/scheduler', { recursive: true });
  const scheduleLog = [];

  pending.forEach((p, idx) => {
    const scheduledAt = new Date(now + idx * intervalMs).toISOString();
    scheduleLog.push({ file: p.file, platform, mode, scheduledAt });
  });

  fs.writeFileSync('logs/scheduler/schedule.json', JSON.stringify(scheduleLog, null, 2));
  console.log(`✅ (MOCK) Scheduled ${scheduleLog.length} post(s) for ${platform} with mode=${mode}`);
}

main().catch(err => { console.error(err); process.exit(1); });
