import tokensJson from "@/styles/luxgrid.cardTokens.json";
import seasonalConfigJson from "@/config/seasonalConfig.json";

export type CardTokens = typeof tokensJson & {
  colors: typeof tokensJson.colors & {
    resolvedSeasonalForeground?: string;
  };
};

export type SeasonalConfig = typeof seasonalConfigJson;

const cardTokens: CardTokens = {
  ...tokensJson,
  colors: {
    ...tokensJson.colors,
  },
};

export const getCardTokens = () => cardTokens;

export const getSeasonalConfig = (): SeasonalConfig => seasonalConfigJson;

export const cardCssVariables = () => {
  const colors = cardTokens.colors;
  const typography = cardTokens.typography;

  return {
    "--card-bg": colors.base.obsidian,
    "--card-bg-soft": colors.base.obsidianSoft,
    "--card-border": colors.base.graphiteLine,
    "--card-foreground": colors.base.platinum,
    "--card-foreground-muted": colors.base.platinumMuted,
    "--card-accent": colors.accents.tealSolid,
    "--card-accent-gradient": colors.accents.tealLinear,
    "--card-shadow": cardTokens.shadows.ambient,
    "--card-radius": cardTokens.borders.radius.outer,
    "--card-radius-inner": cardTokens.borders.radius.inner,
    "--card-font-display": typography.display.family,
    "--card-font-headline": typography.headline.family,
    "--card-font-body": typography.body.family,
    "--card-font-mono": typography.micro.family,
  } as Record<string, string>;
};

export const qrOptions = () => ({
  width: cardTokens.qr.size,
  color: {
    dark: cardTokens.qr.foreground,
    light: cardTokens.qr.background,
  },
  margin: cardTokens.qr.margin,
});
