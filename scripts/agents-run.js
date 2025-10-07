#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

function readJson(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(content);
}

function findAgentSpec(agentName) {
  const agentsDirCandidates = [
    path.join(process.cwd(), 'cursor', 'agents'),
    path.join(process.cwd(), 'agents'),
    path.join(process.cwd(), 'synqra', 'agents'),
  ];
  for (const dir of agentsDirCandidates) {
    if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        if (file.replace(/\.json$/i, '') === agentName) {
          return path.join(dir, file);
        }
      }
    }
  }
  return null;
}

function formatLogDir(agentName) {
  const logsBase = path.join(process.cwd(), 'cursor', 'logs');
  const councilDir = path.join(logsBase, 'Council_Reports');
  return { logsBase, councilDir };
}

function ensureDirs(...dirs) {
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

function run() {
  const agentName = process.argv.slice(2).join(' ');
  if (!agentName) {
    console.error('Usage: npm run agents:run -- <AgentName>');
    process.exit(1);
  }

  const specPath = findAgentSpec(agentName);
  if (!specPath) {
    console.error(`Agent not found: ${agentName}`);
    process.exit(2);
  }

  const spec = readJson(specPath);
  const { logsBase, councilDir } = formatLogDir(agentName);
  ensureDirs(logsBase, councilDir);

  const startedAt = new Date().toISOString();
  const result = {
    agent: agentName,
    specPath,
    startedAt,
    steps: [],
    status: 'running',
  };

  // Very simple action emulation
  if (spec.type === 'Synqra_ContentPillars_Deploy') {
    const dataPath = path.join(process.cwd(), 'synqra', 'data', 'contentPillars.json');
    if (!fs.existsSync(dataPath)) {
      result.steps.push({ type: 'error', message: `Missing data file: ${dataPath}` });
      result.status = 'failed';
    } else {
      const pillars = readJson(dataPath);
      result.steps.push({ type: 'read', path: dataPath, count: Array.isArray(pillars) ? pillars.length : Object.keys(pillars).length });
      result.status = 'completed';
    }
  } else {
    result.steps.push({ type: 'noop', message: 'No-op for this agent type in local runner.' });
    result.status = 'completed';
  }

  const finishedAt = new Date().toISOString();
  result.finishedAt = finishedAt;

  const logFile = path.join(councilDir, `${agentName.replace(/\W+/g, '_')}_${Date.now()}.json`);
  fs.writeFileSync(logFile, JSON.stringify(result, null, 2));

  console.log(`Agent executed: ${agentName}`);
  console.log(`Spec: ${specPath}`);
  console.log(`Log: ${logFile}`);
  if (result.status !== 'completed') {
    process.exitCode = 3;
  }
}

run();

