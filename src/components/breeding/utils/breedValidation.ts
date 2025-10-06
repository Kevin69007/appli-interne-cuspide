
// Breed validation utilities
export const validateBreedName = (breedName: string): boolean => {
  if (!breedName || typeof breedName !== 'string') {
    return false;
  }
  
  const cleanBreed = breedName.trim().toLowerCase();
  
  // Reject any breed containing "mixed", "mix", "cross", "hybrid"
  const invalidBreedPatterns = ['mixed', 'mix', 'cross', 'hybrid', 'unknown'];
  
  return !invalidBreedPatterns.some(pattern => cleanBreed.includes(pattern));
};

export const sanitizeBreedName = (breedName: string): string => {
  if (!breedName || typeof breedName !== 'string') {
    return '';
  }
  
  return breedName.trim();
};

export const getValidParentBreed = (parent: any): string | null => {
  // ALWAYS use user_pets.breed first as this is the correct breed field
  let breed = parent?.breed;
  
  // Only fallback to pets.name if breed is absolutely not available (which should be rare)
  if (!breed && parent?.pets?.name) {
    console.warn("⚠️ Using pets.name as fallback for breed - this should be investigated:", parent);
    breed = parent.pets.name;
  }
  
  if (!breed) {
    console.error("❌ No breed found for parent:", parent);
    return null;
  }
  
  const sanitizedBreed = sanitizeBreedName(breed);
  
  if (!validateBreedName(sanitizedBreed)) {
    console.error("❌ Invalid breed detected:", sanitizedBreed);
    return null;
  }
  
  console.log("✅ Valid parent breed found:", sanitizedBreed);
  return sanitizedBreed;
};

// Function to ensure breed consistency across the application
export const normalizeBreedName = (breedName: string): string => {
  if (!breedName) return '';
  
  // Convert to proper case: "german shepherd" -> "German Shepherd"
  return breedName
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Function to verify a pet's breed matches expected values
export const verifyPetBreed = (pet: any): { isValid: boolean; actualBreed: string; recommendedBreed: string } => {
  const actualBreed = pet?.breed || '';
  const petTypeBreed = pet?.pets?.name || '';
  
  console.log("🔍 Verifying pet breed:", {
    petId: pet?.id,
    petName: pet?.pet_name,
    userPetBreed: actualBreed,
    petTypeBreed: petTypeBreed
  });
  
  const normalizedActual = normalizeBreedName(actualBreed);
  const normalizedPetType = normalizeBreedName(petTypeBreed);
  
  // Check if there's a mismatch between user_pets.breed and pets.name
  const isValid = normalizedActual === normalizedPetType || !petTypeBreed;
  
  return {
    isValid,
    actualBreed: normalizedActual,
    recommendedBreed: normalizedPetType
  };
};
