
import { validateBreedingPair, validateParents, validateBabyData, normalizeLitterSize } from "./utils/breedingValidation";
import { generateLitterBreedDistribution, validateBreedForGender, generateGenderForBreed, preValidateBreedGender, postValidateAndCorrectGender } from "./utils/breedInheritance";
import { generateBabyStats } from "./utils/statGeneration";
import { insertBabiesIntoDatabase, updateBreedingPairStatus } from "./utils/databaseOperations";
import { validateAndFixBabyStats } from "./utils/statValidation";
import { enforceStatLimits } from "@/utils/breedStatConfig";
import { validateLitterBabies, performFinalGeneticValidation } from "@/utils/breedingUtils";

export const generateLitterBabies = async (
  breedingPair: any, 
  mother: any, 
  father: any, 
  toast: (options: { title: string; description: string; variant?: "destructive" }) => void
) => {
  try {
    console.log("🍼 Starting ABSOLUTE GENETIC ACCURACY baby generation - ZERO TOLERANCE for male Torties");
    console.log("🍼 Parent data received:", { 
      mother: { name: mother?.pet_name, breed: mother?.breed, petsName: mother?.pets?.name },
      father: { name: father?.pet_name, breed: father?.breed, petsName: father?.pets?.name }
    });
    
    // Validate breeding pair
    try {
      validateBreedingPair(breedingPair);
    } catch (error) {
      console.error("❌ Breeding pair validation failed:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Invalid breeding pair",
        variant: "destructive",
      });
      throw error;
    }

    // Validate parents and get breeds
    let motherBreed: string, fatherBreed: string;
    try {
      const result = validateParents(mother, father);
      motherBreed = result.motherBreed;
      fatherBreed = result.fatherBreed;
    } catch (error) {
      console.error("❌ Parent validation failed:", error);
      toast({
        title: "Error", 
        description: error instanceof Error ? error.message : "Parent information is invalid",
        variant: "destructive",
      });
      throw error;
    }

    console.log("🧬 Validated parent breeds:", { motherBreed, fatherBreed });
    
    const babies = [];
    const normalizedLitterSize = normalizeLitterSize(breedingPair.litter_size);
    const litterSize = normalizedLitterSize;
    const birthDate = new Date().toISOString().split('T')[0]; // Today's date

    console.log(`🍼 Creating ${litterSize} babies with ABSOLUTE GENETIC ENFORCEMENT (NO male Torties under any circumstances)`);

    // Generate breed distribution for the entire litter
    const breedDistribution = generateLitterBreedDistribution(mother, father, litterSize);

    for (let i = 0; i < litterSize; i++) {
      // Use the pre-calculated breed distribution
      const babyBreed = breedDistribution[i];
      
      console.log(`🧬 Baby ${i + 1}: Breed=${babyBreed} - Starting genetic validation chain`);
      
      // MULTI-LAYER GENETIC ENFORCEMENT SYSTEM
      
      // LAYER 1: Pre-validation based on breed
      let babyGender = preValidateBreedGender(babyBreed);
      console.log(`🧬 Layer 1 - Pre-validation: ${babyBreed} -> ${babyGender}`);
      
      // LAYER 2: Standard gender generation with breed awareness
      babyGender = generateGenderForBreed(babyBreed);
      console.log(`🧬 Layer 2 - Generation: ${babyBreed} -> ${babyGender}`);
      
      // LAYER 3: Validation and correction
      babyGender = validateBreedForGender(babyBreed, babyGender);
      console.log(`🧬 Layer 3 - Validation: ${babyBreed} -> ${babyGender}`);
      
      // LAYER 4: Post-generation validation
      const babyName = `Baby ${i + 1}`;
      babyGender = postValidateAndCorrectGender(babyBreed, babyGender, babyName);
      console.log(`🧬 Layer 4 - Post-validation: ${babyName} (${babyBreed}) -> ${babyGender}`);
      
      // LAYER 5: FINAL SAFETY CHECK - ABSOLUTE GUARANTEE
      if (babyBreed.toLowerCase() === 'tortie' && babyGender !== 'Female') {
        console.error(`🚨 LAYER 5 CRITICAL SAFETY: ${babyName} is a ${babyGender} ${babyBreed} - FORCING TO FEMALE`);
        babyGender = 'Female';
      }
      
      console.log(`✅ FINAL RESULT: ${babyName} (${babyBreed}) -> ${babyGender} ${babyBreed === 'Tortie' ? '(GENETICALLY ENFORCED FEMALE)' : '(naturally assigned)'}`);
      
      // Generate stats with breed constraints
      const babyStats = generateBabyStats(mother, father, babyBreed);
      
      // Apply strict stat limits
      const strictlyEnforcedStats = enforceStatLimits(babyStats, babyBreed);
      
      const baby = {
        breeding_pair_id: breedingPair.id,
        pet_name: babyName,
        gender: babyGender, // Using multi-layer validated gender
        breed: babyBreed,
        parent1_breed: motherBreed,
        parent2_breed: fatherBreed,
        birthday: birthDate,
        // Use the strictly bounded stats
        friendliness: strictlyEnforcedStats.friendliness,
        playfulness: strictlyEnforcedStats.playfulness,
        energy: strictlyEnforcedStats.energy,
        loyalty: strictlyEnforcedStats.loyalty,
        curiosity: strictlyEnforcedStats.curiosity,
        description: `Born from ${mother.pet_name} and ${father.pet_name}`,
      };
      
      // Final validation
      const validatedBaby = validateAndFixBabyStats(baby, motherBreed, fatherBreed);
      
      // LAYER 6: FINAL GENETIC VALIDATION BEFORE ADDING TO ARRAY
      const finalValidatedBaby = performFinalGeneticValidation(validatedBaby);
      
      // Validate baby data before adding to array
      const validationErrors = validateBabyData(finalValidatedBaby);
      if (validationErrors.length > 0) {
        console.error(`❌ Baby ${i + 1} validation failed:`, validationErrors);
        throw new Error(`Baby validation failed: ${validationErrors.join(", ")}`);
      }
      
      console.log(`🍼 Generated GENETICALLY GUARANTEED baby ${i + 1}:`, {
        name: finalValidatedBaby.pet_name,
        gender: finalValidatedBaby.gender,
        breed: finalValidatedBaby.breed,
        geneticNote: finalValidatedBaby.breed === 'Tortie' ? 'FEMALE (X-linked genetics - ENFORCED)' : 'Naturally assigned gender',
        parentBreeds: { mother: motherBreed, father: fatherBreed },
        stats: {
          friendliness: finalValidatedBaby.friendliness,
          playfulness: finalValidatedBaby.playfulness,
          energy: finalValidatedBaby.energy,
          loyalty: finalValidatedBaby.loyalty,
          curiosity: finalValidatedBaby.curiosity
        }
      });
      
      babies.push(finalValidatedBaby);
    }

    // LAYER 7: PRE-DATABASE LITTER VALIDATION
    const geneticallyValidatedBabies = validateLitterBabies(babies);
    console.log(`🧬 LITTER VALIDATION COMPLETE: All ${geneticallyValidatedBabies.length} babies genetically validated`);

    // Insert babies into database
    let data;
    try {
      data = await insertBabiesIntoDatabase(geneticallyValidatedBabies);
    } catch (error) {
      toast({
        title: "Database Error",
        description: error instanceof Error ? error.message : "Failed to save babies",
        variant: "destructive",
      });
      throw error;
    }

    // Update breeding pair status and actual litter size
    await updateBreedingPairStatus(breedingPair.id, litterSize);

    // Count Torties for success message
    const tortieCount = geneticallyValidatedBabies.filter(baby => baby.breed === 'Tortie').length;
    const successMessage = tortieCount > 0 
      ? `${litterSize} babies have been born with genetic accuracy enforced! (${tortieCount} Tortie${tortieCount > 1 ? 's' : ''} guaranteed female)`
      : `${litterSize} babies have been born with genetic accuracy enforced!`;

    toast({
      title: "Babies Born!",
      description: successMessage,
    });

    return data;
  } catch (error) {
    console.error("❌ Baby generation failed:", error);
    
    // If we already showed a toast, don't show another one
    if (error instanceof Error && !error.message.includes("toast shown")) {
      let errorMessage = "Failed to generate babies. Please try again.";
      
      if (error.message.includes("validation failed")) {
        errorMessage = error.message;
      } else if (error.message.includes("Invalid litter size")) {
        errorMessage = "Invalid litter size. Please check your breeding configuration.";
      } else if (error.message.includes("Missing parent data")) {
        errorMessage = "Parent information is incomplete. Please try starting the breeding again.";
      } else if (error.message.includes("Invalid breed")) {
        errorMessage = "Parent breed information is invalid. Mixed breeds cannot be used for breeding.";
      }
      
      toast({
        title: "Generation Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
    
    throw error;
  }
};
