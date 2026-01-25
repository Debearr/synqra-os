"use client";

/**
 * ARCHIVED: Content Flywheel UI
 *
 * This file is intentionally kept out of active routing by living under `app/_archive`.
 * It exists only as reference and must not be re-linked into deploy paths.
 */

export default function ArchivedContentFlywheel() {
  return (
    <main className="min-h-screen bg-noid-black px-6 py-12 text-white">
      <div className="mx-auto max-w-3xl space-y-4 rounded-3xl border border-noid-silver/40 bg-white/5 p-8">
        <h1 className="text-xl font-semibold tracking-tight text-white">Archived</h1>
        <p className="text-sm text-noid-silver">
          The prototype <span className="font-semibold text-noid-gold">Content Flywheel</span> UI has been
          archived and removed from deploy paths.
        </p>
      </div>
    </main>
  );
}


