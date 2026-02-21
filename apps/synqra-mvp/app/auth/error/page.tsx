import { redirect } from "next/navigation";
import { REDIRECT_PATHS } from "@/lib/redirects";

export default function AuthErrorPage() {
  redirect(REDIRECT_PATHS.AUTH_SIGN_IN);
}
