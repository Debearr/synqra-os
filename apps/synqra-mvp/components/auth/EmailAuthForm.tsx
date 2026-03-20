"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { createBrowserSupabaseClient } from "@/utils/supabase/client";

type EmailAuthFormMode = "sign-in" | "sign-up";

type EmailAuthFormProps = {
  mode: EmailAuthFormMode;
  nextPath: string | null;
  initialEmail?: string | null;
};

type PostLoginPayload = {
  redirectTo?: string;
};

const DEFAULT_REDIRECT_PATH = "/dashboard";

async function resolvePostLoginRedirect(nextPath: string | null): Promise<string> {
  const response = await fetch("/api/auth/post-login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ nextPath }),
  });

  if (!response.ok) {
    throw new Error("Unable to resolve post-login redirect.");
  }

  const payload = (await response.json()) as PostLoginPayload;
  return payload.redirectTo || nextPath || DEFAULT_REDIRECT_PATH;
}

export default function EmailAuthForm({ mode, nextPath, initialEmail = null }: EmailAuthFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSignIn = mode === "sign-in";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError("Email and password are required.");
      return;
    }

    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      setError("Supabase browser client is not configured.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setNotice(null);

    try {
      if (isSignIn) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });

        if (signInError) {
          throw signInError;
        }

        const redirectTo = await resolvePostLoginRedirect(nextPath);
        router.replace(redirectTo);
        router.refresh();
        return;
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
      });

      if (signUpError) {
        throw signUpError;
      }

      if (data.session) {
        const redirectTo = await resolvePostLoginRedirect(nextPath);
        router.replace(redirectTo);
        router.refresh();
        return;
      }

      setNotice("Account created. Confirm the email if required, then sign in.");
      setPassword("");
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Authentication failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit} data-testid={`auth-${mode}-form`}>
      <div className="space-y-2">
        <label htmlFor={`${mode}-email`} className="block text-sm font-medium leading-copy">
          Email
        </label>
        <input
          id={`${mode}-email`}
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="h-11 w-full border border-ds-text-secondary/40 bg-ds-bg px-3 text-sm text-ds-text-primary outline-none focus:border-ds-gold"
          data-testid={`auth-${mode}-email`}
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor={`${mode}-password`} className="block text-sm font-medium leading-copy">
          Password
        </label>
        <input
          id={`${mode}-password`}
          type="password"
          autoComplete={isSignIn ? "current-password" : "new-password"}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="h-11 w-full border border-ds-text-secondary/40 bg-ds-bg px-3 text-sm text-ds-text-primary outline-none focus:border-ds-gold"
          data-testid={`auth-${mode}-password`}
          disabled={isSubmitting}
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="block w-full bg-ds-gold px-4 py-2 text-center text-sm font-medium leading-copy text-ds-bg disabled:opacity-60"
        data-testid={`auth-${mode}-submit`}
      >
        {isSubmitting ? "Working..." : isSignIn ? "Sign in with email" : "Create account"}
      </button>

      {error ? (
        <p className="text-sm leading-copy text-ds-gold" data-testid={`auth-${mode}-error`}>
          {error}
        </p>
      ) : null}

      {notice ? (
        <p className="text-sm leading-copy text-ds-text-secondary" data-testid={`auth-${mode}-notice`}>
          {notice}
        </p>
      ) : null}
    </form>
  );
}
