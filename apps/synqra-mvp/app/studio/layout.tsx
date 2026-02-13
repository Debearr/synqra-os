import { cookies } from "next/headers";
import { redirect } from "next/navigation";

type StudioLayoutProps = {
  children: React.ReactNode;
};

function hasSupabaseSessionCookie(cookieStore: Awaited<ReturnType<typeof cookies>>): boolean {
  return cookieStore.getAll().some((cookie) => {
    if (!cookie.name.startsWith("sb-")) return false;
    if (!cookie.name.includes("-auth-token")) return false;
    return cookie.value.trim().length > 0;
  });
}

export default async function StudioLayout({ children }: StudioLayoutProps) {
  const cookieStore = await cookies();
  const hasSession = hasSupabaseSessionCookie(cookieStore);

  if (!hasSession) {
    redirect("/auth/sign-in?next=%2Fstudio");
  }

  return <>{children}</>;
}
