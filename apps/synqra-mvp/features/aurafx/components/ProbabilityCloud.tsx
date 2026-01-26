import React from 'react';

export const ProbabilityCloud: React.FC = () => {
    // Mock data - would be prop driven
    const confidence = 0.85; // 0-1
    const skew = 0.4; // -1 to 1 (negative = bearish skew, positive = bullish)

    // Derived visuals
    const opacity = Math.max(0.1, confidence * 0.9);

    // We create a "cloud" using SVG filters and multiple elliptical layers
    // The "Skew" shifts the center of gravity of the shapes

    // Color Palette: using inline hex for Gold/Teal fallback if tokens missing
    const primaryColor = skew > 0 ? '#D4AF37' : '#20B2AA'; // Gold vs Teal (Non-emotional)

    return (
        <div className="w-full h-full relative" aria-label={`Probability Cloud: ${confidence * 100}% Confidence, Skew ${skew}`}>
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                    <filter id="cloud-blur" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
                    </filter>
                    <radialGradient id="grad1" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                        <stop offset="0%" style={{ stopColor: primaryColor, stopOpacity: opacity }} />
                        <stop offset="100%" style={{ stopColor: primaryColor, stopOpacity: 0 }} />
                    </radialGradient>
                </defs>

                {/* Core Probability Mass - Deformed by skew */}
                <ellipse
                    cx={50 + (skew * 10)}
                    cy="50"
                    rx="30"
                    ry={20 + (Math.abs(skew) * 10)}
                    fill="url(#grad1)"
                    filter="url(#cloud-blur)"
                    className="animate-pulse" // Standard Tailwind pulse
                >
                    <animate attributeName="ry" values={`${20 + (Math.abs(skew) * 10)};${22 + (Math.abs(skew) * 10)};${20 + (Math.abs(skew) * 10)}`} dur="4s" repeatCount="indefinite" />
                </ellipse>

                {/* Secondary Diffuse Layer */}
                <ellipse
                    cx={50 + (skew * 5)}
                    cy="50"
                    rx="40"
                    ry="30"
                    fill="url(#grad1)"
                    filter="url(#cloud-blur)"
                    opacity="0.3"
                />
            </svg>

            {/* Fallback accessible output */}
            <div className="sr-only">
                Market probability distribution cloud. Skew is {skew > 0 ? 'Positive' : 'Negative'}.
            </div>
        </div>
    );
};
