import "server-only";

import { AuraFxSignalPayload, PriceRange } from "@/lib/aura-fx/types";

export type PennyToneMode =
  | "founder_private"
  | "subscriber_premium"
  | "client_professional";

export type PennyMessageKind =
  | "actionable_signal"
  | "no_trade"
  | "missed_trade"
  | "signal_update";

export type PennySignalUpdateStatus =
  | "open"
  | "tp1"
  | "tp2"
  | "tp3"
  | "closed"
  | "stopped"
  | "invalidated";

type PennyMessageSection = {
  value: string;
};

export type PennyFormattedMessage = {
  kind: PennyMessageKind;
  toneMode: PennyToneMode;
  title: string;
  sections: PennyMessageSection[];
  watermark: string;
  disclaimer: string;
  text: string;
};

const PENNY_WATERMARK = "PENNY / AURAFX";
const PENNY_ADVISORY_LINE = "Advisory only. Not financial advice.";

export function buildPennyActionableSignalCard(input: {
  signal: AuraFxSignalPayload;
  toneMode: PennyToneMode;
}): PennyFormattedMessage {
  const directionLabel = formatDirection(input.signal.direction);
  const sections: PennyMessageSection[] = [
    { value: `${input.signal.symbol} | ${String(input.signal.timeframe).toUpperCase()}` },
    { value: resolveActionTitle(input.toneMode, directionLabel) },
    { value: `Confidence: ${formatConfidence(input.signal.confidence)}` },
    { value: `Entry: ${formatZone(input.signal.entryZone)}` },
    { value: `Stop: ${formatZone(input.signal.stopZone)}` },
    { value: `Targets: ${formatTargets(input.signal.targetZone)}` },
    { value: `Why: ${input.signal.rationaleShort}` },
    { value: `Status: ${resolveActionStatusLine(input.toneMode)}` },
  ];

  const killzoneLine = formatKillzone(input.signal.killzone);
  if (killzoneLine) {
    sections.splice(6, 0, { value: killzoneLine });
  }

  return buildMessage({
    kind: "actionable_signal",
    toneMode: input.toneMode,
    title: resolveActionTitle(input.toneMode, directionLabel),
    sections,
  });
}

export function buildPennyNoTradeCard(input: {
  symbol: string;
  timeframe: string;
  toneMode: PennyToneMode;
  reason: string;
  confidence?: number | null;
  killzone?: string | null;
}): PennyFormattedMessage {
  const sections: PennyMessageSection[] = [
    { value: `${input.symbol} | ${input.timeframe.toUpperCase()}` },
    { value: resolveNoTradeTitle(input.toneMode) },
  ];

  if (typeof input.confidence === "number") {
    sections.push({ value: `Confidence: ${formatConfidence(input.confidence)}` });
  }

  const killzoneLine = formatKillzone(input.killzone ?? null);
  if (killzoneLine) {
    sections.push({ value: killzoneLine });
  }

  sections.push(
    { value: `Why: ${input.reason}` },
    { value: `Status: ${resolveNoTradeStatusLine(input.toneMode)}` }
  );

  return buildMessage({
    kind: "no_trade",
    toneMode: input.toneMode,
    title: resolveNoTradeTitle(input.toneMode),
    sections,
  });
}

export function buildPennyMissedTradeCard(input: {
  symbol: string;
  timeframe: string;
  toneMode: PennyToneMode;
  reason: string;
  direction?: string | null;
  entry?: PriceRange | string | null;
  target?: PriceRange | string | null;
}): PennyFormattedMessage {
  const sections: PennyMessageSection[] = [
    { value: `${input.symbol} | ${input.timeframe.toUpperCase()}` },
    { value: resolveMissedTradeTitle(input.toneMode) },
  ];

  const directionLabel = formatDirection(input.direction ?? null);
  if (directionLabel !== "Flat") {
    sections.push({ value: `Bias: ${directionLabel}` });
  }

  if (input.entry) {
    sections.push({ value: `Reference entry: ${formatZone(input.entry)}` });
  }

  if (input.target) {
    sections.push({ value: `Reference target: ${formatZone(input.target)}` });
  }

  sections.push(
    { value: `Why: ${input.reason}` },
    { value: `Status: ${resolveMissedTradeStatusLine(input.toneMode)}` }
  );

  return buildMessage({
    kind: "missed_trade",
    toneMode: input.toneMode,
    title: resolveMissedTradeTitle(input.toneMode),
    sections,
  });
}

export function buildPennySignalUpdateCard(input: {
  symbol: string;
  timeframe: string;
  toneMode: PennyToneMode;
  status: PennySignalUpdateStatus;
  direction?: string | null;
  entry?: PriceRange | string | null;
  stop?: PriceRange | string | null;
  target?: PriceRange | string | null;
  note?: string | null;
}): PennyFormattedMessage {
  const sections: PennyMessageSection[] = [
    { value: `${input.symbol} | ${input.timeframe.toUpperCase()}` },
    { value: resolveUpdateTitle(input.toneMode, input.status) },
    { value: `Status: ${formatUpdateStatus(input.status)}` },
  ];

  const directionLabel = formatDirection(input.direction ?? null);
  if (directionLabel !== "Flat") {
    sections.push({ value: `Bias: ${directionLabel}` });
  }

  const levels = [
    input.entry ? `Entry ${formatZone(input.entry)}` : null,
    input.stop ? `Stop ${formatZone(input.stop)}` : null,
    input.target ? `Target ${formatZone(input.target)}` : null,
  ].filter(Boolean);

  if (levels.length > 0) {
    sections.push({ value: `Levels: ${levels.join(" | ")}` });
  }

  if (input.note?.trim()) {
    sections.push({ value: `Note: ${input.note.trim()}` });
  }

  return buildMessage({
    kind: "signal_update",
    toneMode: input.toneMode,
    title: resolveUpdateTitle(input.toneMode, input.status),
    sections,
  });
}

function buildMessage(input: {
  kind: PennyMessageKind;
  toneMode: PennyToneMode;
  title: string;
  sections: PennyMessageSection[];
}): PennyFormattedMessage {
  const text = [...input.sections.map((section) => section.value), "", PENNY_WATERMARK, PENNY_ADVISORY_LINE].join("\n");

  return {
    kind: input.kind,
    toneMode: input.toneMode,
    title: input.title,
    sections: input.sections,
    watermark: PENNY_WATERMARK,
    disclaimer: PENNY_ADVISORY_LINE,
    text,
  };
}

function resolveActionTitle(toneMode: PennyToneMode, directionLabel: string): string {
  if (toneMode === "founder_private") {
    return `${directionLabel} setup ready`;
  }

  if (toneMode === "client_professional") {
    return `${directionLabel} market setup`;
  }

  return `${directionLabel} setup`;
}

function resolveActionStatusLine(toneMode: PennyToneMode): string {
  if (toneMode === "founder_private") {
    return "Live watch";
  }

  if (toneMode === "client_professional") {
    return "Setup active";
  }

  return "Active watch";
}

function resolveNoTradeTitle(toneMode: PennyToneMode): string {
  if (toneMode === "founder_private") {
    return "Stand aside";
  }

  if (toneMode === "client_professional") {
    return "No-trade condition";
  }

  return "No-trade state";
}

function resolveNoTradeStatusLine(toneMode: PennyToneMode): string {
  if (toneMode === "founder_private") {
    return "Wait for cleaner alignment";
  }

  if (toneMode === "client_professional") {
    return "Await renewed confirmation";
  }

  return "Waiting for cleaner alignment";
}

function resolveMissedTradeTitle(toneMode: PennyToneMode): string {
  if (toneMode === "founder_private") {
    return "Setup moved";
  }

  if (toneMode === "client_professional") {
    return "Missed opportunity";
  }

  return "Missed move";
}

function resolveMissedTradeStatusLine(toneMode: PennyToneMode): string {
  if (toneMode === "founder_private") {
    return "Stand down and wait for fresh structure";
  }

  if (toneMode === "client_professional") {
    return "Wait for the next clean expression";
  }

  return "Wait for fresh structure";
}

function resolveUpdateTitle(
  toneMode: PennyToneMode,
  status: PennySignalUpdateStatus
): string {
  const label = formatUpdateStatus(status);

  if (toneMode === "founder_private") {
    return `${label} update`;
  }

  if (toneMode === "client_professional") {
    return `${label} status`;
  }

  return `${label} update`;
}

function formatUpdateStatus(status: PennySignalUpdateStatus): string {
  switch (status) {
    case "open":
      return "Open";
    case "tp1":
      return "TP1 secured";
    case "tp2":
      return "TP2 secured";
    case "tp3":
      return "TP3 secured";
    case "closed":
      return "Closed";
    case "stopped":
      return "Stopped";
    case "invalidated":
      return "Invalidated";
    default:
      return "Update";
  }
}

function formatDirection(direction: string | null): string {
  if (!direction) {
    return "Flat";
  }

  const normalized = direction.toUpperCase();
  if (normalized === "LONG") {
    return "Long";
  }

  if (normalized === "SHORT") {
    return "Short";
  }

  return "Flat";
}

function formatConfidence(confidence: number): string {
  return `${(confidence * 100).toFixed(0)}%`;
}

function formatKillzone(killzone: string | null): string | null {
  if (!killzone || killzone === "NONE") {
    return null;
  }

  return `Window: ${killzone.replace(/_/g, " ")}`;
}

function formatTargets(targetZone: PriceRange | string): string {
  if (typeof targetZone === "string") {
    return targetZone;
  }

  const midpoint = (targetZone.low + targetZone.high) / 2;
  return `TP1 ${targetZone.low.toFixed(5)} | TP2 ${midpoint.toFixed(5)} | TP3 ${targetZone.high.toFixed(5)}`;
}

function formatZone(zone: PriceRange | string): string {
  if (typeof zone === "string") {
    return zone;
  }

  return `${zone.low.toFixed(5)} - ${zone.high.toFixed(5)}`;
}
