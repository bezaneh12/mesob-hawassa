import dotenv from "dotenv";

dotenv.config({ path: ".env.seed" });

import { createClient } from "@supabase/supabase-js";
import servicesData from "../src/data/services.js";

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Put the console.log AFTER the variables are declared
console.log("URL Loaded:", !!supabaseUrl);
console.log("Service Role Loaded:", !!serviceRoleKey);

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function seedDatabase() {
  console.log("===================================");
  console.log("MESOB DATABASE SEED");
  console.log("===================================");

  for (const institution of servicesData) {
    console.log(`\nInstitution: ${institution.title}`);

    /// Get all institutions once (move this outside the loop if you want to optimize later)
const { data: institutions, error } = await supabase
  .from("institutions")
  .select("id, name");

if (error) {
  console.error("Error loading institutions:", error);
  continue;
}

const dbInstitution = institutions.find(
  (i) =>
    i.name.trim().toLowerCase() ===
    institution.title.trim().toLowerCase()
);

if (!dbInstitution) {
  console.log(`❌ Institution not found: ${institution.title}`);
  continue;
}

    for (const service of institution.services) {

      // Check if service already exists
      const { data: existingService } = await supabase
        .from("services")
        .select("id")
        .eq("institution_id", dbInstitution.id)
        .eq("name", service.name)
        .maybeSingle();

      let serviceId;

      if (existingService) {
        serviceId = existingService.id;
        console.log(`↪ Service exists: ${service.name}`);
      } else {

        const { data: insertedService, error: serviceError } =
          await supabase
            .from("services")
            .insert({
              institution_id: dbInstitution.id,
              name: service.name
            })
            .select()
            .single();

        if (serviceError) {
          console.error(serviceError);
          continue;
        }

        serviceId = insertedService.id;

        console.log(`✓ Added Service: ${service.name}`);
      }

      let order = 1;

      for (const requirement of service.requirements) {

        // Skip duplicate requirements
        const { data: existingRequirement } = await supabase
          .from("service_requirements")
          .select("id")
          .eq("service_id", serviceId)
          .eq("requirement", requirement)
          .maybeSingle();

        if (existingRequirement) {
          order++;
          continue;
        }

        const { error: requirementError } =
          await supabase
            .from("service_requirements")
            .insert({
              service_id: serviceId,
              requirement,
              display_order: order
            });

        if (requirementError) {
          console.error(requirementError);
        }

        order++;
      }
    }
  }

  console.log("\n===================================");
  console.log("Database seeding completed!");
  console.log("===================================");
}

seedDatabase();