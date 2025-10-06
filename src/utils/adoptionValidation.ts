
export interface PetData {
  id: string;
  name: string;
  breed: string;
  type: string;
  image_url?: string;
  base_friendliness: number;
  base_playfulness: number;
  base_energy: number;
  base_loyalty: number;
  base_curiosity: number;
  birthday?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export const validatePetData = (pet: PetData): ValidationResult => {
  const errors: string[] = [];

  if (!pet.id) errors.push("Pet ID is missing");
  if (!pet.name?.trim()) errors.push("Pet name is missing");
  if (!pet.breed?.trim()) errors.push("Pet breed is missing");
  if (!pet.type?.trim()) errors.push("Pet type is missing");
  
  const petType = pet.type?.toLowerCase();
  if (petType !== 'dog' && petType !== 'cat') {
    errors.push(`Invalid pet type: ${pet.type}`);
  }

  // Validate stat ranges
  const stats = [
    { name: 'friendliness', value: pet.base_friendliness },
    { name: 'playfulness', value: pet.base_playfulness },
    { name: 'energy', value: pet.base_energy },
    { name: 'loyalty', value: pet.base_loyalty },
    { name: 'curiosity', value: pet.base_curiosity }
  ];

  stats.forEach(stat => {
    if (typeof stat.value !== 'number') {
      errors.push(`${stat.name} must be a number`);
    } else if (stat.value < -25 || stat.value > 100) {
      errors.push(`${stat.name} must be between -25 and 100`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateGender = (gender: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!gender?.trim()) {
    errors.push("Gender is required");
  } else {
    const normalizedGender = gender.toLowerCase();
    if (normalizedGender !== 'male' && normalizedGender !== 'female') {
      errors.push(`Invalid gender: ${gender}. Must be 'male' or 'female'`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};
