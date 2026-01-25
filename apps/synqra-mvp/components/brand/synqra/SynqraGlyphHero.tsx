import React from "react";
import { cn } from "@/lib/utils";
import styles from "./synqra-glyphs.module.css";
import heroSvg from "./glyphs/svg/hero-glyph.svg";
// import heroPng from "./glyphs/png/hero-1x.png";

import Image from "next/image";

export const SynqraGlyphHero = ({ className }: { className?: string }) => {
    return (
        <div className={cn(styles.glyphContainer, className, "relative")}>
            <div className={styles.shine} />
            <Image
                src={heroSvg}
                alt="Synqra Hero Glyph"
                fill
                className="object-contain"
                priority
            />
        </div>
    );
};
