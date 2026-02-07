import {
  DriverHealthIndexResult,
  DriverHealthSnapshot,
} from "./types";

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const round1 = (value: number) => Math.round(value * 10) / 10;

export function fatigueScore(
  snapshot: DriverHealthSnapshot,
  context?: { hoursDriven?: number; lastBreakMinutesAgo?: number }
): number {
  const stress = snapshot.stressLevel ?? 5;
  const fatigue = snapshot.fatigueLevel ?? 5;
  const hoursDriven = context?.hoursDriven ?? 0;
  const lastBreakAgo = context?.lastBreakMinutesAgo ?? 120;

  let score = (stress + fatigue) * 5; // 0-100
  score += Math.max(0, (hoursDriven - 6) * 5);
  score += Math.max(0, (lastBreakAgo - 90) * 0.5);

  return clamp(score, 0, 100);
}

export function computeDriverHealthIndex(
  snapshot: DriverHealthSnapshot,
  context?: { hoursDriven?: number; lastBreakMinutesAgo?: number }
): DriverHealthIndexResult {
  const hydration = snapshot.hydrationOz ?? 0;
  const sleep = snapshot.sleepHours ?? 0;
  const steps = snapshot.steps ?? 0;

  const hydrationScore = clamp((hydration / 80) * 100, 0, 100);
  const sleepScore = clamp((sleep / 8) * 100, 0, 100);
  const activityScore = clamp((steps / 8000) * 100, 0, 100);
  const fatigue = fatigueScore(snapshot, context);

  const composite =
    hydrationScore * 0.25 +
    sleepScore * 0.35 +
    activityScore * 0.1 +
    (100 - fatigue) * 0.3;

  const sleepDebtHours = Math.max(0, 8 - sleep);
  const fatigueRisk: DriverHealthIndexResult["fatigueRisk"] =
    fatigue > 70 ? "high" : fatigue > 40 ? "moderate" : "low";
  const hydrationStatus: DriverHealthIndexResult["hydrationStatus"] =
    hydrationScore < 50 ? "low" : "ok";

  const cooldownMinutes = cooldownRecommendationMinutes(fatigue, context);

  return {
    score: Math.round(composite),
    fatigueRisk,
    hydrationStatus,
    sleepDebtHours: round1(sleepDebtHours),
    cooldownMinutes,
    recommendations: buildRecommendations({
      fatigue,
      hydrationScore,
      sleepScore,
      activityScore,
      lastBreakMinutesAgo: context?.lastBreakMinutesAgo,
    }),
    factors: {
      hydrationScore: round1(hydrationScore),
      sleepScore: round1(sleepScore),
      activityScore: round1(activityScore),
      fatigueScore: round1(fatigue),
    },
  };
}

function cooldownRecommendationMinutes(
  fatigue: number,
  context?: { lastBreakMinutesAgo?: number }
): number {
  const base = fatigue > 70 ? 30 : fatigue > 40 ? 15 : 5;
  const sinceBreak = context?.lastBreakMinutesAgo ?? 120;
  return Math.max(base, Math.round((sinceBreak / 60) * 10));
}

function buildRecommendations(params: {
  fatigue: number;
  hydrationScore: number;
  sleepScore: number;
  activityScore: number;
  lastBreakMinutesAgo?: number;
}): string[] {
  const recs: string[] = [];
  if (params.hydrationScore < 60) recs.push("Hydrate: target +12-16 oz water.");
  if (params.sleepScore < 60) recs.push("Schedule rest: aim for 7-8 hours tonight.");
  if (params.activityScore < 40) recs.push("Light stretch: 3-5 minutes to reduce stiffness.");
  if (params.fatigue > 70)
    recs.push("Take a 20-30 minute break; avoid accepting long trips.");
  else if (params.fatigue > 40)
    recs.push("Short cooldown: 10-15 minutes before next batch.");

  if ((params.lastBreakMinutesAgo ?? 0) > 120)
    recs.push("Log a break: >2 hours since last rest.");

  return recs;
}
