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

function titleCase(str) {
  return str
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

async function main() {
  const args = parseArgs(process.argv);
  const mode = args.mode || 'growth';
  const count = Number(args.count || 1);
  const topics = (args.topics || 'AI, innovation')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  fs.mkdirSync('synqra-drafts', { recursive: true });

  for (let i = 0; i < count; i++) {
    const topic = topics[i % topics.length];
    const filename = `synqra-drafts/draft-${i + 1}.md`;
    const content = `---\nmode: ${mode}\ntopic: ${topic}\ncreatedAt: ${new Date().toISOString()}\n---\n\n# ${titleCase(topic)}\n\nA short draft about ${topic} with a ${mode} focus.\n`;
    fs.writeFileSync(filename, content);
  }

  console.log(`✅ Generated ${count} draft(s) in synqra-drafts/`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
