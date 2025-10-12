#!/usr/bin/env node
import { OpenAI } from 'openai';
import { Anthropic } from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

function getEnv(name, required = true) {
  const value = process.env[name];
  if (!value && required) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value || '';
}

const openai = new OpenAI({ apiKey: getEnv('OPENAI_API_KEY') });
const anthropic = new Anthropic({ apiKey: getEnv('ANTHROPIC_API_KEY') });
const supabaseUrl = getEnv('SUPABASE_URL');
const supabaseKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');
const supabase = createClient(supabaseUrl, supabaseKey);

function buildPromptForRole(role, task, context) {
  const base = `You are the ${role} in the Synqra AI Council. Follow the council lifecycle: Discover → Define → Develop → Validate → Deliver → Certify → CLOSER. Output must be concise, actionable, and production-ready.`;
  const guidelines = {
    copywriter: 'Focus on clear messaging, headlines, and CTA variants. Keep to brand voice.',
    validator: 'Evaluate correctness, compliance, and alignment. Return a JSON verdict with scores.',
    developer: 'Propose minimal viable code edits and testing/checklist. Prefer diff-like suggestions.'
  };
  const roleGuide = guidelines[role] || 'Contribute substantively to improve the deliverable.';
  return `${base}\nRole Guidance: ${roleGuide}\nTask: ${task}\nContext: ${JSON.stringify(context || {}, null, 2)}`;
}

async function callAnthropic(prompt) {
  const msg = await anthropic.messages.create({
    model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20240620',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }]
  });
  // Anthropics SDK returns {content:[{type:'text',text:...}]}
  const content = Array.isArray(msg.content) && msg.content[0] && msg.content[0].text ? msg.content[0].text : JSON.stringify(msg);
  return { provider: 'anthropic', content };
}

async function callOpenAI(prompt) {
  const resp = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.2,
    max_tokens: 1024
  });
  const choice = resp.choices && resp.choices[0];
  const content = choice && choice.message && choice.message.content ? choice.message.content : JSON.stringify(resp);
  return { provider: 'openai', content };
}

function evaluateOutput(claude, gpt, metrics) {
  const defaultMetrics = {
    quality: 0.5, // clarity, structure
    relevance: 0.3, // alignment to task/context
    risk: 0.2 // lower is better
  };
  const m = { ...defaultMetrics, ...(metrics || {}) };
  function scoreOne(text) {
    const lengthScore = Math.min(1, (text || '').length / 400);
    const hasJson = /\{[\s\S]*\}/.test(text) ? 1 : 0.3;
    const riskPenalty = /hallucination|uncertain|maybe/i.test(text) ? 0.2 : 1;
    return m.quality * lengthScore + m.relevance * hasJson + m.risk * riskPenalty;
  }
  const sClaude = scoreOne(claude.content || '');
  const sGpt = scoreOne(gpt.content || '');
  return sClaude >= sGpt ? { winner: 'anthropic', score: sClaude } : { winner: 'openai', score: sGpt };
}

function selectFinalOutput(claude, gpt, evalResult) {
  if (evalResult.winner === 'anthropic') return claude.content;
  return gpt.content;
}

async function auditToSupabase(payload) {
  try {
    const { error } = await supabase.from('ai_council_audit').insert(payload);
    if (error) throw error;
  } catch (err) {
    console.error('Supabase audit insert failed:', err.message || err);
  }
}

export async function closerAgent(task, context = {}) {
  const role = context.role || 'developer';
  const prompt = buildPromptForRole(role, task, context);
  const [claude, gpt] = await Promise.all([
    callAnthropic(prompt),
    callOpenAI(prompt)
  ]);
  const evalResult = evaluateOutput(claude, gpt, context.metrics);
  const final_output = selectFinalOutput(claude, gpt, evalResult);
  const metadata = {
    role,
    eval: evalResult,
    providers: {
      anthropic_model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20240620',
      openai_model: process.env.OPENAI_MODEL || 'gpt-4o-mini'
    }
  };
  await auditToSupabase({
    created_at: new Date().toISOString(),
    task,
    role,
    claude_output: claude.content,
    gpt_output: gpt.content,
    final_output,
    metadata
  });
  return { final_output, metadata, model_used: metadata.providers };
}

async function main() {
  const task = process.env.CLOSER_TASK || 'Improve homepage hero copy and CTA.';
  const role = process.env.CLOSER_ROLE || 'copywriter';
  const contextEnv = process.env.CLOSER_CONTEXT_JSON || '{}';
  let parsedContext = {};
  try {
    parsedContext = JSON.parse(contextEnv);
  } catch (_) {}
  const result = await closerAgent(task, { role, ...parsedContext });
  console.log(JSON.stringify(result, null, 2));
}

if (import.meta && import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
