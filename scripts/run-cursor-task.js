import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { execSync } from 'child_process';

function resolveTaskFile(taskNameOrPath) {
  const candidates = [
    taskNameOrPath,
    path.join('.cursor', 'tasks', `${taskNameOrPath}.yaml`),
    path.join('.cursor', 'tasks', `${taskNameOrPath}.yml`),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error(`Task file not found for '${taskNameOrPath}'`);
}

function runStep(step, index) {
  const name = step.name || `Step ${index + 1}`;
  const cmd = step.run;
  if (!cmd || typeof cmd !== 'string') {
    throw new Error(`Invalid run command in step '${name}'`);
  }
  console.log(`\n==> ${name}`);
  execSync(`bash -lc 'set -euo pipefail; ${cmd}'`, { stdio: 'inherit', env: process.env });
}

async function main() {
  const taskName = process.argv[2];
  if (!taskName) {
    console.error('Usage: node scripts/run-cursor-task.js <task-name-or-path>');
    process.exit(1);
  }
  const file = resolveTaskFile(taskName);
  const doc = yaml.load(fs.readFileSync(file, 'utf8'));
  if (!doc || !Array.isArray(doc.steps)) {
    throw new Error(`Invalid task file format: ${file}`);
  }
  console.log(`Running task: ${doc.name || taskName} (${file})`);
  for (let i = 0; i < doc.steps.length; i++) {
    runStep(doc.steps[i], i);
  }
  console.log('\n✔ Task completed successfully');
}

main().catch(err => {
  console.error(err.message || err);
  process.exit(1);
});
