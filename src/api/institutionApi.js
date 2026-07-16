import { supabase } from "../supabase";

export async function getInstitutions() {
  if (!supabase?.from) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("institutions")
      .select("*")
     
    if (error) {
      throw error;
    }

    return data ?? [];
  } catch (error) {
    console.error("Error loading institutions:", error);
    return [];
  }
}