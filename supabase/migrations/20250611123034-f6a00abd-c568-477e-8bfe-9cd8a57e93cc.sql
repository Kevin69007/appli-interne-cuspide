
-- Comprehensive fix for all breed/type/display issues
-- Step 1: Fix Myla's record back to correct Tuxedo Cat
UPDATE public.user_pets 
SET breed = 'Tuxedo Cat'
WHERE pet_name = 'Myla' AND breed != 'Tuxedo Cat';

-- Step 2: Fix Oddie's record to correct Golden Retriever
UPDATE public.user_pets 
SET breed = 'Golden Retriever'
WHERE pet_name = 'Oddie' AND breed != 'Golden Retriever';

-- Step 3: Ensure ALL pets table records match user_pets.breed exactly
UPDATE public.pets 
SET 
  name = user_pets.breed,
  type = CASE 
    WHEN LOWER(user_pets.breed) LIKE '%cat%' OR 
         LOWER(user_pets.breed) IN ('persian', 'tuxedo cat', 'black cat', 'orange cat') THEN 'cat'::pet_type
    WHEN LOWER(user_pets.breed) LIKE '%dog%' OR 
         LOWER(user_pets.breed) IN ('german shepherd', 'golden retriever', 'husky', 'yellow lab', 'labrador', 'chihuahua', 'dalmatian') THEN 'dog'::pet_type
    ELSE pets.type -- Keep existing type if breed doesn't match known patterns
  END
FROM public.user_pets 
WHERE pets.id = user_pets.pet_id 
AND user_pets.breed IS NOT NULL 
AND user_pets.breed != ''
AND (pets.name != user_pets.breed OR 
     (LOWER(user_pets.breed) LIKE '%cat%' AND pets.type != 'cat'::pet_type) OR
     (LOWER(user_pets.breed) LIKE '%dog%' AND pets.type != 'dog'::pet_type));

-- Verification: Show final state
SELECT 
  up.pet_name,
  up.breed as user_breed,
  p.name as pet_type_name,
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
