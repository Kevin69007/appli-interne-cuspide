
import { supabase } from "@/integrations/supabase/client";
import { validateBreedName } from "./breedValidation";

export const insertBabiesIntoDatabase = async (babies: any[]) => {
  console.log("🍼 Attempting to insert", babies.length, "babies into database...");

  // Final validation before database insertion
  for (const baby of babies) {
    if (!validateBreedName(baby.breed)) {
      console.error("❌ Attempted to insert baby with invalid breed:", baby.breed);
      throw new Error(`Invalid breed detected before database insertion: ${baby.breed}. Mixed breeds are not allowed.`);
    }
  }

  const { data, error } = await supabase
    .from("litter_babies")
    .insert(babies)
    .select();

  if (error) {
    console.error("❌ Database insertion error:", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    });
    
    let errorMessage = "Failed to save babies to database.";
    
    if (error.message.includes("gender_check")) {
      errorMessage = "Invalid gender data. Please try again.";
    } else if (error.message.includes("breed_check") || error.message.includes("mixed")) {
      errorMessage = "Invalid breed data. Mixed breeds are not allowed.";
    } else if (error.message.includes("foreign key")) {
      errorMessage = "Database relationship error. Please check parent pet data.";
    } else if (error.message.includes("unique constraint")) {
      errorMessage = "Duplicate baby data detected. Please try again.";
    } else if (error.message.includes("permission")) {
      errorMessage = "Permission denied. Please make sure you're logged in.";
    } else if (error.message.includes("network")) {
      errorMessage = "Network error. Please check your connection and try again.";
    }
    
    throw new Error(errorMessage);
  }

  if (!data || data.length === 0) {
    console.error("❌ No data returned from insertion");
    throw new Error("No babies were created");
  }

  console.log("✅ Successfully inserted", data.length, "babies into database");
  return data;
};

export const updateBreedingPairStatus = async (breedingPairId: string, actualLitterSize?: number) => {
  const updateData: any = { is_born: true };
  if (actualLitterSize !== undefined) {
    updateData.litter_size = actualLitterSize;
  }

  const { error: updateError } = await supabase
    .from("breeding_pairs")
    .update(updateData)
    .eq("id", breedingPairId);

  if (updateError) {
    console.error("❌ Error updating breeding pair:", updateError);
    console.warn("⚠️ Breeding pair update failed but babies were created");
  } else {
    console.log("✅ Successfully updated breeding pair status", actualLitterSize ? `with actual litter size: ${actualLitterSize}` : '');
  }
};
