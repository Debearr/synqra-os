"use client";

import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";

function fnv1a32(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function makeRng(seed: number) {
  let x = seed || 1;
  return () => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return (x >>> 0) / 0xffffffff;
  };
}

export default function BarcodeHorizon() {
  const reduceMotion = useReducedMotion();

  const seedString =
    [
      "synqra",
      process.env.NEXT_PUBLIC_BUILD_HASH,
      process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
      process.env.NODE_ENV,
      "lite",
    ]
      .filter(Boolean)
      .join("|") || "synqra|lite";

  const bars = useMemo(() => {
    const rng = makeRng(fnv1a32(seedString));
    const out: Array<{ x: number; w: number; h: number; y: number; o: number }> = [];

    let x = 14;
    const maxX = 306;

    while (x < maxX) {
      const r = rng();
      const w = r > 0.82 ? 2 : 1;
      const gap = r > 0.92 ? 6 : r > 0.6 ? 4 : 3;
      const h = r > 0.9 ? 54 : r > 0.72 ? 46 : 40;
      const y = 8 + (56 - h);
      const o = 0.24 + rng() * 0.18;

      out.push({ x, w, h, y, o });
      x += w + gap;
    }

    return out;
  }, [seedString]);

  return (
    <div className="mb-8 flex items-center justify-center">
      <div className="text-center">
        <div className="relative mx-auto w-[320px]">
          <div className="h-16" aria-hidden />

          <svg
            width="320"
            height="112"
            viewBox="0 0 320 112"
            role="img"
            aria-label="Encoded system layer"
            className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2"
            style={{ opacity: 0.55 }}
          >
            <defs>
              <linearGradient id="platinum" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="rgba(255,255,255,0.14)" />
                <stop offset="35%" stopColor="rgba(140,140,145,0.22)" />
                <stop offset="70%" stopColor="rgba(255,255,255,0.10)" />
                <stop offset="100%" stopColor="rgba(140,140,145,0.18)" />
              </linearGradient>
              <linearGradient id="scan" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="rgba(255,255,255,0)" />
                <stop offset="50%" stopColor="rgba(255,255,255,0.08)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0)" />
              </linearGradient>
            </defs>

            <rect x="0" y="0" width="320" height="112" fill="transparent" />

            {bars.map((b, i) => (
              <rect
                key={i}
                x={b.x}
                y={b.y}
                width={b.w}
                height={b.h}
                fill="url(#platinum)"
                opacity={b.o}
              />
            ))}

            <rect
              x="10"
              y="10"
              width="300"
              height="52"
              fill="transparent"
              stroke="rgba(140,140,145,0.14)"
            />

            {!reduceMotion && (
              <motion.rect
                x={-60}
                y={8}
                width={60}
                height={58}
                fill="url(#scan)"
                opacity={0.18}
                animate={{ x: [-60, 380] }}
                transition={{ duration: 90, repeat: Infinity, ease: "linear" }}
              />
            )}
          </svg>
        </div>

        <div className="relative mt-4 font-display text-3xl uppercase tracking-[0.38em] text-white md:text-4xl">
          SYNQRA
        </div>
      </div>
    </div>
  );
}

