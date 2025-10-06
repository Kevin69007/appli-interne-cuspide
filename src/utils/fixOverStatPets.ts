
import { supabase } from "@/integrations/supabase/client";
import { getBreedStatConfig, enforceStatLimits } from "./breedStatConfig";

export const fixAllOverStatPets = async () => {
  console.log("🔧 Starting comprehensive over-stat pet fix with STRICT enforcement...");
  
  try {
    // Get all pets from the database
    const { data: allPets, error: fetchError } = await supabase
      .from("user_pets")
      .select("*");
    
    if (fetchError) {
      console.error("❌ Error fetching pets:", fetchError);
      return { success: false, error: fetchError.message };
    }
    
    if (!allPets || allPets.length === 0) {
      console.log("✅ No pets found in database");
      return { success: true, message: "No pets to fix" };
    }
    
    console.log(`📊 Found ${allPets.length} pets to check`);
    
    const petsToFix = [];
    
    // Check each pet for over-stats with STRICT enforcement
    for (const pet of allPets) {
      if (!pet.breed) continue;
      
      const breedConfig = getBreedStatConfig(pet.breed);
      const violations = [];
      
      // Check each stat against breed limits (preserve negative stats as they are legitimate lost stats)
      if (pet.friendliness >= 0 && pet.friendliness > breedConfig.friendliness.max) {
        violations.push({ 
          stat: 'friendliness', 
          current: pet.friendliness, 
          max: breedConfig.friendliness.max 
        });
      }
      
      if (pet.playfulness >= 0 && pet.playfulness > breedConfig.playfulness.max) {
        violations.push({ 
          stat: 'playfulness', 
          current: pet.playfulness, 
          max: breedConfig.playfulness.max 
        });
      }
      
      if (pet.energy >= 0 && pet.energy > breedConfig.energy.max) {
        violations.push({ 
          stat: 'energy', 
          current: pet.energy, 
          max: breedConfig.energy.max 
        });
      }
      
      if (pet.loyalty >= 0 && pet.loyalty > breedConfig.loyalty.max) {
        violations.push({ 
          stat: 'loyalty', 
          current: pet.loyalty, 
          max: breedConfig.loyalty.max 
        });
      }
      
      if (pet.curiosity >= 0 && pet.curiosity > breedConfig.curiosity.max) {
        violations.push({ 
          stat: 'curiosity', 
          current: pet.curiosity, 
          max: breedConfig.curiosity.max 
        });
      }
      
      if (violations.length > 0) {
        petsToFix.push({
          pet,
          violations,
          breedConfig
        });
      }
    }
    
    console.log(`🚨 Found ${petsToFix.length} pets with over-stats that need STRICT fixing`);
    
    if (petsToFix.length === 0) {
      console.log("✅ No over-stat pets found - database is clean!");
      return { success: true, message: "No over-stat pets found" };
    }
    
    // Fix each pet with over-stats using STRICT enforcement
    let fixedCount = 0;
    
    for (const { pet, violations, breedConfig } of petsToFix) {
      console.log(`🔧 STRICTLY fixing pet: ${pet.pet_name} (${pet.breed}) - violations:`, violations);
      
      // Use enforceStatLimits for strict correction
      const correctedStats = enforceStatLimits({
        friendliness: pet.friendliness,
        playfulness: pet.playfulness,
        energy: pet.energy,
        loyalty: pet.loyalty,
        curiosity: pet.curiosity
      }, pet.breed);
      
      // Preserve negative stats (lost stats are legitimate)
      const updatedStats = {
        friendliness: pet.friendliness < 0 ? pet.friendliness : correctedStats.friendliness,
        playfulness: pet.playfulness < 0 ? pet.playfulness : correctedStats.playfulness,
        energy: pet.energy < 0 ? pet.energy : correctedStats.energy,
        loyalty: pet.loyalty < 0 ? pet.loyalty : correctedStats.loyalty,
        curiosity: pet.curiosity < 0 ? pet.curiosity : correctedStats.curiosity
      };
      
      const { error: updateError } = await supabase
        .from("user_pets")
        .update(updatedStats)
        .eq("id", pet.id);
      
      if (updateError) {
        console.error(`❌ Error fixing pet ${pet.pet_name}:`, updateError);
      } else {
        console.log(`✅ STRICTLY fixed pet: ${pet.pet_name} - stats corrected with enforcement`);
        fixedCount++;
      }
    }
    
    console.log(`🎉 Successfully STRICTLY fixed ${fixedCount} out of ${petsToFix.length} over-stat pets`);
    
    return { 
      success: true, 
      message: `Strictly fixed ${fixedCount} over-stat pets`,
      fixedCount,
      totalChecked: allPets.length
    };
    
  } catch (error: any) {
    console.error("❌ Error in fixAllOverStatPets:", error);
    return { success: false, error: error.message };
  }
};

export const fixOverStatBabies = async () => {
  console.log("🍼 Fixing over-stat babies in litter_babies table with STRICT enforcement...");
  
  try {
    // Get all babies
    const { data: allBabies, error: fetchError } = await supabase
      .from("litter_babies")
      .select("*");
    
    if (fetchError) {
      console.error("❌ Error fetching babies:", fetchError);
      return { success: false, error: fetchError.message };
    }
    
    if (!allBabies || allBabies.length === 0) {
      console.log("✅ No babies found in litter_babies table");
      return { success: true, message: "No babies to fix" };
    }
    
    console.log(`👶 Found ${allBabies.length} babies to check with STRICT enforcement`);
    
    const babiesToFix = [];
    
    // Check each baby for over-stats with breed-specific limits
    for (const baby of allBabies) {
      if (!baby.breed) continue;
      
      const breedConfig = getBreedStatConfig(baby.breed);
      const violations = [];
      
      if (baby.friendliness > breedConfig.friendliness.max) violations.push({ stat: 'friendliness', current: baby.friendliness, max: breedConfig.friendliness.max });
      if (baby.playfulness > breedConfig.playfulness.max) violations.push({ stat: 'playfulness', current: baby.playfulness, max: breedConfig.playfulness.max });
      if (baby.energy > breedConfig.energy.max) violations.push({ stat: 'energy', current: baby.energy, max: breedConfig.energy.max });
      if (baby.loyalty > breedConfig.loyalty.max) violations.push({ stat: 'loyalty', current: baby.loyalty, max: breedConfig.loyalty.max });
      if (baby.curiosity > breedConfig.curiosity.max) violations.push({ stat: 'curiosity', current: baby.curiosity, max: breedConfig.curiosity.max });
      
      if (violations.length > 0) {
        babiesToFix.push({ baby, violations, breedConfig });
      }
    }
    
    console.log(`🚨 Found ${babiesToFix.length} babies with over-stats that need STRICT fixing`);
    
    if (babiesToFix.length === 0) {
      console.log("✅ No over-stat babies found - litter database is clean!");
      return { success: true, message: "No over-stat babies found" };
    }
    
    // Fix each baby with over-stats using STRICT breed-specific enforcement
    let fixedBabiesCount = 0;
    
    for (const { baby, violations, breedConfig } of babiesToFix) {
      console.log(`🔧 STRICTLY fixing baby: ${baby.pet_name} (${baby.breed}) - violations:`, violations);
      
      // Use enforceStatLimits for strict breed-specific correction
      const correctedStats = enforceStatLimits({
        friendliness: baby.friendliness,
        playfulness: baby.playfulness,
        energy: baby.energy,
        loyalty: baby.loyalty,
        curiosity: baby.curiosity
      }, baby.breed);
      
      const { error: updateError } = await supabase
        .from("litter_babies")
        .update(correctedStats)
        .eq("id", baby.id);
      
      if (updateError) {
        console.error(`❌ Error fixing baby ${baby.pet_name}:`, updateError);
      } else {
        console.log(`✅ STRICTLY fixed baby: ${baby.pet_name} - stats enforced to breed limits`);
        fixedBabiesCount++;
      }
    }
    
    console.log(`🎉 Successfully STRICTLY fixed ${fixedBabiesCount} out of ${babiesToFix.length} over-stat babies`);
    
    return { 
      success: true, 
      message: `Strictly fixed ${fixedBabiesCount} over-stat babies`,
      fixedCount: fixedBabiesCount,
      totalChecked: allBabies.length
    };
    
  } catch (error: any) {
    console.error("❌ Error in fixOverStatBabies:", error);
    return { success: false, error: error.message };
  }
};
