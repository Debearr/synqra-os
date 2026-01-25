import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import styles from "./synqra-glyphs.module.css";
import faviconSvg from "./glyphs/svg/favicon.svg";
// import faviconPng from "./glyphs/png/favicon-1x.png";

export const SynqraGlyphFavicon = ({ className }: { className?: string }) => {
    return (
        <div className={cn(styles.glyphContainer, className, "relative")}>
            <div className={styles.shine} />
            <Image
                src={faviconSvg}
                alt="Synqra Favicon"
                fill
                className="object-contain"
                priority
            />
        </div>
    );
};
