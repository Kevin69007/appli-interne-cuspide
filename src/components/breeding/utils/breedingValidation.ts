
import { validateBreedName, getValidParentBreed } from './breedValidation';

export const validateBabyData = (baby: any) => {
  const errors = [];
  
  if (!baby.pet_name || baby.pet_name.trim() === "") {
    errors.push("Pet name is required");
  }
  
  if (!baby.gender || !['male', 'female'].includes(baby.gender.toLowerCase())) {
    errors.push("Valid gender (male/female) is required");
  }
  
  if (!baby.breed || baby.breed.trim() === "") {
    errors.push("Breed is required");
  }
  
  // Strict breed validation - no mixed breeds allowed
  if (!validateBreedName(baby.breed)) {
    errors.push(`Invalid breed: ${baby.breed}. Mixed breeds, hybrids, and crosses are not allowed`);
  }
  
  // Validate stats are within reasonable ranges
  const statFields = ['friendliness', 'playfulness', 'energy', 'loyalty', 'curiosity'];
  for (const stat of statFields) {
    if (typeof baby[stat] !== 'number' || baby[stat] < 1 || baby[stat] > 100) {
      errors.push(`${stat} must be between 1 and 100`);
    }
  }
  
  return errors;
};

export const normalizeLitterSize = (size: number): number => {
  return Math.max(1, Math.min(6, Math.floor(size)));
};

export const validateBreedingPair = (breedingPair: any) => {
  if (!breedingPair) {
    throw new Error("No breeding pair provided");
  }

  if (!breedingPair.litter_size || breedingPair.litter_size < 1 || breedingPair.litter_size > 6) {
    throw new Error("Invalid litter size");
  }
};

export const validateParents = (mother: any, father: any) => {
  if (!mother || !father) {
    throw new Error("Missing parent data");
  }

  const motherBreed = getValidParentBreed(mother);
  const fatherBreed = getValidParentBreed(father);
  
  console.log("🧬 Validating parent breeds:", { 
    motherBreed, 
    fatherBreed,
    motherData: { 
      breed: mother.breed, 
      petsName: mother.pets?.name, 
      petName: mother.pet_name 
    },
    fatherData: { 
      breed: father.breed, 
      petsName: father.pets?.name, 
      petName: father.pet_name 
    }
  });
  
  if (!motherBreed || !fatherBreed) {
    console.error("❌ Missing or invalid parent breed information:", { motherBreed, fatherBreed });
    throw new Error("Missing or invalid parent breed information");
  }

  return { motherBreed, fatherBreed };
};
