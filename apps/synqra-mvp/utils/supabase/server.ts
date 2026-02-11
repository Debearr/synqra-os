import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

function getRequiredEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? (fallback ? process.env[fallback] : undefined);
  if (!value) {
    throw new Error(`Missing Supabase environment variable: ${name}${fallback ? ` or ${fallback}` : ""}`);
  }
  return value;
}

export async function createClient() {
  const cookieStore = await cookies();
  const supabaseUrl = getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL");
  const supabaseAnonKey = getRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_ANON_KEY");

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }: { name: string; value: string; options: CookieOptions }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called from a context where cookies are read-only.
        }
      },
    },
  });
}
