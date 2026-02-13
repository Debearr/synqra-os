import Link from "next/link";

export default function SignInPage() {
  return (
    <section className="w-full space-y-6 border border-ds-text-secondary/40 bg-ds-surface p-6">
      <div className="space-y-4">
        <p className="text-sm leading-copy tracking-[0.12em] uppercase text-ds-text-secondary">Authentication</p>
        <h1 className="text-2xl font-medium leading-compact">Sign in</h1>
        <p className="text-sm leading-copy text-ds-text-secondary">
          Debear Ops should sign in with owner email to unlock both user and admin access.
        </p>
      </div>

      <div className="space-y-4">
        <a
          href="/api/google/oauth/start"
          className="block w-full bg-ds-gold px-4 py-2 text-center text-sm font-medium leading-copy text-ds-bg"
        >
          Continue with Google
        </a>
        <Link
          href="/auth/sign-up"
          className="block w-full border border-ds-text-secondary/40 bg-ds-surface px-4 py-2 text-center text-sm font-medium leading-copy text-ds-text-primary"
        >
          Need an account
        </Link>
      </div>
    </section>
  );
}
