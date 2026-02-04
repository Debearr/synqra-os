import { luxgridColors } from "@/lib/luxgrid/colors";
import { cn } from "@/lib/utils";

type LogoAccent = "emerald" | "gold";

type SynqraLogoFaviconProps = {
  className?: string;
  accent?: LogoAccent;
  size?: number;
};

const faviconBars = [12, 16, 10, 18, 8, 14, 11];

function accentHex(accent: LogoAccent) {
  const hex =
    accent === "gold"
      ? luxgridColors.goldAccent.hex
      : luxgridColors.emeraldAccent.hex;
  return hex ?? "#00D9A3";
}

export function SynqraLogoFavicon({
  className,
  accent = "emerald",
  size = 28,
}: SynqraLogoFaviconProps) {
  const accentColor = accentHex(accent);
  const baseColor = luxgridColors.pureWhite.hex ?? "#FFFFFF";
  const barWidth = size / (faviconBars.length * 1.4);

  return (
    <div
      className={cn(
        "inline-flex items-end rounded-[6px] bg-foreground/90 p-[6px]",
        className
      )}
      style={{ width: size, height: size }}
      aria-label="SYNQRA favicon mark"
    >
      {faviconBars.map((height, index) => {
        const isAccent = index % 3 === 0;
        return (
          <span
            key={index}
            className="block rounded-sm"
            style={{
              width: barWidth,
              height,
              backgroundColor: isAccent ? accentColor : baseColor,
              opacity: isAccent ? 1 : 0.55,
            }}
          />
        );
      })}
    </div>
  );
}

export default SynqraLogoFavicon;
