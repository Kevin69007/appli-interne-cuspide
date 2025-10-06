
export const generateRandomName = (): string => {
  const names = [
    'Luna', 'Max', 'Bella', 'Charlie', 'Lucy', 'Cooper', 'Daisy', 
    'Milo', 'Sadie', 'Buddy', 'Sophie', 'Oscar', 'Zoe', 'Jack',
    'Chloe', 'Rocky', 'Lily', 'Duke', 'Molly', 'Bear'
  ];
  
  return names[Math.floor(Math.random() * names.length)];
};

export const generateRandomGender = (breed?: string): string => {
  // Tortoiseshell cats are genetically only female
  if (breed && breed.toLowerCase() === 'tortie') {
    return 'Female';
  }
  
  // For all other breeds, random gender
  return Math.random() < 0.5 ? 'Male' : 'Female';
};
