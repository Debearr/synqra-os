import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-ds-bg text-ds-text-primary">
      <div className="mx-auto w-full max-w-journey px-6 py-12">
        <article className="space-y-6 border border-ds-text-secondary/40 bg-ds-surface p-6">
          <header className="space-y-2">
            <h1 className="text-2xl font-medium leading-compact">Privacy Policy</h1>
            <p className="text-sm leading-copy text-ds-text-secondary">Last updated: February 14, 2026</p>
          </header>

          <section className="space-y-2 text-sm leading-copy text-ds-text-secondary">
            <p>Synqra collects account, usage, and system data needed to operate authentication and product features.</p>
            <p>
              We use this data to provide service, maintain security, and support operations. We do not sell personal
              data.
            </p>
            <p>
              You can request account deletion by contacting support. Legal, tax, and security records may be retained
              where required.
            </p>
          </section>

          <footer className="border-t border-ds-text-secondary/30 pt-4 text-sm">
            <Link href="/enter" className="text-ds-text-secondary hover:text-ds-text-primary">
              Back to access
            </Link>
          </footer>
        </article>
      </div>
    </main>
  );
}
