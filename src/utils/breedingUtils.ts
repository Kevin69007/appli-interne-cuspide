
import { supabase } from "@/integrations/supabase/client";

export const isPetActivelyBreeding = async (petId: string): Promise<boolean> => {
  try {
    const { data: breedingPairs, error } = await supabase
      .from("breeding_pairs")
      .select("id")
      .or(`parent1_id.eq.${petId},parent2_id.eq.${petId}`)
      .eq("is_completed", false);

    if (error) {
      console.error("Error checking breeding status:", error);
      return false;
    }

    return breedingPairs && breedingPairs.length > 0;
  } catch (error) {
    console.error("Error checking breeding status:", error);
    return false;
  }
};

export const getActiveBreeders = async (userId: string): Promise<string[]> => {
  try {
    const { data: breedingPairs, error } = await supabase
      .from("breeding_pairs")
      .select("parent1_id, parent2_id")
      .eq("user_id", userId)
      .eq("is_completed", false);

    if (error) {
      console.error("Error fetching active breeders:", error);
      return [];
    }

    const activeBreeders: string[] = [];
    breedingPairs?.forEach(pair => {
      activeBreeders.push(pair.parent1_id, pair.parent2_id);
    });

    return [...new Set(activeBreeders)]; // Remove duplicates
  } catch (error) {
    console.error("Error fetching active breeders:", error);
    return [];
  }
};

// ENHANCED: Validate that a pet's breed and gender combination is genetically valid
export const validateBreedGenderCombination = (breed: string, gender: string): boolean => {
  // Tortoiseshell cats are genetically only female due to X-linked inheritance
  if (breed.toLowerCase() === 'tortie' && gender === 'Male') {
    console.error(`❌ GENETIC VIOLATION: Male ${breed} is genetically impossible (requires two X chromosomes)`);
    return false;
  }
  
  return true;
};

// ENHANCED: Fix invalid breed-gender combinations
export const fixInvalidBreedGenderCombination = (breed: string, gender: string): string => {
  // Tortoiseshell cats must be female due to genetic requirements
  if (breed.toLowerCase() === 'tortie' && gender === 'Male') {
    console.log(`🔧 GENETIC CORRECTION: Converting genetically impossible Male Tortie to Female (X-linked inheritance requirement)`);
    return 'Female';
  }
  
  return gender;
};

// ENHANCED: Enforce genetic rules for any pet creation - STRICT TORTIE ENFORCEMENT (for breeding only)
export const enforceGeneticRules = (breed: string, gender: string): string => {
  // CRITICAL: For breeding, Tortoiseshell cats MUST be female - no exceptions
  // Male Torties can exist through adoption but cannot breed
  if (breed.toLowerCase() === 'tortie') {
    if (gender !== 'Female' && gender !== 'female') {
      console.error(`🚨 CRITICAL GENETIC ENFORCEMENT: ${breed} must be female for breeding! Converting ${gender} to Female`);
      return 'Female';
    }
    // Ensure consistent capitalization
    return 'Female';
  }
  
  return fixInvalidBreedGenderCombination(breed, gender);
}

// NEW: Check if a pet can breed based on breed and gender
export const canPetBreed = (breed: string, gender: string): boolean => {
  // Male Torties cannot breed (genetically impossible)
  if (breed.toLowerCase() === 'tortie' && (gender === 'Male' || gender === 'male')) {
    return false;
  }
  
  return true;
};

// NEW: Validate litter babies before database insertion
export const validateLitterBabies = (babies: any[]): any[] => {
  return babies.map(baby => {
    if (baby.breed && baby.breed.toLowerCase() === 'tortie') {
      const originalGender = baby.gender;
      baby.gender = 'Female'; // Force female for genetic accuracy
      
      if (originalGender !== 'Female') {
        console.log(`🧬 LITTER GENETIC CORRECTION: ${baby.pet_name} (${baby.breed}) gender corrected from ${originalGender} to Female`);
      }
    }
    return baby;
  });
};

// NEW: Final safety check for any pet data before database operations
export const performFinalGeneticValidation = (petData: any): any => {
  if (petData.breed && petData.breed.toLowerCase() === 'tortie') {
    const originalGender = petData.gender;
    
    // Normalize gender to proper format
    if (typeof petData.gender === 'string') {
      petData.gender = petData.gender.toLowerCase() === 'male' ? 'female' : 'female';
    }
    
    if (originalGender !== 'female' && originalGender !== 'Female') {
      console.error(`🚨 FINAL GENETIC VALIDATION: ${petData.pet_name || 'Tortie'} gender corrected from ${originalGender} to female`);
    }
  }
  
  return petData;
};
