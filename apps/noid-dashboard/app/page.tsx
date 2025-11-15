import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const cookieStore = await cookies();
  const hasSession = Boolean(
    cookieStore.get("sb-access-token")?.value ||
      cookieStore.get("sb-refresh-token")?.value ||
      cookieStore.get("synqra-auth")?.value
  );

  if (hasSession) {
    redirect("/dashboard");
  }

  redirect("/landing");

  return null;
}
