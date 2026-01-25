import React from "react";
import { cn } from "@/lib/utils";

interface GlyphProps extends React.SVGProps<SVGSVGElement> {
    className?: string;
    width?: number | string;
    height?: number | string;
}

export const SynqraNavbarGlyph = ({ className, width, height, ...props }: GlyphProps) => {
    return (
        <svg
            viewBox="0 0 800 64"
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            aria-label="Synqra Navbar Stripe"
            className={cn("select-none", className)}
            width={width}
            height={height}
            {...props}
        >
            <defs>
                <linearGradient id="grad-navbar" x1="0%" y1="50%" x2="100%" y2="50%">
                    <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.6" />
                    <stop offset="50%" stopColor="#F5F5F0" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.6" />
                </linearGradient>
            </defs>
            <rect width="100%" height="100%" fill="#0A0A0A" />
            <g>
                {/* Horizontal Barcode Stripes */}
                <rect x="0" y="0" width="800" height="64" fill="none" />
                <rect x="20" y="10" width="4" height="44" fill="url(#grad-navbar)" />
                <rect x="30" y="10" width="8" height="44" fill="#14B8A6" /> {/* Teal */}
                <rect x="44" y="10" width="2" height="44" fill="url(#grad-navbar)" />
                <rect x="52" y="10" width="12" height="44" fill="url(#grad-navbar)" />

                <rect x="100" y="10" width="2" height="44" fill="url(#grad-navbar)" />
                <rect x="108" y="10" width="4" height="44" fill="url(#grad-navbar)" />

                {/* Repeated Pattern Subtle */}
                <rect x="150" y="20" width="600" height="2" fill="url(#grad-navbar)" opacity="0.3" />
                <rect x="150" y="42" width="600" height="2" fill="url(#grad-navbar)" opacity="0.3" />
            </g>
        </svg>
    );
};
