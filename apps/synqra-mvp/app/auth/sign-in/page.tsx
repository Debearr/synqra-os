import Link from "next/link";
import EmailAuthForm from "@/components/auth/EmailAuthForm";
import { resolveSafeNextPath } from "@/lib/redirects";

type SignInPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function readSearchParam(
  params: Record<string, string | string[] | undefined>,
  key: string
): string | null {
  const value = params[key];
  if (typeof value === "string") return value;
  return Array.isArray(value) ? value[0] ?? null : null;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const nextPath = resolveSafeNextPath(readSearchParam(resolvedSearchParams, "next"));
  const initialEmail = readSearchParam(resolvedSearchParams, "email");
  const googleAuthPath = nextPath ? `/api/google/oauth/start?next=${encodeURIComponent(nextPath)}` : "/api/google/oauth/start";
  const signUpPath = nextPath ? `/auth/sign-up?next=${encodeURIComponent(nextPath)}` : "/auth/sign-up";

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
          href={googleAuthPath}
          className="block w-full bg-ds-gold px-4 py-2 text-center text-sm font-medium leading-copy text-ds-bg"
          data-testid="auth-google-link"
        >
          Continue with Google
        </a>
        <EmailAuthForm mode="sign-in" nextPath={nextPath} initialEmail={initialEmail} />
        <Link
          href={signUpPath}
          className="block w-full border border-ds-text-secondary/40 bg-ds-surface px-4 py-2 text-center text-sm font-medium leading-copy text-ds-text-primary"
          data-testid="auth-sign-up-link"
        >
          Need an account
        </Link>
      </div>
    </section>
  );
}
