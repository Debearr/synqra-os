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
  } else if (
    agentName === 'Leonardo_dashboardRender' ||
    spec.type === 'Leonardo_Dashboard_Render'
  ) {
    const render = spec.render_instructions || {};
    const blueprint = spec.diagram_blueprint || {};
    const palette = blueprint.color_palette || {};
    const exportToRaw = render.export_to || '/cursor/exports/visuals/animated_bridge/';
    const exportDir = exportToRaw.startsWith('/')
      ? path.join(process.cwd(), exportToRaw.slice(1))
      : path.join(process.cwd(), exportToRaw);
    ensureDirs(exportDir);

    const animatedSvg = `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675">\n` +
      `<rect width="100%" height="100%" fill="${palette.background || '#111111'}"/>\n` +
      `<text x="50%" y="12%" fill="${palette.primary || '#D4AF37'}" font-size="36" text-anchor="middle" font-family="Inter, Arial, sans-serif">${blueprint.title || 'Neural Bridge: Live Dashboard'}</text>\n` +
      `<defs>\n` +
      `  <linearGradient id="pulse" x1="0%" y1="0%" x2="100%" y2="0%">\n` +
      `    <stop offset="0%" stop-color="${palette.accent || '#00B2A9'}">\n` +
      `      <animate attributeName="stop-color" values="${palette.accent || '#00B2A9'};${palette.primary || '#D4AF37'};${palette.accent || '#00B2A9'}" dur="3s" repeatCount="indefinite"/>\n` +
      `    </stop>\n` +
      `    <stop offset="100%" stop-color="${palette.primary || '#D4AF37'}"/>\n` +
      `  </linearGradient>\n` +
      `</defs>\n` +
      `<g>\n` +
      `  <circle cx="150" cy="340" r="60" fill="${palette.secondary || '#0A0A0A'}" stroke="${palette.primary || '#D4AF37'}" stroke-width="3"/>\n` +
      `  <text x="150" y="345" fill="${palette.primary || '#D4AF37'}" font-size="14" text-anchor="middle">SYNQRA</text>\n` +
      `  <circle cx="600" cy="340" r="60" fill="${palette.secondary || '#0A0A0A'}" stroke="${palette.primary || '#D4AF37'}" stroke-width="3"/>\n` +
      `  <text x="600" y="345" fill="${palette.primary || '#D4AF37'}" font-size="14" text-anchor="middle">Bridge</text>\n` +
      `  <circle cx="1050" cy="340" r="60" fill="${palette.secondary || '#0A0A0A'}" stroke="${palette.primary || '#D4AF37'}" stroke-width="3"/>\n` +
      `  <text x="1050" y="345" fill="${palette.primary || '#D4AF37'}" font-size="14" text-anchor="middle">AuraFX</text>\n` +
      `  <rect x="210" y="333" width="340" height="14" fill="url(#pulse)">\n` +
      `    <animate attributeName="x" values="210;220;210" dur="2s" repeatCount="indefinite"/>\n` +
      `  </rect>\n` +
      `  <rect x="650" y="333" width="340" height="14" fill="url(#pulse)">\n` +
      `    <animate attributeName="x" values="650;660;650" dur="2s" repeatCount="indefinite"/>\n` +
      `  </rect>\n` +
      `</g>\n` +
      `</svg>\n`;

    const outName = 'Animated_Neural_Bridge.svg';
    const outPath = path.join(exportDir, outName);
    fs.writeFileSync(outPath, animatedSvg);

    result.steps.push({ type: 'export', dir: exportDir, files: [path.relative(process.cwd(), outPath)] });
    result.status = 'completed';
  } else if (
    agentName === 'Leonardo_visuals' ||
    (spec.agent_name && /Leonardo/i.test(spec.agent_name)) ||
    spec.diagram_blueprint
  ) {
    const blueprint = spec.diagram_blueprint || {};
    const visuals = (blueprint.visual_assets && {
      diagrams: blueprint.visual_assets.diagrams || [],
      slides: blueprint.visual_assets.slides || [],
      export: blueprint.visual_assets.export || undefined,
    }) || { diagrams: [], slides: [] };

    const render = spec.render_instructions || {};
    const exportToRaw = render.export_to || (visuals.export && visuals.export.outputDir) || '/cursor/exports/visuals/neural_bridge/';
    const exportDir = exportToRaw.startsWith('/')
      ? path.join(process.cwd(), exportToRaw.slice(1))
      : path.join(process.cwd(), exportToRaw);
    ensureDirs(exportDir);

    const filesWritten = [];
    const palette = (blueprint.color_palette) || {};
    const svgHeader = (title) => (
      `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675">\n` +
      `<rect width="100%" height="100%" fill="${palette.background || '#111111'}"/>\n` +
      `<text x="50%" y="20%" fill="${palette.primary || '#D4AF37'}" font-size="36" text-anchor="middle" font-family="Inter, Arial, sans-serif">${title || 'Neural Bridge'}</text>\n`
    );
    const svgFooter = `</svg>\n`;

    function writeFileSafe(fileName, content) {
      const outPath = path.join(exportDir, fileName);
      ensureDirs(path.dirname(outPath));
      fs.writeFileSync(outPath, content);
      filesWritten.push(outPath);
    }

    // Write diagram placeholders
    for (const name of visuals.diagrams || []) {
      if (/\.svg$/i.test(name)) {
        const content = svgHeader(blueprint.title) +
          `<g>
            <line x1="150" y1="340" x2="550" y2="340" stroke="${palette.accent || '#00B2A9'}" stroke-width="6"/>
            <line x1="650" y1="340" x2="1050" y2="340" stroke="${palette.accent || '#00B2A9'}" stroke-width="6"/>
            <circle cx="150" cy="340" r="60" fill="${palette.secondary || '#0A0A0A'}" stroke="${palette.primary || '#D4AF37'}" stroke-width="3"/>
            <circle cx="600" cy="340" r="60" fill="${palette.secondary || '#0A0A0A'}" stroke="${palette.primary || '#D4AF37'}" stroke-width="3"/>
            <circle cx="1050" cy="340" r="60" fill="${palette.secondary || '#0A0A0A'}" stroke="${palette.primary || '#D4AF37'}" stroke-width="3"/>
            <text x="150" y="345" fill="${palette.primary || '#D4AF37'}" font-size="14" text-anchor="middle">SYNQRA</text>
            <text x="600" y="345" fill="${palette.primary || '#D4AF37'}" font-size="14" text-anchor="middle">Bridge</text>
            <text x="1050" y="345" fill="${palette.primary || '#D4AF37'}" font-size="14" text-anchor="middle">AuraFX</text>
          </g>\n` + svgFooter;
        writeFileSafe(name, content);
      } else {
        // Non-SVG placeholders (png, etc.)
        writeFileSafe(name, `Placeholder for ${name} generated at ${new Date().toISOString()}\n`);
      }
    }

    // Write slides placeholders
    for (const name of visuals.slides || []) {
      writeFileSafe(name, `Placeholder for ${name} generated at ${new Date().toISOString()}\n`);
    }

    result.steps.push({ type: 'export', dir: exportDir, files: filesWritten.map(p => path.relative(process.cwd(), p)) });
    result.status = 'completed';
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

