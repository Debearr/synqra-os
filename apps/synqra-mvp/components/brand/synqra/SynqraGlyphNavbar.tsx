import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import styles from "./synqra-glyphs.module.css";
import navbarSvg from "./glyphs/svg/navbar-stripe.svg";
// import navbarPng from "./glyphs/png/navbar-1x.png";

export const SynqraGlyphNavbar = ({ className }: { className?: string }) => {
    return (
        <div className={cn(styles.glyphContainer, className, "relative")}>
            <div className={styles.shine} />
            <Image
                src={navbarSvg}
                alt="Synqra Navbar Stripe"
                fill
                className="object-contain"
                priority
            />
        </div>
    );
};
