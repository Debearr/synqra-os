#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

function ensureDir(path) {
  mkdirSync(path, { recursive: true });
}

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    if (process.stdin.isTTY) return resolve('');
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => (data += chunk));
    process.stdin.on('end', () => resolve(data));
  });
}

async function main() {
  const args = process.argv.slice(2);
  const cmd = args[0];

  if (cmd === 'queue' && args[1] === 'create') {
    const name = args[2];
    if (!name) {
      console.error('Usage: ecosa queue create <name>');
      process.exit(1);
    }
    const input = await readStdin();

    // Use hidden workspace directory to avoid collisions with files named 'ecosa'
    const baseDir = join(process.cwd(), '.ecosa');
    const queuesDir = join(baseDir, 'queues');
    ensureDir(queuesDir);
    const filePath = join(queuesDir, `${name}.yaml`);
    writeFileSync(filePath, input || '');

    const stateDir = join(baseDir, 'state');
    ensureDir(stateDir);
    const stateFile = join(stateDir, 'queues.json');
    let state = { queues: [] };
    if (existsSync(stateFile)) {
      try {
        state = JSON.parse(readFileSync(stateFile, 'utf8') || '{"queues":[]}');
      } catch {}
    }
    const meta = { name, createdAt: new Date().toISOString(), path: filePath };
    const idx = state.queues.findIndex((q) => q.name === name);
    if (idx >= 0) state.queues[idx] = meta; else state.queues.push(meta);
    writeFileSync(stateFile, JSON.stringify(state, null, 2));

    console.log(`Queue '${name}' created at ${filePath}`);
    process.exit(0);
  }

  if (cmd === 'job' && args[1] === 'create') {
    const queueName = args[2];
    if (!queueName) {
      console.error('Usage: ecosa job create <queue> --name <jobName>');
      process.exit(1);
    }
    let jobName = null;
    for (let i = 3; i < args.length; i++) {
      if (args[i] === '--name' || args[i] === '-n') {
        jobName = args[i + 1];
        i++;
      }
    }
    if (!jobName) jobName = `job_${Date.now()}`;

    const input = await readStdin();

    const baseDir = join(process.cwd(), '.ecosa');
    const jobsDir = join(baseDir, 'jobs', queueName);
    ensureDir(jobsDir);
    const filePath = join(jobsDir, `${jobName}.yaml`);
    writeFileSync(filePath, input || '');

    const stateDir = join(baseDir, 'state');
    ensureDir(stateDir);
    const stateFile = join(stateDir, 'jobs.json');
    let state = { jobs: [] };
    if (existsSync(stateFile)) {
      try {
        state = JSON.parse(readFileSync(stateFile, 'utf8') || '{"jobs":[]}');
      } catch {}
    }
    const meta = { name: jobName, queue: queueName, createdAt: new Date().toISOString(), path: filePath };
    state.jobs.push(meta);
    writeFileSync(stateFile, JSON.stringify(state, null, 2));

    console.log(`Job '${jobName}' for queue '${queueName}' created at ${filePath}`);
    process.exit(0);
  }

  console.error('Unknown command. Supported: queue create, job create');
  process.exit(1);
}

main().catch((err) => {
  console.error(err?.stack || String(err));
  process.exit(1);
});
