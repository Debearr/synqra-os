import { luxgridColors } from "@/lib/luxgrid/colors";
import { cn } from "@/lib/utils";

type LogoAccent = "emerald" | "gold";

type SynqraLogoNavbarProps = {
  className?: string;
  accent?: LogoAccent;
  showWordmark?: boolean;
};

const navbarBars = [14, 22, 10, 18, 12, 20, 9, 16, 11, 19, 12, 15];

function getAccentColor(accent: LogoAccent) {
  const hex =
    accent === "gold"
      ? luxgridColors.goldAccent.hex
      : luxgridColors.emeraldAccent.hex;
  return hex ?? "#00D9A3";
}

export function SynqraLogoNavbar({
  className,
  accent = "emerald",
  showWordmark = true,
}: SynqraLogoNavbarProps) {
  const accentColor = getAccentColor(accent);
  const baseColor = luxgridColors.pureWhite.hex ?? "#FFFFFF";

  return (
    <div
      className={cn("flex items-center gap-3", className)}
      aria-label="SYNQRA barcode logo"
    >
      <div className="flex items-end gap-[2px]" aria-hidden="true">
        {navbarBars.map((height, index) => {
          const isAccent = index % 4 === 0;
          return (
            <span
              key={index}
              className="block w-[3px] rounded-sm transition-opacity duration-300"
              style={{
                height,
                backgroundColor: isAccent ? accentColor : baseColor,
                opacity: isAccent ? 1 : 0.6,
              }}
            />
          );
        })}
      </div>

      {showWordmark && (
        <span className="text-base md:text-lg font-light tracking-[0.2em] uppercase text-foreground transition-opacity duration-300 group-hover:opacity-70">
          SYNQRA
        </span>
      )}
    </div>
  );
}

export default SynqraLogoNavbar;
