import React from 'react';

interface ProbabilityCloudProps {
    opacity: number;
    skew: number;
    intensity: number;
    isStale: boolean;
}

export const ProbabilityCloud: React.FC<ProbabilityCloudProps> = ({
    opacity = 0,
    skew = 0,
    intensity = 0,
    isStale = false
}) => {
    // Derived visuals
    // If stale, we desaturate or reduce opacity further
    const effectiveOpacity = isStale ? opacity * 0.5 : opacity;
    const effectiveBlur = isStale ? 6 : 3; // Blurrier if stale

    // Color Palette: using inline hex for Gold/Teal fallback if tokens missing
    // Logic:
    // Skew > 0 (UP) -> Gold (Premium/Bullish context in AuraFX usually Gold/White)
    // Skew < 0 (DOWN) -> Teal (NØID/Tech context)
    // Use consistent non-emotional colors.
    const primaryColor = skew > 0 ? '#D4AF37' : '#20B2AA';

    if (effectiveOpacity <= 0.05) return null; // Optimization

    return (
        <div
            className={`w-full h-full relative transition-opacity duration-1000 ${isStale ? 'grayscale' : ''}`}
            aria-label={`Probability Cloud: ${Math.round(intensity * 100)}% Confidence`}
        >
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                    <filter id={`cloud-blur-${skew}`} x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur in="SourceGraphic" stdDeviation={effectiveBlur} />
                    </filter>
                    <radialGradient id={`grad-${skew}`} cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                        <stop offset="0%" style={{ stopColor: primaryColor, stopOpacity: effectiveOpacity }} />
                        <stop offset="100%" style={{ stopColor: primaryColor, stopOpacity: 0 }} />
                    </radialGradient>
                </defs>

                {/* Core Probability Mass - Deformed by skew */}
                {/* Skew shifts X (+Right/Up, -Left/Down concept) */}
                <ellipse
                    cx={50 + (skew * 20)}
                    cy="50"
                    rx={30 * intensity}
                    ry={20 + (Math.abs(skew) * 10)}
                    fill={`url(#grad-${skew})`}
                    filter={`url(#cloud-blur-${skew})`}
                    className="animate-pulse"
                >
                    <animate
                        attributeName="ry"
                        values={`${20 + (Math.abs(skew) * 10)};${22 + (Math.abs(skew) * 10)};${20 + (Math.abs(skew) * 10)}`}
                        dur="4s"
                        repeatCount="indefinite"
                    />
                </ellipse>

                {/* Secondary Diffuse Layer */}
                <ellipse
                    cx={50 + (skew * 10)}
                    cy="50"
                    rx={40 * intensity}
                    ry={30}
                    fill={`url(#grad-${skew})`}
                    filter={`url(#cloud-blur-${skew})`}
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
