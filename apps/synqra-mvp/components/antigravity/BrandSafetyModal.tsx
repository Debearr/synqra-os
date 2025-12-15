import React from "react";

type BrandSafetyModalProps = {
  open: boolean;
  forbidden: string[];
  onClose: () => void;
};

export function BrandSafetyModal({ open, forbidden, onClose }: BrandSafetyModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-black/90 p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Brand Safety</h3>
          <button
            onClick={onClose}
            className="rounded-full bg-white/10 px-3 py-1 text-xs text-white hover:bg-white/20"
          >
            Close
          </button>
        </div>
        <p className="mt-3 text-sm text-white/70">
          The following phrases were blocked from output:
        </p>
        <ul className="mt-3 space-y-2 text-sm text-white">
          {forbidden.length === 0 && (
            <li className="text-white/50">No forbidden phrases detected.</li>
          )}
          {forbidden.map((item) => (
            <li
              key={item}
              className="rounded bg-white/5 px-3 py-2 font-mono text-xs text-amber-200"
            >
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default BrandSafetyModal;
