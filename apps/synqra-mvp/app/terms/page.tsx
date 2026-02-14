import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-ds-bg text-ds-text-primary">
      <div className="mx-auto w-full max-w-journey px-6 py-12">
        <article className="space-y-6 border border-ds-text-secondary/40 bg-ds-surface p-6">
          <header className="space-y-2">
            <h1 className="text-2xl font-medium leading-compact">Terms of Service</h1>
            <p className="text-sm leading-copy text-ds-text-secondary">Last updated: February 14, 2026</p>
          </header>

          <section className="space-y-2 text-sm leading-copy text-ds-text-secondary">
            <p>
              By using Synqra, you agree to use the service lawfully, protect your account credentials, and provide
              accurate information.
            </p>
            <p>
              Synqra may suspend or restrict access for abuse, policy violations, security issues, or unpaid invoices.
            </p>
          </section>

          <section id="no-refund-policy" className="space-y-2 border-t border-ds-text-secondary/30 pt-4">
            <h2 className="text-base font-medium text-ds-text-primary">No Refund Policy</h2>
            <p className="text-sm leading-copy text-ds-text-secondary">
              All fees are non-refundable once charged, except where refunds are required by law.
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
