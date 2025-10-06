
export const generateRandomBreed = (mother: any, father: any): string => {
  // Get parent breeds - use the breed field from user_pets
  const motherBreed = mother?.breed || mother?.pets?.name || 'Mixed';
  const fatherBreed = father?.breed || father?.pets?.name || 'Mixed';
  
  console.log("🧬 Parent breeds for inheritance:", { motherBreed, fatherBreed });
  
  // For breeding, babies should inherit one of the parent breeds, not be "Mixed"
  // Randomly choose one parent's breed
  const inheritedBreed = Math.random() < 0.5 ? motherBreed : fatherBreed;
  
  console.log("🎯 Baby will inherit breed:", inheritedBreed);
  
  return inheritedBreed;
};

// New function to generate breed distribution for entire litter
export const generateLitterBreedDistribution = (mother: any, father: any, litterSize: number): string[] => {
  // Ensure litter size is within valid range (1-6)
  const clampedLitterSize = Math.max(1, Math.min(6, litterSize));
  
  const motherBreed = mother?.breed || mother?.pets?.name || 'Mixed';
  const fatherBreed = father?.breed || father?.pets?.name || 'Mixed';
  
  console.log("🧬 Generating breed distribution for litter:", { motherBreed, fatherBreed, litterSize: clampedLitterSize });
  
  // If parents have same breed, all babies will be that breed
  if (motherBreed === fatherBreed) {
    return Array(clampedLitterSize).fill(motherBreed);
  }
  
  const breedDistribution: string[] = [];
  
  // For litters of 1, randomly choose one parent
  if (clampedLitterSize === 1) {
    breedDistribution.push(Math.random() < 0.5 ? motherBreed : fatherBreed);
  }
  // For litters of 2+, ensure at least one of each parent breed
  else {
    // Add at least one of each parent breed
    breedDistribution.push(motherBreed);
    breedDistribution.push(fatherBreed);
    
    // Fill remaining slots randomly
    for (let i = 2; i < clampedLitterSize; i++) {
      breedDistribution.push(Math.random() < 0.5 ? motherBreed : fatherBreed);
    }
    
    // Shuffle the array to randomize the order
    for (let i = breedDistribution.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [breedDistribution[i], breedDistribution[j]] = [breedDistribution[j], breedDistribution[i]];
    }
  }
  
  console.log("🎯 Litter breed distribution:", breedDistribution);
  return breedDistribution;
};

// CRITICAL: Validate breed for gender - ABSOLUTE TORTIE ENFORCEMENT
export const validateBreedForGender = (breed: string, gender: string): string => {
  // MANDATORY: Tortoiseshell cats are genetically only female - NO EXCEPTIONS
  if (breed.toLowerCase() === 'tortie') {
    if (gender !== 'Female') {
      console.log(`🚨 ABSOLUTE GENETIC ENFORCEMENT: Converting ${gender} Tortie to Female (X-linked inheritance - scientifically required)`);
      return 'Female';
    }
  }
  
  return gender;
};

// CRITICAL: Generate genetically accurate gender for a breed - TORTIE SAFETY
export const generateGenderForBreed = (breed: string): string => {
  // ABSOLUTE RULE: Tortoiseshell cats are genetically only female due to X-linked coloration
  if (breed.toLowerCase() === 'tortie') {
    console.log("🧬 Tortie breed detected - MANDATORY Female gender (X-linked genetics - no male torties possible)");
    return 'Female';
  }
  
  // For all other breeds, random gender
  return Math.random() < 0.5 ? 'Male' : 'Female';
};

// NEW: Pre-generation breed-gender validation
export const preValidateBreedGender = (breed: string): string => {
  if (breed.toLowerCase() === 'tortie') {
    console.log(`🧬 PRE-VALIDATION: ${breed} detected - will generate as Female (genetic requirement)`);
    return 'Female';
  }
  
  // For other breeds, return random gender
  return Math.random() < 0.5 ? 'Male' : 'Female';
};

// NEW: Post-generation validation and correction
export const postValidateAndCorrectGender = (breed: string, gender: string, babyName: string = 'baby'): string => {
  if (breed.toLowerCase() === 'tortie' && gender !== 'Female') {
    console.error(`🚨 POST-VALIDATION CRITICAL ERROR: ${babyName} is a ${gender} ${breed} - CORRECTING to Female (genetic impossibility)`);
    return 'Female';
  }
  
  return gender;
};
