import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import styles from "./synqra-glyphs.module.css";
import dualSvg from "./glyphs/svg/dual-mark.svg";
// import dualPng from "./glyphs/png/dual-1x.png";

export const SynqraGlyphDual = ({ className }: { className?: string }) => {
    return (
        <div className={cn(styles.glyphContainer, className, "relative")}>
            <div className={styles.shine} />
            <Image
                src={dualSvg}
                alt="Synqra × NØID Dual-Mark"
                fill
                className="object-contain"
                priority
            />
        </div>
    );
};
