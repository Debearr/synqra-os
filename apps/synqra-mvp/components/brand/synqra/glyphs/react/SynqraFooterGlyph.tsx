import React from "react";
import { cn } from "@/lib/utils";

interface GlyphProps extends React.SVGProps<SVGSVGElement> {
    className?: string;
    width?: number | string;
    height?: number | string;
}

export const SynqraFooterGlyph = ({ className, width, height, ...props }: GlyphProps) => {
    return (
        <svg
            viewBox="0 0 1200 120"
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            aria-label="Synqra Footer Band"
            className={cn("select-none", className)}
            width={width}
            height={height}
            {...props}
        >
            <defs>
                <linearGradient id="grad-footer" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#0A0A0A" />
                    <stop offset="20%" stopColor="#D4AF37" stopOpacity="0.3" />
                    <stop offset="50%" stopColor="#14B8A6" stopOpacity="0.5" />
                    <stop offset="80%" stopColor="#D4AF37" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#0A0A0A" />
                </linearGradient>
                <filter id="filter-footer" x="-10%" y="-10%" width="120%" height="120%">
                    <feGaussianBlur stdDeviation="2" />
                </filter>
            </defs>
            <rect width="100%" height="100%" fill="#0A0A0A" />

            {/* Wide Band with Gradient */}
            <rect x="0" y="40" width="1200" height="40" fill="url(#grad-footer)" />

            {/* Overlay Barcode Details */}
            <g className="barcode-overlay" opacity="0.4">
                <rect x="100" y="40" width="2" height="40" fill="#F5F5F0" />
                <rect x="110" y="40" width="5" height="40" fill="#F5F5F0" />
                <rect x="1100" y="40" width="5" height="40" fill="#F5F5F0" />
                <rect x="1110" y="40" width="2" height="40" fill="#F5F5F0" />
            </g>
        </svg>
    );
};
