/**
 * Killzone Engine
 * - Maps timestamps to London/NY/Asia sessions for SMC timing confluence.
 * - Configurable windows; returns active killzone and window metadata.
 */

import { Killzone, SessionState } from "./types";

interface KillzoneWindow {
  label: Killzone;
  start: string; // HH:MM 24h
  end: string; // HH:MM 24h
}

const KILLZONE_WINDOWS: KillzoneWindow[] = [
  { label: "LONDON_OPEN", start: "07:00", end: "10:00" },
  { label: "NY_OPEN", start: "12:30", end: "16:00" },
  { label: "ASIA_RANGE", start: "23:00", end: "02:00" },
];

export function getKillzone(
  timestamp: number,
  tzOffsetMinutes = 0
): SessionState {
  const date = new Date(timestamp + tzOffsetMinutes * 60 * 1000);
  const hh = date.getUTCHours();
  const mm = date.getUTCMinutes();
  const currentMinutes = hh * 60 + mm;

  for (const window of KILLZONE_WINDOWS) {
    const [startH, startM] = window.start.split(":").map(Number);
    const [endH, endM] = window.end.split(":").map(Number);
    const start = startH * 60 + startM;
    const end = endH * 60 + endM;

    const inWindow =
      start <= end
        ? currentMinutes >= start && currentMinutes <= end
        : // handles wrap (e.g., 23:00-02:00)
          currentMinutes >= start || currentMinutes <= end;

    if (inWindow) {
      return {
        killzone: window.label,
        isActive: true,
        window: {
          start: toIso(date, start),
          end: toIso(date, end),
        },
      };
    }
  }

  return {
    killzone: "NONE",
    isActive: false,
    window: {
      start: toIso(new Date(timestamp), 0),
      end: toIso(new Date(timestamp), 0),
    },
  };
}

function toIso(base: Date, minutes: number) {
  const copy = new Date(base);
  copy.setUTCHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return copy.toISOString();
}
