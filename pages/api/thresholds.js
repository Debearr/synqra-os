import { supabase } from "@/lib/supabase";

export default async function handler(_req, res) {
  const { data, error } = await supabase
    .from("leonardo_thresholds")
    .select("updated_at,min_word_threshold")
    .order("updated_at");

  if (error) return res.status(500).json({ error: error.message });
  res.status(200).json(data || []);
}