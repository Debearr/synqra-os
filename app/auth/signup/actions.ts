"use server";

import { getSupabaseServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type AuthActionState = { error?: string; message?: string };

export async function signupAction(_prevState: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "").trim();

  if (!email || !password) return { error: "Email and password are required" };

  const supabase = getSupabaseServer();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || ''}/auth/callback`,
    },
  });

  if (error) return { error: error.message };

  return { message: "Check your email to confirm your account" };
}
