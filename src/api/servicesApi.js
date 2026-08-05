import { supabase } from "../supabase";

export async function getServiceInstitutions() {
  const { data, error } = await supabase
    .from("institutions")
    .select("id, name, logo_url")
    .order("name");

  if (error) throw error;

  return data;
}

export async function getServicesByInstitution(institutionId) {
  const { data, error } = await supabase
    .from("services")
    .select("id, institution_id, name, name_am, booking_link, created_at, updated_at")
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