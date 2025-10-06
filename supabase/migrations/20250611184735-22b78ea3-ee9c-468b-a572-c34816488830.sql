
-- Comprehensive fix to ensure all pets show consistent breed-specific images
-- Step 1: Sync all pets.name fields with user_pets.breed (the source of truth)
UPDATE public.pets 
SET name = user_pets.breed
FROM public.user_pets 
WHERE pets.id = user_pets.pet_id 
AND user_pets.breed IS NOT NULL 
AND user_pets.breed != ''
AND pets.name != user_pets.breed;

-- Step 2: Update pets.type to match the correct animal type based on breed
UPDATE public.pets 
SET type = CASE 
  WHEN LOWER(user_pets.breed) LIKE '%cat%' OR 
       LOWER(user_pets.breed) IN ('persian', 'tuxedo cat', 'black cat', 'orange cat') THEN 'cat'::pet_type
  WHEN LOWER(user_pets.breed) LIKE '%dog%' OR 
       LOWER(user_pets.breed) IN ('german shepherd', 'golden retriever', 'husky', 'yellow lab', 'labrador', 'chihuahua', 'dalmatian') THEN 'dog'::pet_type
  ELSE pets.type -- Keep existing type if breed doesn't match known patterns
END
FROM public.user_pets 
WHERE pets.id = user_pets.pet_id 
AND user_pets.breed IS NOT NULL 
AND user_pets.breed != '';

-- Step 3: Remove the conflicting image_url column from pets table since we use breed-based lookup
ALTER TABLE public.pets DROP COLUMN IF EXISTS image_url;

-- Verification: Show current state after fixes
SELECT 
  up.pet_name,
  up.breed as user_breed,
  p.name as pet_name,
  p.type as pet_type,
  CASE 
    WHEN up.breed != p.name THEN 'BREED_MISMATCH'
    WHEN LOWER(up.breed) LIKE '%cat%' AND p.type != 'cat' THEN 'TYPE_MISMATCH'
    WHEN LOWER(up.breed) LIKE '%dog%' AND p.type != 'dog' THEN 'TYPE_MISMATCH'
    ELSE 'OK'
  END as status
FROM user_pets up
JOIN pets p ON up.pet_id = p.id
WHERE up.breed IS NOT NULL
ORDER BY up.pet_name;
