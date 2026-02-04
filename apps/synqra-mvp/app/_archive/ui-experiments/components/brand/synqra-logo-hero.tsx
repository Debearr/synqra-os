import { luxgridColors } from "@/lib/luxgrid/colors";
import { cn } from "@/lib/utils";

type LogoAccent = "emerald" | "gold";

type SynqraLogoHeroProps = {
  className?: string;
  accent?: LogoAccent;
  tagline?: string;
};

const heroBars = [26, 44, 18, 38, 22, 48, 16, 36, 20, 42, 24, 30, 18, 40];

function resolveAccent(accent: LogoAccent) {
  const hex =
    accent === "gold"
      ? luxgridColors.goldAccent.hex
      : luxgridColors.emeraldAccent.hex;
  return hex ?? "#00D9A3";
}

export function SynqraLogoHero({
  className,
  accent = "emerald",
  tagline = "Barcode intelligence for luxury-grade AI",
}: SynqraLogoHeroProps) {
  const accentColor = resolveAccent(accent);
  const baseColor = luxgridColors.pureWhite.hex ?? "#FFFFFF";

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-6 text-center",
        className
      )}
      aria-label="SYNQRA hero logo"
    >
      <div className="flex items-end gap-[3px]" aria-hidden="true">
        {heroBars.map((height, index) => {
          const isAccent = index % 5 === 0 || index === heroBars.length - 1;
          return (
            <span
              key={index}
              className="block w-[4px] rounded-sm"
              style={{
                height,
                backgroundColor: isAccent ? accentColor : baseColor,
                opacity: isAccent ? 1 : 0.5,
              }}
            />
          );
        })}
      </div>
      <div className="space-y-2">
        <div className="text-3xl sm:text-4xl md:text-5xl font-light uppercase tracking-[0.28em]">
          SYNQRA
        </div>
        <p className="text-sm sm:text-base text-muted-foreground font-light tracking-[0.08em]">
          {tagline}
        </p>
      </div>
    </div>
  );
}

export default SynqraLogoHero;
