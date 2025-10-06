
import { getBreedStatConfig, enforceStatLimits } from "@/utils/breedStatConfig";

/**
 * Validates litter baby stats and fixes any over-stats
 * @param baby - The baby object with stats
 * @param motherBreed - Mother's breed for stat validation
 * @param fatherBreed - Father's breed for stat validation
 * @returns Baby object with corrected stats
 */
export const validateAndFixBabyStats = (baby: any, motherBreed: string, fatherBreed: string) => {
  console.log("🔍 Validating baby stats for:", baby.pet_name, "breed:", baby.breed);
  
  // Get breed configuration for the baby's breed
  const breedConfig = getBreedStatConfig(baby.breed);
  
  // Function to fix individual stat with strict enforcement
  const fixStat = (statValue: number, statName: string, min: number, max: number) => {
    if (statValue > max) {
      console.log(`⚠️ CRITICAL: Over-stat detected for ${statName}: ${statValue} > ${max}, fixing to max!`);
      return max; // Strictly enforce maximum
    }
    if (statValue < min) {
      console.log(`⚠️ Under-stat detected for ${statName}: ${statValue} < ${min}, fixing to min!`);
      return min; // Strictly enforce minimum
    }
    return statValue;
  };
  
  // Validate and fix each stat with strict limits
  const correctedBaby = {
    ...baby,
    friendliness: fixStat(baby.friendliness, 'friendliness', breedConfig.friendliness.min, breedConfig.friendliness.max),
    playfulness: fixStat(baby.playfulness, 'playfulness', breedConfig.playfulness.min, breedConfig.playfulness.max),
    energy: fixStat(baby.energy, 'energy', breedConfig.energy.min, breedConfig.energy.max),
    loyalty: fixStat(baby.loyalty, 'loyalty', breedConfig.loyalty.min, breedConfig.loyalty.max),
    curiosity: fixStat(baby.curiosity, 'curiosity', breedConfig.curiosity.min, breedConfig.curiosity.max)
  };
  
  // Double-check with enforce limits function
  const finalStats = enforceStatLimits(correctedBaby, baby.breed);
  const finalBaby = { ...correctedBaby, ...finalStats };
  
  console.log("✅ Baby stat validation complete for:", baby.pet_name, "Final stats:", finalStats);
  return finalBaby;
};

/**
 * Validates multiple babies and fixes any over-stats
 */
export const validateAndFixMultipleBabyStats = (babies: any[], motherBreed: string, fatherBreed: string) => {
  console.log("🔍 Validating stats for", babies.length, "babies with STRICT enforcement");
  
  return babies.map(baby => validateAndFixBabyStats(baby, motherBreed, fatherBreed));
};
