import Link from "next/link";

export default function SignUpPage() {
  return (
    <section className="w-full space-y-6 border border-ds-text-secondary/40 bg-ds-surface p-6">
      <div className="space-y-4">
        <p className="text-sm leading-copy tracking-[0.12em] uppercase text-ds-text-secondary">Authentication</p>
        <h1 className="text-2xl font-medium leading-compact">Sign up</h1>
        <p className="text-sm leading-copy text-ds-text-secondary">
          Create an account first, then continue into user workflow. Admin access is role-controlled.
        </p>
      </div>

      <div className="space-y-4">
        <Link
          href="/apply"
          className="block w-full bg-ds-gold px-4 py-2 text-center text-sm font-medium leading-copy text-ds-bg"
        >
          Join waitlist
        </Link>
        <Link
          href="/auth/sign-in"
          className="block w-full border border-ds-text-secondary/40 bg-ds-surface px-4 py-2 text-center text-sm font-medium leading-copy text-ds-text-primary"
        >
          Already have an account
        </Link>
      </div>
    </section>
  );
}
