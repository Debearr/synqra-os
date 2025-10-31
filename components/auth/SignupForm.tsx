"use client";

import * as React from "react";
import { useFormState } from "react-dom";
import type { AuthActionState } from "@/app/auth/signup/actions";

type Props = {
  action: (state: AuthActionState, formData: FormData) => Promise<AuthActionState>;
};

export default function SignupForm({ action }: Props) {
  const [state, formAction] = useFormState<AuthActionState, FormData>(action, {} as AuthActionState);

  return (
    <form action={formAction} className="max-w-md w-full glassmorphism p-6 mx-auto">
      <h1 className="text-2xl font-bold gradient-gold text-center">Create account</h1>
      {state?.error ? (
        <div className="mt-3 text-sm text-red-400" role="alert">{state.error}</div>
      ) : null}
      {state?.message ? (
        <div className="mt-3 text-sm text-emerald-400" role="status">{state.message}</div>
      ) : null}

      <div className="mt-5 space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm mb-1">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full rounded-md bg-black/30 border border-white/10 px-3 py-2 outline-none focus:border-gold"
            placeholder="you@domain.com"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm mb-1">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="w-full rounded-md bg-black/30 border border-white/10 px-3 py-2 outline-none focus:border-gold"
            placeholder="••••••••"
          />
        </div>
        <button
          type="submit"
          className="w-full px-4 py-2 rounded-md border border-gold transition-transform duration-300 hover:glow-gold active:scale-95"
        >
          Sign up
        </button>
      </div>
    </form>
  );
}
