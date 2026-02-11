import { randomUUID } from "crypto";
import { BreakPeriod, ShiftDurationResult, ShiftState } from "./types";

const shiftStore = new Map<string, ShiftState>();

const nowIso = () => new Date().toISOString();

export function startShift(shiftId?: string, start?: string): ShiftState {
  const id = shiftId ?? randomUUID();
  const shift: ShiftState = {
    shiftId: id,
    start: start ?? nowIso(),
    breaks: [],
  };
  shiftStore.set(id, shift);
  return shift;
}

export function stopShift(shiftId: string, end?: string): ShiftState | null {
  const shift = shiftStore.get(shiftId);
  if (!shift) return null;
  shift.end = end ?? nowIso();
  shiftStore.set(shiftId, shift);
  return shift;
}

export function getShiftDuration(shiftId: string): ShiftDurationResult | null {
  const shift = shiftStore.get(shiftId);
  if (!shift) return null;

  const endTime = shift.end ? new Date(shift.end) : new Date();
  const startTime = new Date(shift.start);
  const totalMinutes =
    (endTime.getTime() - startTime.getTime()) / (1000 * 60);

  const breakMinutes = shift.breaks.reduce((sum, period) => {
    if (!period.end) return sum;
    const duration =
      (new Date(period.end).getTime() - new Date(period.start).getTime()) /
      (1000 * 60);
    return sum + Math.max(duration, 0);
  }, 0);

  const currentlyOnBreak = shift.breaks.some((period) => !period.end);
  const activeMinutes = Math.max(totalMinutes - breakMinutes, 0);

  return {
    activeMinutes,
    breakMinutes,
    totalMinutes,
    isActive: !shift.end,
    currentlyOnBreak,
  };
}

export function detectBreaks(
  shiftId: string,
  activityTimestamps: string[],
  thresholdMinutes = 15
): BreakPeriod[] {
  const shift = shiftStore.get(shiftId);
  if (!shift) throw new Error("Shift not found");

  const sorted = [...activityTimestamps]
    .map((ts) => new Date(ts))
    .sort((a, b) => a.getTime() - b.getTime());

  for (let i = 1; i < sorted.length; i++) {
    const gapMinutes =
      (sorted[i].getTime() - sorted[i - 1].getTime()) / (1000 * 60);
    if (gapMinutes >= thresholdMinutes) {
      const existing = shift.breaks.find(
        (b) =>
          Math.abs(new Date(b.start).getTime() - sorted[i - 1].getTime()) < 1000
      );
      if (!existing) {
        shift.breaks.push({
          start: sorted[i - 1].toISOString(),
          end: sorted[i].toISOString(),
          type: "rest",
          flaggedBySystem: true,
        });
      }
    }
  }

  shiftStore.set(shiftId, shift);
  return shift.breaks;
}
