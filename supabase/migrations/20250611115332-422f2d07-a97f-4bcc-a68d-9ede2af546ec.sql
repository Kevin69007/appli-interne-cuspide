
-- Comprehensive breed and pet type synchronization with all case variations
-- This migration ensures all breeds are correctly mapped to their pet types

-- First, update pets table to sync with user_pets breed field (preserve original case)
UPDATE public.pets 
SET name = user_pets.breed
FROM public.user_pets 
WHERE pets.id = user_pets.pet_id 
AND user_pets.breed IS NOT NULL 
AND user_pets.breed != ''
AND pets.name != user_pets.breed;

-- Map ALL case variations of dog breeds to correct pet type
UPDATE public.pets 
SET type = 'dog'::pet_type
WHERE LOWER(name) IN (
  -- German Shepherd variations
  'german shepherd', 'German Shepherd', 'GERMAN SHEPHERD',
  -- Golden Retriever variations  
  'golden retriever', 'Golden Retriever', 'GOLDEN RETRIEVER',
  -- Husky variations
  'husky', 'Husky', 'HUSKY',
  -- Yellow Lab variations
  'yellow lab', 'Yellow Lab', 'YELLOW LAB',
  'labrador', 'Labrador', 'LABRADOR',
  -- Chihuahua variations
  'chihuahua', 'Chihuahua', 'CHIHUAHUA',
  -- Dalmatian variations (note: fixing spelling)
  'dalmatian', 'Dalmatian', 'DALMATIAN',
  'dalmation', 'Dalmation', 'DALMATION',
  -- Generic dog
  'dog', 'Dog', 'DOG'
);

-- Map ALL case variations of cat breeds to correct pet type
UPDATE public.pets 
SET type = 'cat'::pet_type
WHERE LOWER(name) IN (
  -- Black Cat variations
  'black cat', 'Black Cat', 'BLACK CAT',
  -- Orange Cat variations
  'orange cat', 'Orange Cat', 'ORANGE CAT',
  -- Persian variations
  'persian', 'Persian', 'PERSIAN',
  'persian cat', 'Persian Cat', 'PERSIAN CAT',
  -- Tuxedo Cat variations
  'tuxedo cat', 'Tuxedo Cat', 'TUXEDO CAT',
  -- Generic cat
  'cat', 'Cat', 'CAT'
);

-- Update any remaining pets using case-insensitive pattern matching
UPDATE public.pets 
SET type = 'dog'::pet_type
WHERE type != 'dog'::pet_type 
AND (
  LOWER(name) LIKE '%german%shepherd%' OR
  LOWER(name) LIKE '%golden%retriever%' OR
  LOWER(name) LIKE '%husky%' OR
  LOWER(name) LIKE '%yellow%lab%' OR
  LOWER(name) LIKE '%labrador%' OR
  LOWER(name) LIKE '%chihuahua%' OR
  LOWER(name) LIKE '%dalmat%'
);

UPDATE public.pets 
SET type = 'cat'::pet_type
WHERE type != 'cat'::pet_type 
AND (
  LOWER(name) LIKE '%black%cat%' OR
  LOWER(name) LIKE '%orange%cat%' OR
  LOWER(name) LIKE '%persian%' OR
  LOWER(name) LIKE '%tuxedo%cat%'
);

-- Show final state for verification
SELECT DISTINCT 
  p.name as pet_breed,
  p.type as pet_type,
  COUNT(*) as count
FROM pets p
JOIN user_pets up ON p.id = up.pet_id
GROUP BY p.name, p.type
ORDER BY p.type, p.name;
