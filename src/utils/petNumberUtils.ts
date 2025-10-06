
// This utility is now deprecated since we use database-stored sequential numbers
// The pet number is now stored in the user_pets.pet_number column
// and assigned automatically via database triggers

export const calculatePetNumber = (pet: any) => {
  // Return the database-stored pet number, fallback to 1 if not set
  return pet?.pet_number || 1;
};
