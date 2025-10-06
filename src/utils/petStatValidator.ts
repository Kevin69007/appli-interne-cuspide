
// Utility to validate and correct pet personality stats
// This ensures personality stats remain within acceptable bounds

export const validateAndCorrectPetStats = (pet: any) => {
  if (!pet) return pet;

  // Log original stats for debugging
  console.log(`🔍 VALIDATING STATS for ${pet.pet_name || pet.id}:`, {
    original: {
      friendliness: pet.friendliness,
      playfulness: pet.playfulness,
      energy: pet.energy,
      loyalty: pet.loyalty,
      curiosity: pet.curiosity
    }
  });

  // Validate each personality stat - they should be within reasonable bounds
  // For collected breeding babies, these should be between 20-80 typically
  // But we'll allow negative values for special pets (like those with negative traits)
  const validatedStats = {
    friendliness: validateSingleStat(pet.friendliness, 'friendliness'),
    playfulness: validateSingleStat(pet.playfulness, 'playfulness'),
    energy: validateSingleStat(pet.energy, 'energy'),
    loyalty: validateSingleStat(pet.loyalty, 'loyalty'),
    curiosity: validateSingleStat(pet.curiosity, 'curiosity')
  };

  // Check if any corrections were made
  const correctionsMade = 
    validatedStats.friendliness !== pet.friendliness ||
    validatedStats.playfulness !== pet.playfulness ||
    validatedStats.energy !== pet.energy ||
    validatedStats.loyalty !== pet.loyalty ||
    validatedStats.curiosity !== pet.curiosity;

  if (correctionsMade) {
    console.log(`⚠️ STAT CORRECTIONS MADE for ${pet.pet_name || pet.id}:`, {
      before: {
        friendliness: pet.friendliness,
        playfulness: pet.playfulness,
        energy: pet.energy,
        loyalty: pet.loyalty,
        curiosity: pet.curiosity
      },
      after: validatedStats
    });
  } else {
    console.log(`✅ STATS VALID for ${pet.pet_name || pet.id} - no corrections needed`);
  }

  return {
    ...pet,
    ...validatedStats
  };
};

const validateSingleStat = (value: any, statName: string): number => {
  // Convert to number if it's not already
  const numValue = typeof value === 'number' ? value : parseInt(value) || 0;
  
  // Allow negative values for special pets, but cap at reasonable extremes
  // Allow values from -100 to 100 to accommodate special pets
  const clampedValue = Math.max(-100, Math.min(100, numValue));
  
  if (clampedValue !== numValue) {
    console.log(`📏 CLAMPED ${statName}: ${numValue} -> ${clampedValue}`);
  }
  
  return clampedValue;
};
