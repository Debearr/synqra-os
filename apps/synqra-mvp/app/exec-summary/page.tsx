import { redirect } from "next/navigation";
import { REDIRECT_PATHS } from "@/lib/redirects";

export default function ExecSummaryPage() {
  redirect(REDIRECT_PATHS.STUDIO);
}
