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
  const hasGateAccess = cookieStore.get("synqra_gate")?.value === "1";
  const hasSession = hasSupabaseSessionCookie(cookieStore);

  if (!hasGateAccess && !hasSession) {
    redirect("/enter");
  }

  return <>{children}</>;
}
