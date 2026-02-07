import React from "react";

/**
 * Perimeter / Atmosphere Engine
 * - Pure CSS/Tailwind layers
 * - Fixed behind all content
 * - pointer-events: none
 */
export default function Perimeter() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0"
      style={{ zIndex: 0 }}
    >
      {/* Layer 1: solid void */}
      <div className="absolute inset-0" style={{ background: "var(--atmo-void)" }} />

      {/* Layer 2: ultra-low-contrast veins (geological drift) */}
      <div
        className="absolute inset-[-8%] animate-geological-drift motion-reduce:animate-none"
        style={{
          opacity: "var(--grain-opacity)",
          mixBlendMode: "soft-light",
          backgroundImage: [
            // broad substructure
            "radial-gradient(1200px 700px at 18% 22%, rgba(var(--energy-secondary), var(--atmo-core-a)), transparent 60%)",
            "radial-gradient(900px 540px at 78% 18%, rgba(var(--energy-primary), var(--atmo-core-b)), transparent 58%)",
            // fine veins (barely there)
            "repeating-linear-gradient(115deg, rgba(255,255,255,var(--atmo-vein-a)) 0 1px, transparent 1px 18px)",
            "repeating-linear-gradient(25deg, rgba(140,140,145,var(--atmo-vein-b)) 0 1px, transparent 1px 22px)",
          ].join(", "),
        }}
      />

      {/* Layer 3: vignette (center clear, edges darker) */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 50% 32%, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 46%, rgba(0,0,0,var(--atmo-vignette-mid)) 72%, rgba(0,0,0,var(--atmo-vignette-edge)) 100%)",
        }}
      />

      {/* Layer 4: edge energy pulse (very low opacity) */}
      <div
        className="absolute inset-0 motion-reduce:opacity-0"
        style={{
          animation: "atmo-edge-pulse var(--flow-speed) ease-in-out infinite",
          backgroundImage:
            "radial-gradient(closest-side at 50% 50%, rgba(0,0,0,0) 68%, rgba(var(--energy-secondary), var(--atmo-edge-glow)) 92%, rgba(0,0,0,0) 100%)",
          mixBlendMode: "overlay",
          opacity: "var(--atmo-edge-layer-opacity)",
        }}
      />
    </div>
  );
}


