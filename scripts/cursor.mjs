import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const AGENTS_BASE_DIR = path.join(ROOT_DIR, 'cursor', 'agents');
const LINKED_REGISTRY_PATH = path.join(AGENTS_BASE_DIR, 'linked.json');
const OUT_BASE_DIR = path.join(ROOT_DIR, 'out');

async function ensureDirectory(directoryPath) {
  await fs.mkdir(directoryPath, { recursive: true });
}

async function readJsonFile(filePath) {
  const content = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(content);
}

async function writeJsonFile(filePath, data) {
  await ensureDirectory(path.dirname(filePath));
  const formatted = JSON.stringify(data, null, 2);
  await fs.writeFile(filePath, formatted);
}

function parseArgs(argv) {
  const [,, ...rest] = argv;
  return rest;
}

function toAbsoluteFromRoot(p) {
  if (path.isAbsolute(p)) return p;
  return path.join(ROOT_DIR, p);
}

async function resolveDirArg(dirArg) {
  // Try absolute, CWD, ROOT, then AGENTS_BASE_DIR
  const candidates = [];
  if (dirArg) {
    if (path.isAbsolute(dirArg)) candidates.push(dirArg);
    candidates.push(path.resolve(process.cwd(), dirArg));
    candidates.push(path.join(ROOT_DIR, dirArg));
    candidates.push(path.join(AGENTS_BASE_DIR, dirArg));
  } else {
    candidates.push(process.cwd());
  }
  for (const candidate of candidates) {
    const stat = await fs.stat(candidate).catch(() => null);
    if (stat && stat.isDirectory()) return candidate;
  }
  throw new Error(`Directory not found: ${dirArg || '(cwd)'}`);
}

async function linkAgents(dirArg) {
  const agentsDir = await resolveDirArg(dirArg);
  const entries = await fs.readdir(agentsDir, { withFileTypes: true });
  const agentFiles = entries.filter(e => e.isFile() && e.name.endsWith('.json'));
  if (agentFiles.length === 0) {
    throw new Error(`No agent JSON files in: ${agentsDir}`);
  }

  const registry = { directories: [path.relative(AGENTS_BASE_DIR, agentsDir)], agents: {} };

  for (const file of agentFiles) {
    const filePath = path.join(agentsDir, file.name);
    let json;
    try {
      json = await readJsonFile(filePath);
    } catch (e) {
      // Skip invalid JSON files
      continue;
    }
    if (!json || typeof json.agent_name !== 'string' || json.agent_name.trim() === '') {
      continue;
    }
    registry.agents[json.agent_name] = {
      path: path.relative(ROOT_DIR, filePath)
    };
  }

  await ensureDirectory(AGENTS_BASE_DIR);
  await writeJsonFile(LINKED_REGISTRY_PATH, registry);
  console.log(`Linked ${Object.keys(registry.agents).length} agents from ${agentsDir}`);
}

async function createPackage(dirArg) {
  const dir = await resolveDirArg(dirArg);
  const manifestPath = path.join(dir, 'package.json');
  const exists = await fs.stat(manifestPath).catch(() => null);
  if (exists) {
    const manifest = await readJsonFile(manifestPath).catch(() => ({}));
    console.log(`Package already exists at ${manifestPath}`);
    return manifest;
  }
  // Derive a minimal manifest from directory contents
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const agentFiles = entries.filter(e => e.isFile() && e.name.endsWith('.json'));
  const agents = {};
  for (const file of agentFiles) {
    const filePath = path.join(dir, file.name);
    try {
      const json = await readJsonFile(filePath);
      if (json && typeof json.agent_name === 'string') {
        agents[json.agent_name] = file.name;
      }
    } catch {}
  }
  const pkg = {
    package_name: path.basename(dir),
    version: '1.0.0',
    author: '',
    description: '',
    entrypoints: {
      on_asset_upload: Object.keys(agents)[0] || '',
    },
    automation_mode: 'manual'
  };
  await writeJsonFile(manifestPath, pkg);
  console.log(`Package created at ${manifestPath}`);
  return pkg;
}

async function agentsStatus(targetArg) {
  const dir = await resolveDirArg(targetArg);
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const agentFiles = entries.filter(e => e.isFile() && e.name.endsWith('.json'));
  const names = [];
  for (const f of agentFiles) {
    try {
      const json = await readJsonFile(path.join(dir, f.name));
      if (json && typeof json.agent_name === 'string') names.push(json.agent_name);
    } catch {}
  }
  const registry = await loadLinkedRegistry();
  const linked = names.filter(n => Boolean(registry.agents[n]));
  const status = {
    directory: dir,
    count: names.length,
    agents: names,
    linked_count: linked.length,
    linked_agents: linked
  };
  console.log(JSON.stringify(status, null, 2));
}

async function loadLinkedRegistry() {
  const exists = await fs.stat(LINKED_REGISTRY_PATH).catch(() => null);
  if (!exists) return { directories: [], agents: {} };
  return readJsonFile(LINKED_REGISTRY_PATH);
}

async function findAgentConfig(agentName) {
  const registry = await loadLinkedRegistry();
  const record = registry.agents[agentName];
  if (record && record.path) {
    const filePath = toAbsoluteFromRoot(record.path);
    const json = await readJsonFile(filePath);
    return { filePath, config: json };
  }
  // Fallback: scan AGENTS_BASE_DIR subdirectories for a matching agent JSON
  const baseStat = await fs.stat(AGENTS_BASE_DIR).catch(() => null);
  if (!baseStat) throw new Error(`No linked agents and base directory not found: ${AGENTS_BASE_DIR}`);
  const stack = [AGENTS_BASE_DIR];
  while (stack.length) {
    const current = stack.pop();
    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const entryPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(entryPath);
      } else if (entry.isFile() && entry.name.endsWith('.json')) {
        try {
          const json = await readJsonFile(entryPath);
          if (json && json.agent_name === agentName) {
            return { filePath: entryPath, config: json };
          }
        } catch {
          // ignore parse errors
        }
      }
    }
  }
  throw new Error(`Agent not found: ${agentName}`);
}

function getStringSafe(value, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

async function saveSupabaseLike(pathDescriptor, filename, payload) {
  const safePath = getStringSafe(pathDescriptor, 'Supabase > misc');
  const normalized = safePath.replace(/\s*>\s*/g, '/');
  const targetDir = path.join(OUT_BASE_DIR, normalized);
  await ensureDirectory(targetDir);
  const outFile = path.join(targetDir, filename);
  await writeJsonFile(outFile, payload);
  return outFile;
}

async function saveFile(targetDir, filename, content) {
  const dir = path.join(OUT_BASE_DIR, targetDir);
  await ensureDirectory(dir);
  const filePath = path.join(dir, filename);
  const contentString = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
  await fs.writeFile(filePath, contentString);
  return filePath;
}

async function runActions(agentName, actions, initialContext) {
  const context = { ...initialContext };
  let lastOutputKey = null;

  for (const action of actions) {
    const { type } = action;

    if (type === 'analyze_image') {
      const motionPlan = {
        assetId: context.asset_id || 'UNKNOWN_ASSET',
        campaignTheme: context.campaign_theme || 'UNKNOWN_THEME',
        // Simple stub motion plan
        keyframes: [
          { t: 0, transform: 'scale(1)', easing: 'ease-in' },
          { t: 500, transform: 'scale(1.05) translateY(-8px)', easing: 'ease-out' },
          { t: 1000, transform: 'scale(1)', easing: 'linear' }
        ]
      };
      const outputKey = action.output || 'motion_plan_json';
      context[outputKey] = motionPlan;
      lastOutputKey = outputKey;
      continue;
    }

    if (type === 'store_file') {
      const filename = action.filename || 'output.json';
      const inputKey = action.input || lastOutputKey;
      const payload = inputKey ? context[inputKey] : context;
      const outPath = await saveSupabaseLike(action.path, filename, payload);
      context.last_stored_file = outPath;
      lastOutputKey = 'last_stored_file';
      continue;
    }

    if (type === 'notify_agent') {
      const targetAgent = action.target;
      const dataKey = action.data;
      const forwarded = dataKey && context[dataKey] ? context[dataKey] : {};
      const nestedContext = { ...context, ...forwarded };
      await triggerAgentByName(targetAgent, nestedContext);
      continue;
    }

    if (type === 'generate_captions') {
      const themeField = action.params?.theme_field || 'campaign_theme';
      const theme = context[themeField] || context.campaign_theme || 'Your theme';
      const tone = action.params?.tone || 'calm authority';
      const variants = Number(action.params?.variants || 3);
      const captions = Array.from({ length: variants }).map((_, i) => (
        `${theme} — ${tone} v${i + 1}`
      ));
      const outputKey = action.output || 'captions_json';
      context[outputKey] = captions;
      lastOutputKey = outputKey;
      continue;
    }

    if (type === 'queue_render') {
      const prompt = action.params?.visual_prompt || context.campaign_theme || 'visual';
      const style = action.params?.style || 'default style';
      const renderDescriptor = { prompt, style, createdAt: new Date().toISOString() };
      const renderPath = await saveFile('renders', 'rendered_asset.txt', JSON.stringify(renderDescriptor, null, 2));
      const outputKey = action.output || 'rendered_asset';
      context[outputKey] = renderPath;
      lastOutputKey = outputKey;
      continue;
    }

    if (type === 'apply_motion') {
      const videoDescriptor = {
        source: context[action.input] || context.rendered_asset || 'unknown_source',
        motionPlan: context[action.motion_plan] || context.motion_plan_json || null,
        createdAt: new Date().toISOString()
      };
      const videoPath = await saveFile('videos', 'animated_asset.mp4', JSON.stringify(videoDescriptor, null, 2));
      const outputKey = action.output || 'animated_asset';
      context[outputKey] = videoPath;
      lastOutputKey = outputKey;
      continue;
    }

    if (type === 'upload_storage') {
      const payload = { ...action.fields };
      for (const [key, value] of Object.entries(payload)) {
        if (typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}')) {
          const token = value.slice(2, -2);
          payload[key] = context[token];
        }
      }
      const table = action.table || 'misc';
      const filePath = await saveSupabaseLike(`Supabase > ${table}`, `${context.asset_id || 'asset'}_${Date.now()}.json`, payload);
      context.last_upload_record = filePath;
      lastOutputKey = 'last_upload_record';
      continue;
    }

    if (type === 'auto_post') {
      const payload = { ...action.payload };
      for (const [key, value] of Object.entries(payload)) {
        if (typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}')) {
          const token = value.slice(2, -2);
          payload[key] = context[token];
        }
      }
      const logEntry = {
        platforms: action.platforms || [],
        payload,
        createdAt: new Date().toISOString()
      };
      const logPath = await saveFile('posting', 'auto_post.log', JSON.stringify(logEntry, null, 2) + '\n');
      context.last_post_log = logPath;
      lastOutputKey = 'last_post_log';
      continue;
    }

    if (type === 'log_performance') {
      const logEntry = {
        workflow: action.workflow || 'unknown',
        createdAt: new Date().toISOString()
      };
      const logPath = await saveFile('analytics', 'n8n.log', JSON.stringify(logEntry, null, 2) + '\n');
      context.last_analytics_log = logPath;
      lastOutputKey = 'last_analytics_log';
      continue;
    }

    if (type === 'fetch_analytics') {
      // Stub: return deterministic top 5 performers
      const rows = Array.from({ length: 5 }).map((_, i) => ({
        id: `campaign_${i + 1}`,
        engagement_rate: 0.25 - i * 0.03,
        caption: `Sample caption ${i + 1}`,
        posted_at: new Date(Date.now() - i * 86400000).toISOString()
      }));
      const outputKey = action.output || 'top5';
      context[outputKey] = rows;
      lastOutputKey = outputKey;
      continue;
    }

    if (type === 'update_prompt_templates') {
      const sourceKey = action.params?.learn_from || 'top5';
      const top = context[sourceKey] || [];
      const templates = (Array.isArray(top) ? top : []).map((row, i) => `{{theme}} — refined v${i + 1}`);
      const outputKey = action.output || 'caption_templates';
      context[outputKey] = templates;
      lastOutputKey = outputKey;
      const filePath = await saveFile('templates', 'caption_templates.json', JSON.stringify(templates, null, 2));
      context.last_templates_file = filePath;
      continue;
    }

    if (type === 'generate_audio_prompt') {
      const prompt = `Audio cues for ${context.asset_id || 'asset'} — ${context.campaign_theme || ''}`.trim();
      const outputKey = action.output || 'audio_prompt';
      context[outputKey] = prompt;
      lastOutputKey = outputKey;
      continue;
    }

    if (type === 'synthesize_audio') {
      const descriptor = {
        prompt: context[action.input] || context.audio_prompt || 'silence',
        voice: action.params?.voice || 'default',
        style: action.params?.style || 'neutral',
        createdAt: new Date().toISOString()
      };
      const outPath = await saveFile('audio', 'audio_track.mp3', JSON.stringify(descriptor, null, 2));
      const outputKey = action.output || 'audio_track';
      context[outputKey] = outPath;
      lastOutputKey = outputKey;
      continue;
    }

    if (type === 'export_video') {
      const descriptor = {
        source: context[action.input] || context.animated_asset || 'unknown',
        format: action.params?.format || 'mp4',
        audio: Boolean(action.params?.audio),
        createdAt: new Date().toISOString()
      };
      const filename = descriptor.audio ? 'with_audio.mp4' : 'silent.mp4';
      const outPath = await saveFile('videos', filename, JSON.stringify(descriptor, null, 2));
      const outputKey = action.output || (descriptor.audio ? 'audio_mp4' : 'silent_mp4');
      context[outputKey] = outPath;
      lastOutputKey = outputKey;
      continue;
    }

    if (type === 'merge_audio') {
      const descriptor = {
        video: context[action.input?.video] || context.animated_asset || 'unknown_video',
        audio: context[action.input?.audio] || context.audio_track || 'unknown_audio',
        createdAt: new Date().toISOString()
      };
      const outPath = await saveFile('videos', 'merged_audio.mp4', JSON.stringify(descriptor, null, 2));
      const outputKey = action.output || 'audio_mp4';
      context[outputKey] = outPath;
      lastOutputKey = outputKey;
      continue;
    }

    console.warn(`Unknown action type: ${type}`);
  }

  return context;
}

async function triggerAgentByName(agentName, initialContext = {}) {
  const { config } = await findAgentConfig(agentName);
  const resultContext = await runActions(agentName, config.actions || [], initialContext);
  return resultContext;
}

async function scheduleAgent(agentName, cronExpr) {
  const schedulesDir = path.join(OUT_BASE_DIR, 'schedules');
  await ensureDirectory(schedulesDir);
  const file = path.join(schedulesDir, `${agentName}.json`);
  const data = { agent: agentName, cron: cronExpr, createdAt: new Date().toISOString() };
  await writeJsonFile(file, data);
  console.log(`Scheduled ${agentName} at '${cronExpr}' -> ${file}`);
}

async function handleTrigger(args) {
  const [agentName, ...rest] = args;
  if (!agentName) {
    throw new Error('Missing agent name. Usage: trigger <AGENT_NAME> [--data JSON]');
  }
  let data = {};
  let schedule = null;
  for (let i = 0; i < rest.length; i += 1) {
    const token = rest[i];
    if (token === '--data') {
      const jsonString = rest[i + 1];
      if (!jsonString) throw new Error('Expected JSON after --data');
      data = JSON.parse(jsonString);
      i += 1;
    } else if (token === '--schedule') {
      schedule = rest[i + 1];
      if (!schedule) throw new Error('Expected CRON after --schedule');
      i += 1;
    }
  }
  if (schedule) {
    await scheduleAgent(agentName, schedule);
  }
  const context = await triggerAgentByName(agentName, data);
  console.log(JSON.stringify({ ok: true, agent: agentName, context }, null, 2));
}

async function main() {
  const args = parseArgs(process.argv);
  const [command, subcommand, ...rest] = args;

  if (!command) {
    console.log('Usage:\n  package --create [DIR]\n  agents link <DIR>\n  agents status [DIR]\n  trigger <AGENT_NAME> [--data JSON] [--schedule CRON]');
    process.exit(1);
  }

  if (command === 'package' && subcommand === '--create') {
    const dirArg = rest[0];
    await createPackage(dirArg);
    return;
  }

  if (command === 'agents' && subcommand === 'link') {
    const dirArg = rest[0];
    if (!dirArg) throw new Error('Usage: agents link <DIR>');
    await linkAgents(dirArg);
    return;
  }

  if (command === 'agents' && subcommand === 'status') {
    const dirArg = rest[0];
    await agentsStatus(dirArg);
    return;
  }

  if (command === 'trigger') {
    await handleTrigger([subcommand, ...rest]);
    return;
  }

  throw new Error(`Unknown command: ${command} ${subcommand || ''}`.trim());
}

main().catch(err => {
  console.error(err.message || err);
  process.exit(1);
});
