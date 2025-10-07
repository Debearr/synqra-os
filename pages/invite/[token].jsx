import { getSupabaseAdmin } from "../../lib/supabaseClient.js";

export async function getServerSideProps(ctx) {
  const token = ctx.params.token;
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from("invites")
      .select("used, expires_at")
      .eq("token", token)
      .single();

    const expired = !data || data.used || new Date(data.expires_at) < new Date();
    const destination = expired ? "/invite/invalid" : `/signup?invite=${encodeURIComponent(token)}`;
    return { redirect: { destination, permanent: false } };
  } catch {
    return { redirect: { destination: "/invite/invalid", permanent: false } };
  }
}

export default function InviteRedirect() {
  return null;
}
