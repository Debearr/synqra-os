import { luxgridColors } from "@/lib/luxgrid/colors";
import { cn } from "@/lib/utils";

type LogoAccent = "emerald" | "gold";

type SynqraLogoFooterProps = {
  className?: string;
  accent?: LogoAccent;
};

const footerBars = [16, 26, 12, 22, 14, 28, 11, 20, 13, 24];

function resolveAccent(accent: LogoAccent) {
  const hex =
    accent === "gold"
      ? luxgridColors.goldAccent.hex
      : luxgridColors.emeraldAccent.hex;
  return hex ?? "#00D9A3";
}

export function SynqraLogoFooter({
  className,
  accent = "emerald",
}: SynqraLogoFooterProps) {
  const accentColor = resolveAccent(accent);
  const baseColor = luxgridColors.pureWhite.hex ?? "#FFFFFF";

  return (
    <div
      className={cn("inline-flex flex-col gap-3", className)}
      aria-label="SYNQRA footer logo"
    >
      <div className="flex items-end gap-[3px]" aria-hidden="true">
        {footerBars.map((height, index) => {
          const isAccent = index % 4 === 0;
          return (
            <span
              key={index}
              className="block w-[3px] rounded-sm"
              style={{
                height,
                backgroundColor: isAccent ? accentColor : baseColor,
                opacity: isAccent ? 1 : 0.6,
              }}
            />
          );
        })}
      </div>
      <div className="text-lg font-light tracking-[0.18em] uppercase text-foreground leading-none">
        Synqra
      </div>
    </div>
  );
}

export default SynqraLogoFooter;
