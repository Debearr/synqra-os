import Link from "next/link";

export default function UserPage() {
  return (
    <main className="min-h-screen bg-ds-bg text-ds-text-primary">
      <div className="mx-auto w-full max-w-journey space-y-6 px-6 py-12">
        <header className="space-y-4">
          <p className="text-sm leading-copy tracking-[0.12em] uppercase text-ds-text-secondary">User Workspace</p>
          <h1 className="text-2xl font-medium leading-compact">Dashboard</h1>
        </header>

        <section className="space-y-4 border border-ds-text-secondary/40 bg-ds-surface p-6">
          <p className="text-sm leading-copy text-ds-text-secondary">
            Access deterministic workflow surfaces.
          </p>
          <div className="space-y-4">
            <Link
              href="/journey"
              className="block w-full border border-ds-text-secondary/40 bg-ds-surface px-4 py-2 text-center text-sm font-medium leading-copy text-ds-text-primary"
            >
              Open Journey
            </Link>
            <Link
              href="/studio"
              className="block w-full bg-ds-gold px-4 py-2 text-center text-sm font-medium leading-copy text-ds-bg"
            >
              Open Studio
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
