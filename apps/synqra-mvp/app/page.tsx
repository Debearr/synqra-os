import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-ds-bg text-ds-text-primary">
      <div className="mx-auto flex min-h-screen w-full max-w-journey items-center px-6 py-12">
        <section className="w-full space-y-6 border border-ds-text-secondary/40 bg-ds-surface p-6">
          <div className="space-y-4">
            <p className="text-sm leading-copy tracking-[0.12em] uppercase text-ds-text-secondary">Synqra</p>
            <h1 className="text-2xl font-medium leading-compact">Content orchestration for executives</h1>
            <p className="text-sm leading-copy text-ds-text-secondary">
              Structured workflow for marketing, journey, and studio output with deterministic rules.
            </p>
          </div>

          <div className="space-y-4">
            <Link
              href="/auth/sign-in"
              className="block w-full bg-ds-gold px-4 py-2 text-center text-sm font-medium leading-copy text-ds-bg"
            >
              Sign in
            </Link>
            <Link
              href="/auth/sign-up"
              className="block w-full border border-ds-text-secondary/40 bg-ds-surface px-4 py-2 text-center text-sm font-medium leading-copy text-ds-text-primary"
            >
              Sign up
            </Link>
          </div>

          <footer className="border-t border-ds-text-secondary/30 pt-4 text-xs leading-copy text-ds-text-secondary">
            <div className="flex items-center gap-4">
              <Link href="/terms" className="hover:text-ds-text-primary">
                Terms
              </Link>
              <Link href="/privacy" className="hover:text-ds-text-primary">
                Privacy
              </Link>
              <Link href="/terms#no-refund-policy" className="hover:text-ds-text-primary">
                No Refund
              </Link>
            </div>
          </footer>
        </section>
      </div>
    </main>
  );
}
