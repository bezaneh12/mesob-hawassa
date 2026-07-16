import { supabase } from "../supabase";

export async function getNews() {
  const { data, error } = await supabase
    .from("news")
    .select("*")
    .eq("is_published", true)
    .order("published_at", { ascending: false });

  if (error) throw error;

  return data;
}