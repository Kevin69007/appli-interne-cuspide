
// Natural stat generation utility using bell curve distributions
export const generateNaturalStat = (min: number, max: number): number => {
  // Use Box-Muller transform for true bell curve distribution
  const u1 = Math.random();
  const u2 = Math.random();
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  
  // Center around breed midpoint
  const center = (min + max) / 2;
  
  // Standard deviation is ~30% of the range for more natural variation
  const range = max - min;
  const standardDeviation = range * 0.3;
  
  // Generate value using normal distribution
  let value = Math.round(center + (z0 * standardDeviation));
  
  // STRICTLY enforce min/max bounds - no exceptions
  value = Math.max(min, Math.min(max, value));
  
  return value;
};

// Generate stats for breeding inheritance
export const generateInheritedStat = (
  motherStat: number, 
  fatherStat: number, 
  min: number, 
  max: number
): number => {
  // Parent average as base
  const parentAverage = (motherStat + fatherStat) / 2;
  
  // Natural variation around parent average
  const u1 = Math.random();
  const u2 = Math.random();
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  
  // Smaller variation for inheritance (20% of range)
  const range = max - min;
  const standardDeviation = range * 0.2;
  
  let value = Math.round(parentAverage + (z0 * standardDeviation));
  
  // STRICTLY enforce min/max bounds
  value = Math.max(min, Math.min(max, value));
  
  return value;
};

// Generate lost stat with much milder negative values
export const generateLostStat = (): number => {
  const random = Math.random();
  
  // Much milder lost stat system - most should be -10 or better
  if (random < 0.8) {
    // 80% chance: very mild lost stats (-1 to -5)
    return Math.floor(Math.random() * 5) * -1 - 1;
  } else if (random < 0.95) {
    // 15% chance: mild lost stats (-6 to -10)
    return Math.floor(Math.random() * 5) * -1 - 6;
  } else if (random < 0.99) {
    // 4% chance: moderate lost stats (-11 to -15)
    return Math.floor(Math.random() * 5) * -1 - 11;
  } else {
    // 1% chance: rare severe lost stats (-16 to -20)
    return Math.floor(Math.random() * 5) * -1 - 16;
  }
};

// Balanced probability system for pet-level special stats (0.01% chance for single lost stat)
export const shouldPetHaveSpecialStats = (): { hasSpecialStats: boolean; specialStatCount: number } => {
  const random = Math.random();
  
  // Balanced - 0.01% chance for exactly 1 lost stat (1 in 10,000)
  if (random < 0.0001) {
    return { hasSpecialStats: true, specialStatCount: 1 };
  }
  
  return { hasSpecialStats: false, specialStatCount: 0 };
};

// Generate stat types for a pet with special stats (only one lost stat maximum)
export const generateStatTypesForPet = (specialStatCount: number): ('normal' | 'lost')[] => {
  const statTypes: ('normal' | 'lost')[] = ['normal', 'normal', 'normal', 'normal', 'normal'];
  
  if (specialStatCount === 0) return statTypes;
  
  // Only allow exactly 1 lost stat - randomly select which one
  if (specialStatCount === 1) {
    const randomIndex = Math.floor(Math.random() * 5);
    statTypes[randomIndex] = 'lost';
  }
  
  return statTypes;
};

// Generate a complete set of stats for a pet with proper breed constraints
export const generatePetStatsWithBreedConfig = (breedConfig: {
  friendliness: { min: number; max: number };
  playfulness: { min: number; max: number };
  energy: { min: number; max: number };
  loyalty: { min: number; max: number };
  curiosity: { min: number; max: number };
}): {
  friendliness: number;
  playfulness: number;
  energy: number;
  loyalty: number;
  curiosity: number;
  isLostStat: boolean;
} => {
  const { hasSpecialStats, specialStatCount } = shouldPetHaveSpecialStats();
  const statTypes = generateStatTypesForPet(specialStatCount);
  
  const isLostStat = statTypes.includes('lost');
  
  return {
    friendliness: statTypes[0] === 'lost' ? generateLostStat() : generateNaturalStat(breedConfig.friendliness.min, breedConfig.friendliness.max),
    playfulness: statTypes[1] === 'lost' ? generateLostStat() : generateNaturalStat(breedConfig.playfulness.min, breedConfig.playfulness.max),
    energy: statTypes[2] === 'lost' ? generateLostStat() : generateNaturalStat(breedConfig.energy.min, breedConfig.energy.max),
    loyalty: statTypes[3] === 'lost' ? generateLostStat() : generateNaturalStat(breedConfig.loyalty.min, breedConfig.loyalty.max),
    curiosity: statTypes[4] === 'lost' ? generateLostStat() : generateNaturalStat(breedConfig.curiosity.min, breedConfig.curiosity.max),
    isLostStat
  };
};

// Validate that generated stats are within acceptable ranges
export const validatePetStats = (
  stats: { friendliness: number; playfulness: number; energy: number; loyalty: number; curiosity: number },
  breed: string
): boolean => {
  // Allow lost stats (negative values) but with new milder limits
  const values = [stats.friendliness, stats.playfulness, stats.energy, stats.loyalty, stats.curiosity];
  const hasLostStats = values.some(v => v < 0);
  
  if (hasLostStats) {
    // For pets with lost stats, ensure they're reasonable negative values (not worse than -20)
    return values.every(v => v >= -20);
  }
  
  // For normal pets, ensure stats are positive
  return values.every(v => v >= 0 && v <= 100);
};

// Correct invalid stats while preserving lost stat nature
export const correctPetStats = (
  stats: { friendliness: number; playfulness: number; energy: number; loyalty: number; curiosity: number },
  breed: string
): { friendliness: number; playfulness: number; energy: number; loyalty: number; curiosity: number } => {
  return {
    friendliness: stats.friendliness < -20 ? -20 : stats.friendliness,
    playfulness: stats.playfulness < -20 ? -20 : stats.playfulness,
    energy: stats.energy < -20 ? -20 : stats.energy,
    loyalty: stats.loyalty < -20 ? -20 : stats.loyalty,
    curiosity: stats.curiosity < -20 ? -20 : stats.curiosity
  };
};
