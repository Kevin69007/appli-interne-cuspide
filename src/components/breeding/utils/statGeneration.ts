
import { getBreedStatConfig, generateStatInRange, enforceStatLimits } from "@/utils/breedStatConfig";

export const generateBabyStats = (mother: any, father: any, babyBreed: string) => {
  console.log("🧬 Generating BOUNDED baby stats for breed:", babyBreed);
  
  const breedConfig = getBreedStatConfig(babyBreed);
  
  // Generate stats within breed bounds with parent influence
  const generateStat = (statName: keyof typeof breedConfig, motherStat: number, fatherStat: number) => {
    const config = breedConfig[statName];
    const parentAverage = (motherStat + fatherStat) / 2;
    
    // Add some randomness but stay within breed bounds
    const variation = Math.floor(Math.random() * 21) - 10; // -10 to +10
    let baseStat = Math.round(parentAverage + variation);
    
    // Enforce breed limits strictly
    baseStat = Math.max(config.min, Math.min(config.max, baseStat));
    
    console.log(`📊 ${statName}: parent avg ${parentAverage}, variation ${variation}, final ${baseStat} (bounds: ${config.min}-${config.max})`);
    return baseStat;
  };
  
  const stats = {
    friendliness: generateStat('friendliness', mother.friendliness, father.friendliness),
    playfulness: generateStat('playfulness', mother.playfulness, father.playfulness),
    energy: generateStat('energy', mother.energy, father.energy),
    loyalty: generateStat('loyalty', mother.loyalty, father.loyalty),
    curiosity: generateStat('curiosity', mother.curiosity, father.curiosity)
  };
  
  // Double-check with enforce limits to be absolutely sure
  const enforcedStats = enforceStatLimits(stats, babyBreed);
  
  console.log("✅ Final enforced baby stats:", enforcedStats);
  
  return enforcedStats;
};

export const generateAdultStats = (breed: string) => {
  console.log("🐕 Generating adult stats for breed:", breed);
  
  const breedConfig = getBreedStatConfig(breed);
  
  const stats = {
    friendliness: generateStatInRange(breedConfig.friendliness.min, breedConfig.friendliness.max),
    playfulness: generateStatInRange(breedConfig.playfulness.min, breedConfig.playfulness.max),
    energy: generateStatInRange(breedConfig.energy.min, breedConfig.energy.max),
    loyalty: generateStatInRange(breedConfig.loyalty.min, breedConfig.loyalty.max),
    curiosity: generateStatInRange(breedConfig.curiosity.min, breedConfig.curiosity.max)
  };
  
  // Double-check with enforce limits
  const enforcedStats = enforceStatLimits(stats, breed);
  
  console.log("✅ Final enforced adult stats:", enforcedStats);
  
  return enforcedStats;
};
