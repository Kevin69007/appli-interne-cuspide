
import { getBreedStatConfig } from "@/utils/breedStatConfig";

interface PetStats {
  friendliness: number;
  playfulness: number;
  energy: number;
  loyalty: number;
  curiosity: number;
}

/**
 * Validates that pet stats are within their breed's natural ranges
 * Returns true if stats are valid (within range or legitimately lost/negative)
 */
export const validatePetStats = (stats: PetStats, breed: string): boolean => {
  const breedConfig = getBreedStatConfig(breed);
  
  // Check each stat
  const statsToCheck = [
    { value: stats.friendliness, config: breedConfig.friendliness, name: 'friendliness' },
    { value: stats.playfulness, config: breedConfig.playfulness, name: 'playfulness' },
    { value: stats.energy, config: breedConfig.energy, name: 'energy' },
    { value: stats.loyalty, config: breedConfig.loyalty, name: 'loyalty' },
    { value: stats.curiosity, config: breedConfig.curiosity, name: 'curiosity' }
  ];
  
  for (const stat of statsToCheck) {
    // Allow negative values (lost stats) - these are legitimate special stats
    if (stat.value < 0) {
      continue;
    }
    
    // Check if positive stat exceeds breed maximum
    if (stat.value > stat.config.max) {
      console.warn(`${stat.name} stat ${stat.value} exceeds breed maximum ${stat.config.max} for ${breed}`);
      return false;
    }
    
    // Check if positive stat is below breed minimum (shouldn't happen with proper generation)
    if (stat.value < stat.config.min) {
      console.warn(`${stat.name} stat ${stat.value} below breed minimum ${stat.config.min} for ${breed}`);
      return false;
    }
  }
  
  return true;
};

/**
 * Corrects pet stats to be within breed ranges
 * Preserves negative stats (lost stats) as they are legitimate
 */
export const correctPetStats = (stats: PetStats, breed: string): PetStats => {
  const breedConfig = getBreedStatConfig(breed);
  
  const correctedStats: PetStats = {
    friendliness: stats.friendliness < 0 ? stats.friendliness : Math.min(stats.friendliness, breedConfig.friendliness.max),
    playfulness: stats.playfulness < 0 ? stats.playfulness : Math.min(stats.playfulness, breedConfig.playfulness.max),
    energy: stats.energy < 0 ? stats.energy : Math.min(stats.energy, breedConfig.energy.max),
    loyalty: stats.loyalty < 0 ? stats.loyalty : Math.min(stats.loyalty, breedConfig.loyalty.max),
    curiosity: stats.curiosity < 0 ? stats.curiosity : Math.min(stats.curiosity, breedConfig.curiosity.max)
  };
  
  // Log any corrections made
  if (JSON.stringify(stats) !== JSON.stringify(correctedStats)) {
    console.log(`Corrected stats for ${breed}:`, {
      original: stats,
      corrected: correctedStats
    });
  }
  
  return correctedStats;
};

/**
 * Gets the stat violations for a pet (stats that exceed breed ranges)
 */
export const getStatViolations = (stats: PetStats, breed: string): string[] => {
  const breedConfig = getBreedStatConfig(breed);
  const violations: string[] = [];
  
  const statsToCheck = [
    { value: stats.friendliness, config: breedConfig.friendliness, name: 'Friendliness' },
    { value: stats.playfulness, config: breedConfig.playfulness, name: 'Playfulness' },
    { value: stats.energy, config: breedConfig.energy, name: 'Energy' },
    { value: stats.loyalty, config: breedConfig.loyalty, name: 'Loyalty' },
    { value: stats.curiosity, config: breedConfig.curiosity, name: 'Curiosity' }
  ];
  
  for (const stat of statsToCheck) {
    // Skip negative stats (lost stats are legitimate)
    if (stat.value < 0) continue;
    
    if (stat.value > stat.config.max) {
      violations.push(`${stat.name}: ${stat.value} > ${stat.config.max} (max)`);
    }
  }
  
  return violations;
};
