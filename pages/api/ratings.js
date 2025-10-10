import { supabase } from "@/lib/supabase";

export default async function handler(_req, res) {
  const { data, error } = await supabase
    .from("visual_feedback")
    .select("created_at,rating")
    .order("created_at");

  if (error) return res.status(500).json({ error: error.message });
  res.status(200).json(data || []);
}