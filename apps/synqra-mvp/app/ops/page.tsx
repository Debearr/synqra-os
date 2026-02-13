import Link from "next/link";

const ownerEmail = process.env.DEBEAR_OPS_EMAIL ?? process.env.OWNER_EMAIL ?? process.env.ADMIN_EMAIL ?? "not-configured";

export default function OpsPage() {
  return (
    <main className="min-h-screen bg-ds-bg text-ds-text-primary">
      <div className="mx-auto w-full max-w-journey space-y-6 px-6 py-12">
        <header className="space-y-4">
          <p className="text-sm leading-copy tracking-[0.12em] uppercase text-ds-text-secondary">Debear Ops</p>
          <h1 className="text-2xl font-medium leading-compact">Founder override</h1>
          <p className="text-sm leading-copy text-ds-text-secondary">Owner identity: {ownerEmail}</p>
        </header>

        <section className="space-y-4 border border-ds-text-secondary/40 bg-ds-surface p-6">
          <p className="text-sm leading-copy text-ds-text-secondary">
            Founder role can enter both user workflow and admin panel.
          </p>
          <div className="space-y-4">
            <Link
              href="/user"
              className="block w-full border border-ds-text-secondary/40 bg-ds-surface px-4 py-2 text-center text-sm font-medium leading-copy text-ds-text-primary"
            >
              Open User Workspace
            </Link>
            <Link
              href="/admin"
              className="block w-full bg-ds-gold px-4 py-2 text-center text-sm font-medium leading-copy text-ds-bg"
            >
              Open Admin Panel
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
