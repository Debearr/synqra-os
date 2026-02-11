"use client";

export default function BarcodeHorizon() {
  return (
    <div aria-hidden className="w-full overflow-hidden rounded-2xl border border-white/10 bg-black/40 p-4">
      <div className="flex h-8 items-end gap-1">
        {Array.from({ length: 48 }).map((_, index) => {
          const height = 18 + ((index * 7) % 16);
          return (
            <span
              key={index}
              className="inline-block w-[3px] bg-white/70"
              style={{ height }}
            />
          );
        })}
      </div>
    </div>
  );
}
