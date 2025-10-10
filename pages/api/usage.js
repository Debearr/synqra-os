import { supabase } from "@/lib/supabase";

export default async function handler(_req, res) {
  const { data, error } = await supabase
    .from("credit_usage")
    .select("created_at,total_spent_usd")
    .order("created_at");

  if (error) return res.status(500).json({ error: error.message });
  res.status(200).json(data || []);
}