import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import styles from "./synqra-glyphs.module.css";
import footerSvg from "./glyphs/svg/footer-band.svg";
// import footerPng from "./glyphs/png/footer-1x.png";

export const SynqraGlyphFooter = ({ className }: { className?: string }) => {
    return (
        <div className={cn(styles.glyphContainer, className, "relative")}>
            <div className={styles.shine} />
            <Image
                src={footerSvg}
                alt="Synqra Footer Band"
                fill
                className="object-contain"
                priority
            />
        </div>
    );
};
