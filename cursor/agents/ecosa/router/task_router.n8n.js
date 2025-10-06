// Task router: chooses the BEST model per task; fails closed.
const taskType = $json.task_type || $json.task || "";
const missingSources = $json.missing_sources === true;
const lowConfidence = $json.low_confidence === true;

if (missingSources || lowConfidence) {
  return [{ json: { output: "NEED_EVIDENCE" } }];
}

const routeMap = {
  research:   ["perplexity", "gemini"],
  copy:       ["gemini", "grok"],
  code_review:["copilot", "deepseek"],
  structure:  ["deepseek", "gemini"],
  humor:      ["grok", "gemini"]
};

const route = routeMap[taskType] || ["gemini"];
return [{ json: { route, route_index: 0, fallback_policy: "next_on_fail", temperature: 0.2, max_tokens: 800 } }];
