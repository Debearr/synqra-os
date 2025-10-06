// Conflict resolution for multi-model outputs
// Input expected:
// - Either $json.model_outputs: [ { model, answer, evidence?, citations?, has_evidence?, timestamp? } , ... ]
// - Or $json.model_A and $json.model_B with same shape
// Behavior:
// - If answers differ, prefer evidence-backed; tie-break by most recent timestamp
// - If still uncertain or missing signals, return NEED_EVIDENCE
// - Harmonize final text for continuity (whitespace/punctuation normalization)

function normalizeText(text) {
  const value = String(text || "").trim().replace(/\s+/g, " ");
  if (!value) return "";
  return /[.!?]$/.test(value) ? value : value + ".";
}

function hasEvidence(entry) {
  if (!entry) return false;
  if (entry.has_evidence === true) return true;
  if (Array.isArray(entry.evidence) && entry.evidence.length > 0) return true;
  if (Array.isArray(entry.citations) && entry.citations.length > 0) return true;
  if (typeof entry.answer === "string" && /https?:\/\//i.test(entry.answer)) return true;
  return false;
}

function parseTimestamp(ts) {
  if (typeof ts === "number" && Number.isFinite(ts)) return ts;
  if (typeof ts === "string") {
    const parsed = Date.parse(ts);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return null;
}

const outputs = [];
if (Array.isArray($json.model_outputs)) {
  for (const e of $json.model_outputs) {
    if (e && e.answer) outputs.push(e);
  }
} else {
  if ($json.model_A && $json.model_A.answer) outputs.push($json.model_A);
  if ($json.model_B && $json.model_B.answer) outputs.push($json.model_B);
}

if (outputs.length < 2) {
  return [{ json: { output: "NEED_EVIDENCE", reason: "insufficient_candidates" } }];
}

const a = outputs[0];
const b = outputs[1];
const aAns = normalizeText(a.answer);
const bAns = normalizeText(b.answer);

// If already consistent, pick any and harmonize
if (aAns === bAns) {
  return [{ json: { status: "RESOLVED", winner_model: a.model || "model_A", answer: aAns, conflict: false } }];
}

const aEv = hasEvidence(a);
const bEv = hasEvidence(b);

let winner = null;
let reason = "";

if (aEv && !bEv) {
  winner = a; reason = "evidence_backed";
} else if (bEv && !aEv) {
  winner = b; reason = "evidence_backed";
} else {
  const aTs = parseTimestamp(a.factual_timestamp || a.timestamp);
  const bTs = parseTimestamp(b.factual_timestamp || b.timestamp);
  if (aTs !== null && bTs !== null) {
    winner = aTs >= bTs ? a : b;
    reason = "more_recent_timestamp";
  } else if (aTs !== null || bTs !== null) {
    winner = aTs !== null ? a : b;
    reason = "has_timestamp";
  }
}

if (!winner) {
  return [{ json: { output: "NEED_EVIDENCE", reason: "no_strong_signal" } }];
}

const harmonized = normalizeText(winner.answer);
return [{
  json: {
    status: "RESOLVED",
    winner_model: winner.model || "unknown",
    answer: harmonized,
    conflict: true,
    strategy: {
      reason,
      evidence_considered: { a: aEv, b: bEv },
      timestamps: {
        a: a.factual_timestamp || a.timestamp || null,
        b: b.factual_timestamp || b.timestamp || null
      }
    }
  }
}];
