"use client";

const SIZES = [16, 32, 64, 128] as const;

export default function QPreviewPage() {
  return (
    <main className="min-h-screen bg-noid-black text-white">
      <div className="mx-auto max-w-5xl px-6 py-[160px]">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          {SIZES.map((size) => (
            <div key={size} className="flex flex-col items-center gap-4">
              <div className="font-mono text-[0.72rem] uppercase tracking-[0.16em] text-noid-silver/70">
                {size}px
              </div>
              <div
                className="flex items-center justify-center rounded-2xl border border-noid-silver/20 bg-white/[0.02]"
                style={{ width: Math.max(72, size + 32), height: Math.max(72, size + 32) }}
              >
                <img
                  src="/assets/synqra-q.svg"
                  width={size}
                  height={size}
                  alt={`Synqra Q at ${size}px`}
                  style={{ imageRendering: "auto" }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}


