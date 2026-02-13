export default function AdminIntegrationsPage() {
  return (
    <main className="min-h-screen bg-ds-bg text-ds-text-primary">
      <div className="mx-auto w-full max-w-journey space-y-6 px-6 py-12">
        <header className="space-y-4">
          <p className="text-sm leading-copy tracking-[0.12em] uppercase text-ds-text-secondary">Admin Panel</p>
          <h1 className="text-2xl font-medium leading-compact">Integrations</h1>
        </header>

        <section className="space-y-4 border border-ds-text-secondary/40 bg-ds-surface p-6">
          <p className="text-sm leading-copy text-ds-text-secondary">
            Integration management surface is reserved for admin and founder roles.
          </p>
        </section>
      </div>
    </main>
  );
}
