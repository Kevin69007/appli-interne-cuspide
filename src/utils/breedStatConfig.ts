export interface BreedStatConfig {
  friendliness: { min: number; max: number };
  playfulness: { min: number; max: number };
  energy: { min: number; max: number };
  loyalty: { min: number; max: number };
  curiosity: { min: number; max: number };
}

export const generateStatInRange = (min: number, max: number): number => {
  const value = Math.floor(Math.random() * (max - min + 1)) + min;
  // Ensure we never exceed the maximum
  return Math.min(value, max);
};

export const getBreedStatConfig = (breed: string): BreedStatConfig => {
  const normalizedBreed = breed.toLowerCase().trim();
  
  switch (normalizedBreed) {
    case 'german shepherd':
      return {
        friendliness: { min: 30, max: 85 },
        playfulness: { min: 20, max: 75 },
        energy: { min: 40, max: 90 },
        loyalty: { min: 50, max: 95 },
        curiosity: { min: 25, max: 80 }
      };
    case 'golden retriever':
      return {
        friendliness: { min: 50, max: 95 },
        playfulness: { min: 45, max: 90 },
        energy: { min: 35, max: 85 },
        loyalty: { min: 45, max: 90 },
        curiosity: { min: 30, max: 80 }
      };
    case 'husky':
      return {
        friendliness: { min: 35, max: 80 },
        playfulness: { min: 50, max: 95 },
        energy: { min: 55, max: 100 },
        loyalty: { min: 30, max: 80 },
        curiosity: { min: 40, max: 90 }
      };
    case 'australian shepherd':
      return {
        friendliness: { min: 25, max: 80 },
        playfulness: { min: 45, max: 85 },
        energy: { min: 60, max: 95 },
        loyalty: { min: 40, max: 90 },
        curiosity: { min: 55, max: 95 }
      };
    case 'yellow lab':
      return {
        friendliness: { min: 50, max: 95 },
        playfulness: { min: 40, max: 85 },
        energy: { min: 35, max: 85 },
        loyalty: { min: 50, max: 95 },
        curiosity: { min: 25, max: 75 }
      };
    case 'chocolate lab':
      return {
        friendliness: { min: 45, max: 90 },
        playfulness: { min: 50, max: 95 },
        energy: { min: 40, max: 85 },
        loyalty: { min: 55, max: 95 },
        curiosity: { min: 35, max: 80 }
      };
    case 'chihuahua':
      return {
        friendliness: { min: 10, max: 70 },
        playfulness: { min: 30, max: 85 },
        energy: { min: 25, max: 80 },
        loyalty: { min: 40, max: 90 },
        curiosity: { min: 35, max: 85 }
      };
    case 'dalmatian':
      return {
        friendliness: { min: 40, max: 85 },
        playfulness: { min: 45, max: 90 },
        energy: { min: 50, max: 95 },
        loyalty: { min: 35, max: 85 },
        curiosity: { min: 30, max: 80 }
      };
    case 'westie':
      return {
        friendliness: { min: 45, max: 85 },
        playfulness: { min: 40, max: 90 },
        energy: { min: 35, max: 80 },
        loyalty: { min: 40, max: 85 },
        curiosity: { min: 50, max: 95 }
      };
    case 'black cat':
      return {
        friendliness: { min: 15, max: 75 },
        playfulness: { min: 40, max: 90 },
        energy: { min: 30, max: 85 },
        loyalty: { min: 20, max: 75 },
        curiosity: { min: 50, max: 95 }
      };
    case 'orange cat':
      return {
        friendliness: { min: 30, max: 85 },
        playfulness: { min: 45, max: 90 },
        energy: { min: 35, max: 85 },
        loyalty: { min: 25, max: 80 },
        curiosity: { min: 40, max: 90 }
      };
    case 'persian':
      return {
        friendliness: { min: 20, max: 80 },
        playfulness: { min: 10, max: 70 },
        energy: { min: 10, max: 60 },
        loyalty: { min: 30, max: 85 },
        curiosity: { min: 25, max: 80 }
      };
    case 'tuxedo cat':
      return {
        friendliness: { min: 25, max: 80 },
        playfulness: { min: 35, max: 85 },
        energy: { min: 30, max: 80 },
        loyalty: { min: 25, max: 80 },
        curiosity: { min: 45, max: 95 }
      };
    case 'tortie':
      return {
        friendliness: { min: 15, max: 65 },
        playfulness: { min: 25, max: 80 },
        energy: { min: 30, max: 85 },
        loyalty: { min: 20, max: 70 },
        curiosity: { min: 50, max: 95 }
      };
    case 'maine coon':
      return {
        friendliness: { min: 35, max: 85 },
        playfulness: { min: 30, max: 80 },
        energy: { min: 25, max: 75 },
        loyalty: { min: 40, max: 90 },
        curiosity: { min: 35, max: 85 }
      };
    case 'ragdoll':
      return {
        friendliness: { min: 45, max: 95 },
        playfulness: { min: 15, max: 70 },
        energy: { min: 20, max: 65 },
        loyalty: { min: 60, max: 100 },
        curiosity: { min: 25, max: 75 }
      };
    case 'himalayan persian':
      return {
        friendliness: { min: 15, max: 70 },
        playfulness: { min: 20, max: 65 },
        energy: { min: 10, max: 55 },
        loyalty: { min: 35, max: 85 },
        curiosity: { min: 40, max: 95 }
      };
    case 'pitbull':
      return {
        friendliness: { min: 25, max: 85 },
        playfulness: { min: 40, max: 90 },
        energy: { min: 45, max: 95 },
        loyalty: { min: 60, max: 100 },
        curiosity: { min: 35, max: 80 }
      };
    case 'cane corso':
      return {
        friendliness: { min: 25, max: 75 },
        playfulness: { min: 30, max: 70 },
        energy: { min: 40, max: 85 },
        loyalty: { min: 65, max: 95 },
        curiosity: { min: 35, max: 70 }
      };
    case 'scottish fold':
      return {
        friendliness: { min: 40, max: 85 },
        playfulness: { min: 25, max: 70 },
        energy: { min: 30, max: 75 },
        loyalty: { min: 50, max: 90 },
        curiosity: { min: 35, max: 80 }
      };
    default:
      // Default safe ranges for unknown breeds
      return {
        friendliness: { min: 20, max: 80 },
        playfulness: { min: 20, max: 80 },
        energy: { min: 20, max: 80 },
        loyalty: { min: 20, max: 80 },
        curiosity: { min: 20, max: 80 }
      };
  }
};

// New function to enforce stat limits strictly
export const enforceStatLimits = (stats: any, breed: string) => {
  const breedConfig = getBreedStatConfig(breed);
  
  return {
    friendliness: Math.min(Math.max(stats.friendliness, breedConfig.friendliness.min), breedConfig.friendliness.max),
    playfulness: Math.min(Math.max(stats.playfulness, breedConfig.playfulness.min), breedConfig.playfulness.max),
    energy: Math.min(Math.max(stats.energy, breedConfig.energy.min), breedConfig.energy.max),
    loyalty: Math.min(Math.max(stats.loyalty, breedConfig.loyalty.min), breedConfig.loyalty.max),
    curiosity: Math.min(Math.max(stats.curiosity, breedConfig.curiosity.min), breedConfig.curiosity.max)
  };
};
