import { supabase } from "../supabase";

export async function getInstitutions() {
  const { data, error } = await supabase
    .from("institutions")
    .select("id, name, name_am, logo_url")
    .order("name");

  if (error) {
    console.error("Error fetching institutions:", error);
    throw error;
  }

  return data || [];
}