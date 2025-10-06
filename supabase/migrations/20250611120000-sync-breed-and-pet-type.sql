
-- Sync pet_type with breed field to ensure consistency
-- This will update the pets.name field to match the user_pets.breed field

-- Update pets table to ensure pet type matches the breed being used
UPDATE public.pets 
SET name = LOWER(user_pets.breed)
FROM public.user_pets 
WHERE pets.id = user_pets.pet_id 
AND user_pets.breed IS NOT NULL 
AND user_pets.breed != ''
AND LOWER(pets.name) != LOWER(user_pets.breed);

-- Also ensure the type field matches for consistency
UPDATE public.pets 
SET type = CASE 
  WHEN LOWER(user_pets.breed) LIKE '%cat%' THEN 'cat'::pet_type
  WHEN LOWER(user_pets.breed) LIKE '%dog%' THEN 'dog'::pet_type
  ELSE pets.type
END
FROM public.user_pets 
WHERE pets.id = user_pets.pet_id 
AND user_pets.breed IS NOT NULL 
AND user_pets.breed != '';

-- For debugging: Show pets that were updated
SELECT 
  up.pet_name,
  up.breed as user_breed,
  p.name as pet_name,
  p.type as pet_type
FROM user_pets up
JOIN pets p ON up.pet_id = p.id
ORDER BY up.pet_name;
