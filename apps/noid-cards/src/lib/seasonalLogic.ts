import { getSeasonalConfig } from "@/lib/cardTokens";

export type SeasonalVariant = ReturnType<typeof resolveSeason>;

const parseDate = (mmdd: string, year: number) => {
  const [month, day] = mmdd.split("-").map(Number);
  return new Date(Date.UTC(year, (month ?? 1) - 1, day ?? 1, 0, 0, 0));
};

export function resolveSeason(date: Date = new Date()) {
  const config = getSeasonalConfig();
  const seasons = config.seasons;

  const year = date.getUTCFullYear();
  const cursor = new Date(date);
  cursor.setUTCHours(0, 0, 0, 0);

  const found = seasons.find((season) => {
    const start = parseDate(season.start, year);
    const end = parseDate(season.end, year);

    if (start.getTime() <= end.getTime()) {
      return cursor >= start && cursor <= end;
    }

    // Season spans across year boundary (e.g. winter)
    const endNextYear = parseDate(season.end, year + 1);
    return cursor >= start || cursor <= endNextYear;
  });

  const fallback = seasons.find((season) => season.id === config.default) ?? seasons[0];

  return found ?? fallback;
}

export function buildSeasonalCardStyles(season = resolveSeason()) {
  return {
    "--card-season-surface": season.surface,
    "--card-season-glow": season.glow,
    "--card-season-badge": `'${season.badge.toUpperCase()}'`,
  } satisfies Record<string, string>;
}
