export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-ds-bg px-6 py-16 text-ds-text-primary">
      <div className="space-y-4 text-center">
        <h1 className="text-3xl font-medium">404</h1>
        <p className="text-sm text-ds-text-secondary">Page not found.</p>
        <a href="/" className="inline-block bg-ds-gold px-4 py-2 text-sm font-medium text-ds-bg">
          Go home
        </a>
      </div>
    </main>
  );
}
