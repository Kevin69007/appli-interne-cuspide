
import { supabase } from "@/integrations/supabase/client";
import { getBreedStatConfig, BreedStatConfig } from "./breedStatConfig";

export const fixPetStatsDirectly = async (petId: string) => {
  try {
    console.log('🔧 Starting direct pet stat fix for pet:', petId);
    
    // Get the pet data
    const { data: pet, error: fetchError } = await supabase
      .from("user_pets")
      .select("*")
      .eq("id", petId)
      .single();
    
    if (fetchError || !pet) {
      console.error("❌ Error fetching pet:", fetchError);
      return { success: false, error: "Pet not found" };
    }
    
    if (!pet.breed) {
      console.log("⚠️ Pet has no breed, skipping stat correction");
      return { success: true, message: "Pet has no breed to validate against" };
    }
    
    console.log('📊 Current pet stats in database:', {
      name: pet.pet_name,
      breed: pet.breed,
      friendliness: pet.friendliness,
      playfulness: pet.playfulness,
      energy: pet.energy,
      loyalty: pet.loyalty,
      curiosity: pet.curiosity
    });
    
    const breedConfig: BreedStatConfig = getBreedStatConfig(pet.breed);
    console.log('📋 Breed config for', pet.breed, ':', breedConfig);
    
    // Check which stats need correction (both over and under stats)
    const corrections: Record<string, number> = {};
    let needsCorrection = false;
    
    // Check each stat against breed limits
    const statsToCheck = [
      { name: 'friendliness', value: pet.friendliness, config: breedConfig.friendliness },
      { name: 'playfulness', value: pet.playfulness, config: breedConfig.playfulness },
      { name: 'energy', value: pet.energy, config: breedConfig.energy },
      { name: 'loyalty', value: pet.loyalty, config: breedConfig.loyalty },
      { name: 'curiosity', value: pet.curiosity, config: breedConfig.curiosity }
    ];
    
    for (const stat of statsToCheck) {
      if (stat.value >= 0) {
        if (stat.value > stat.config.max) {
          corrections[stat.name] = stat.config.max;
          needsCorrection = true;
          console.log(`🔧 Will correct ${stat.name} (over-stat): ${stat.value} → ${stat.config.max}`);
        } else if (stat.value < stat.config.min) {
          corrections[stat.name] = stat.config.min;
          needsCorrection = true;
          console.log(`🔧 Will correct ${stat.name} (under-stat): ${stat.value} → ${stat.config.min}`);
        } else {
          console.log(`✅ ${stat.name} is within range: ${stat.value} (${stat.config.min}-${stat.config.max})`);
        }
      }
    }
    
    if (!needsCorrection) {
      console.log("✅ Pet stats are already within breed limits");
      return { success: true, message: "Pet stats are already correct" };
    }
    
    // Apply corrections
    console.log('💾 Applying corrections to database:', corrections);
    const { error: updateError } = await supabase
      .from("user_pets")
      .update(corrections)
      .eq("id", petId);
    
    if (updateError) {
      console.error("❌ Error updating pet stats:", updateError);
      return { success: false, error: updateError.message };
    }
    
    console.log(`✅ Successfully corrected stats for ${pet.pet_name}`);
    return { 
      success: true, 
      message: `Fixed ${Object.keys(corrections).length} stats for ${pet.pet_name}`,
      corrections 
    };
    
  } catch (error: any) {
    console.error("❌ Error in fixPetStatsDirectly:", error);
    return { success: false, error: error.message };
  }
};

export const fixAllOverStatPetsForUser = async (userId: string) => {
  try {
    console.log('🔧 Starting fix for all out-of-range pets for user:', userId);
    
    // Get all pets for the user
    const { data: pets, error: fetchError } = await supabase
      .from("user_pets")
      .select("*")
      .eq("user_id", userId);
    
    if (fetchError) {
      console.error("❌ Error fetching user pets:", fetchError);
      return { success: false, error: fetchError.message };
    }
    
    if (!pets || pets.length === 0) {
      console.log("ℹ️ No pets found for user");
      return { success: true, message: "No pets found" };
    }
    
    console.log(`📊 Found ${pets.length} pets to check`);
    
    let fixedCount = 0;
    const results = [];
    
    for (const pet of pets) {
      const result = await fixPetStatsDirectly(pet.id);
      results.push({ petName: pet.pet_name, result });
      
      if (result.success && result.corrections) {
        fixedCount++;
      }
    }
    
    console.log(`🎉 Fixed ${fixedCount} pets out of ${pets.length} total pets`);
    
    return {
      success: true,
      message: `Fixed ${fixedCount} pets with out-of-range stats`,
      fixedCount,
      totalPets: pets.length,
      results
    };
    
  } catch (error: any) {
    console.error("❌ Error in fixAllOverStatPetsForUser:", error);
    return { success: false, error: error.message };
  }
};
