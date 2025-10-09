/**
 * Symphony Orchestrator
 * Watches for required files -> triggers next agent command -> logs results -> (optionally) opens PRs.
 * NOTE: Commands here are placeholders to integrate with your model runners (Perplexity/Claude/DeepSeek/Gemini/Copilot).
 */
const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');

const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));
const logPath = path.resolve(cfg.logging.audit_log);

function log(event, data = {}) {
  const entry = { ts: new Date().toISOString(), event, ...data };
  fs.appendFileSync(logPath, JSON.stringify(entry) + '\n');
  if (cfg.logging.level === 'info') console.log(event, data);
}

function fileExists(p) { try { return fs.existsSync(path.resolve(p)); } catch { return false; } }

function runCmd(cmd, env = {}) {
  return new Promise((resolve, reject) => {
    log('run_cmd_start', { cmd });
    exec(cmd, { env: { ...process.env, ...env } }, (err, stdout, stderr) => {
      log('run_cmd_end', { cmd, stdout, stderr, ok: !err });
      if (err) return reject(err);
      resolve({ stdout, stderr });
    });
  });
}

async function stepReady(step) {
  return step.requires.every(fileExists);
}

async function produce(step) {
  // Guard: if output already exists, skip (idempotent)
  if (fileExists(step.produces)) {
    log('skip_step_already_produced', { step: step.name, produces: step.produces });
    return;
  }
  await runCmd(step.command.replace('${produces}', step.produces));
  // Re-check output
  if (!fileExists(step.produces)) {
    throw new Error(`Expected output not found: ${step.produces}`);
  }
  // GitOps (optional)
  if (cfg.gitops.enable_prs) {
    const branch = `${cfg.gitops.branch_prefix}${Date.now()}`;
    const title = `Council: ${step.name}`;
    await runCmd(`bash scripts/gitops_commit.sh "${branch}" "${step.produces}" "${cfg.gitops.commit_message_template.replace('${step}', step.name)}"`);
    await runCmd(cfg.gitops.open_pr_command.replace('${branch}', branch).replace('${title}', title));
  }
}

async function main() {
  log('orchestrator_start', { system_id: cfg.system_id });
  // simple polling loop (safe and deterministic in Cursor)
  const POLL_MS = 2000;
  const completed = new Set();

  const loop = setInterval(async () => {
    for (const step of cfg.sequence) {
      if (completed.has(step.name)) continue;
      const ready = await stepReady(step);
      if (ready) {
        log('step_ready', { step: step.name });
        try {
          await produce(step);
          log('step_complete', { step: step.name });
          completed.add(step.name);
        } catch (e) {
          log('step_error', { step: step.name, error: String(e) });
        }
      } else {
        log('step_waiting', { step: step.name, missing: step.requires.filter(r => !fileExists(r)) });
      }
    }
    // stop when all done
    if (completed.size === cfg.sequence.length) {
      log('orchestrator_done');
      clearInterval(loop);
    }
  }, POLL_MS);
}

main().catch(e => log('orchestrator_crash', { error: String(e) }));
