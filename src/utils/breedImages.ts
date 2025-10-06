import scottishFoldImage from "@/assets/breeds/scottish-fold.png";
import caneCorsoImage from "@/assets/breeds/cane-corso.png";

// Centralized breed image mapping - single source of truth
export const breedImages: { [key: string]: string } = {
  // Title Case versions (primary - matching database format)
  'Golden Retriever': '/lovable-uploads/be91ea6b-9c81-4143-9ec1-88705a2377ce.png',
  'Husky': '/lovable-uploads/6be7a6d2-4269-4560-8e56-7eb6c06d53b4.png',
  'Dalmatian': '/lovable-uploads/a19bb6fb-465f-4536-9745-07b4dcdcfecd.png',
  'German Shepherd': '/lovable-uploads/f2cbae41-63be-4ee3-ae23-685142170757.png',
  'Australian Shepherd': '/lovable-uploads/333f1fdb-13e6-485e-8a0e-6dad151504ba.png',
  'Chihuahua': '/lovable-uploads/5d038c83-68b1-47db-8b50-b2d9ebe2c47a.png',
  'Yellow Lab': '/lovable-uploads/fce6b88e-d185-4459-b378-8ed4e047ad27.png',
  'Chocolate Lab': '/lovable-uploads/c45d4cdc-5ea0-4896-93a0-c4b54f1be8ea.png',
  'Westie': '/lovable-uploads/1c74aefd-4cbe-4471-bebc-e81eed80ec8a.png',
  'Black Cat': '/lovable-uploads/7524e539-8910-48d3-8027-226706ad2733.png',
  'Orange Cat': '/lovable-uploads/e05c5791-9a42-4fb2-81fd-013c72068d96.png',
  'Persian': '/lovable-uploads/e4e7b3b6-3937-4a18-863f-937cd7567115.png',
  'Tuxedo Cat': '/lovable-uploads/5131f1e9-29a6-4c85-b2ed-6c50e7c17a93.png',
  'Tortie': '/lovable-uploads/5ec7d24d-8cf2-4138-a602-28b0caeca5b2.png',
  'Maine Coon': '/lovable-uploads/3566cd91-349e-403d-ae5f-7fac861502ae.png',
  'Ragdoll': '/lovable-uploads/aeb6095a-e937-4f00-978c-e49d5274ac12.png',
  'Himalayan Persian': '/lovable-uploads/8edb05c1-1ae8-4f00-98fc-cd66092e4b0f.png',
  'Pitbull': '/lovable-uploads/3f4384a3-8fce-45da-9fc0-af72d98280b0.png',
  'Cane Corso': caneCorsoImage,
  'Scottish Fold': scottishFoldImage,
  
  // Lowercase versions (fallback)
  'golden retriever': '/lovable-uploads/be91ea6b-9c81-4143-9ec1-88705a2377ce.png',
  'husky': '/lovable-uploads/6be7a6d2-4269-4560-8e56-7eb6c06d53b4.png',
  'dalmatian': '/lovable-uploads/a19bb6fb-465f-4536-9745-07b4dcdcfecd.png',
  'german shepherd': '/lovable-uploads/f2cbae41-63be-4ee3-ae23-685142170757.png',
  'australian shepherd': '/lovable-uploads/333f1fdb-13e6-485e-8a0e-6dad151504ba.png',
  'chihuahua': '/lovable-uploads/5d038c83-68b1-47db-8b50-b2d9ebe2c47a.png',
  'yellow lab': '/lovable-uploads/fce6b88e-d185-4459-b378-8ed4e047ad27.png',
  'chocolate lab': '/lovable-uploads/c45d4cdc-5ea0-4896-93a0-c4b54f1be8ea.png',
  'labrador': '/lovable-uploads/fce6b88e-d185-4459-b378-8ed4e047ad27.png',
  'westie': '/lovable-uploads/1c74aefd-4cbe-4471-bebc-e81eed80ec8a.png',
  'west highland white terrier': '/lovable-uploads/1c74aefd-4cbe-4471-bebc-e81eed80ec8a.png',
  'black cat': '/lovable-uploads/7524e539-8910-48d3-8027-226706ad2733.png',
  'orange cat': '/lovable-uploads/e05c5791-9a42-4fb2-81fd-013c72068d96.png',
  'persian': '/lovable-uploads/e4e7b3b6-3937-4a18-863f-937cd7567115.png',
  'persian cat': '/lovable-uploads/e4e7b3b6-3937-4a18-863f-937cd7567115.png',
  'tuxedo cat': '/lovable-uploads/5131f1e9-29a6-4c85-b2ed-6c50e7c17a93.png',
  'tortie': '/lovable-uploads/5ec7d24d-8cf2-4138-a602-28b0caeca5b2.png',
  'tortoiseshell': '/lovable-uploads/5ec7d24d-8cf2-4138-a602-28b0caeca5b2.png',
  'maine coon': '/lovable-uploads/3566cd91-349e-403d-ae5f-7fac861502ae.png',
  'ragdoll': '/lovable-uploads/aeb6095a-e937-4f00-978c-e49d5274ac12.png',
  'himalayan persian': '/lovable-uploads/8edb05c1-1ae8-4f00-98fc-cd66092e4b0f.png',
  'pitbull': '/lovable-uploads/3f4384a3-8fce-45da-9fc0-af72d98280b0.png',
  'cane corso': caneCorsoImage,
  'scottish fold': scottishFoldImage,
};

// Enhanced breed image lookup with comprehensive fallback logic
export const getBreedImage = (breed: string): string => {
  if (!breed) {
    return '/placeholder.svg';
  }
  
  // Try exact match first (handles Title Case from database)
  if (breedImages[breed]) {
    return breedImages[breed];
  }
  
  // Try lowercase normalized match
  const normalizedBreed = breed.toLowerCase().trim();
  if (breedImages[normalizedBreed]) {
    return breedImages[normalizedBreed];
  }
  
  // Try Title Case conversion as fallback
  const titleCaseBreed = breed
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
    
  if (breedImages[titleCaseBreed]) {
    return breedImages[titleCaseBreed];
  }
  
  // Try partial matching for compound breeds
  const breedWords = breed.toLowerCase().split(' ');
  for (const word of breedWords) {
    if (breedImages[word]) {
      return breedImages[word];
    }
  }
  
  // Final fallback to placeholder for any unmapped breeds
  return '/placeholder.svg';
};

// Get all available breeds
export const getAllBreeds = (): string[] => {
  return Object.keys(breedImages);
};

// Updated breed lists - only breeds with actual uploaded icons
export const dogBreeds = ['German Shepherd', 'Golden Retriever', 'Husky', 'Australian Shepherd', 'Yellow Lab', 'Chocolate Lab', 'Chihuahua', 'Dalmatian', 'Westie', 'Pitbull', 'Cane Corso'];
export const catBreeds = ['Black Cat', 'Orange Cat', 'Persian', 'Tuxedo Cat', 'Tortie', 'Maine Coon', 'Ragdoll', 'Himalayan Persian', 'Scottish Fold'];

// Breeds that can only be female (due to genetics) - keeping for backward compatibility
export const femaleOnlyBreeds = ['Tortie'];

// Special male breeds that are rare and expensive
export const rareMaleBreeds = ['Tortie', 'Tortoiseshell'];

// Function to check if a breed can only be a specific gender
export const getAvailableGenders = (breed: string): string[] => {
  // Tortie now allows both genders (rare male variant available)
  return ['male', 'female'];
};

// Function to check if a male of this breed is rare and expensive
export const isMaleRareBreed = (breed: string, gender: string): boolean => {
  const normalize = (s?: string) => (s ?? '').toLowerCase().trim();
  const b = normalize(breed);
  const g = normalize(gender);
  const isTortie = b.includes('tortie');
  return isTortie && g === 'male';
};

// Function to get the cost for adopting a pet based on breed and gender
export const getAdoptionCost = (breed: string, gender: string, isFirstPet: boolean): number => {
  if (isFirstPet) return 0; // First pet is always free
  
  if (isMaleRareBreed(breed, gender)) {
    return 10000; // Male Torties cost 10k
  }
  
  return 150; // Regular adoption cost
};
