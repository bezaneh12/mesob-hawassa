import { supabase } from "../supabase";

export async function getServiceInstitutions() {
  const { data, error } = await supabase
    .from("institutions")
    .select("id, name")
    .order("name");

  if (error) throw error;

  return data;
}

export async function getServicesByInstitution(institutionId) {
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("institution_id", institutionId)
    .order("name");

  if (error) throw error;

  return data;
}

export async function getRequirements(serviceId) {
  const { data, error } = await supabase
    .from("service_requirements")
    .select("*")
    .eq("service_id", serviceId)
    .order("display_order");

  if (error) throw error;

  return data;
}