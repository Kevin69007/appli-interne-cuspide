
-- Phase 1: Fix Database Inconsistencies
-- Update Rue's pets table record to match her Husky breed
UPDATE public.pets 
SET 
  name = 'Husky',
  type = 'dog',
  image_url = '/lovable-uploads/c7d8a560-10db-4a52-ab91-8bc1bba67773.png'
WHERE id IN (
  SELECT DISTINCT pet_id 
  FROM user_pets 
  WHERE pet_name = 'Rue' 
    AND breed = 'Husky'
);

-- Update Myla's pets table record to match her Tuxedo Cat breed (if not already fixed)
UPDATE public.pets 
SET 
  name = 'Tuxedo Cat',
  type = 'cat',
  image_url = '/lovable-uploads/79e3d1c5-771a-4ac6-b1fc-cbb02accd8de.png'
WHERE id IN (
  SELECT DISTINCT pet_id 
  FROM user_pets 
  WHERE pet_name = 'Myla' 
    AND breed = 'Tuxedo Cat'
);

-- Phase 2: Normalize Pet Stats (Except Oddie)
-- Fix Rue's over stats to be within Husky breed ranges
-- Husky ranges: friendliness(35-80), playfulness(50-95), energy(55-100), loyalty(30-80), curiosity(40-90)
UPDATE public.user_pets 
SET 
  friendliness = LEAST(80, GREATEST(35, friendliness)),
  playfulness = LEAST(95, GREATEST(50, playfulness)),
  energy = LEAST(100, GREATEST(55, energy)),
  loyalty = LEAST(80, GREATEST(30, loyalty)),
  curiosity = LEAST(90, GREATEST(40, curiosity))
WHERE pet_name = 'Rue' 
  AND breed = 'Husky'
  AND pet_name != 'Oddie';

-- Fix Myla's stats to be within Tuxedo Cat breed ranges
-- Tuxedo Cat ranges: friendliness(25-80), playfulness(35-85), energy(30-80), loyalty(25-80), curiosity(45-95)
UPDATE public.user_pets 
SET 
  friendliness = LEAST(80, GREATEST(25, friendliness)),
  playfulness = LEAST(85, GREATEST(35, playfulness)),
  energy = LEAST(80, GREATEST(30, energy)),
  loyalty = LEAST(80, GREATEST(25, loyalty)),
  curiosity = LEAST(95, GREATEST(45, curiosity))
WHERE pet_name = 'Myla' 
  AND breed = 'Tuxedo Cat'
  AND pet_name != 'Oddie';

-- Fix Abbey's stats to be within German Shepherd breed ranges
-- German Shepherd ranges: friendliness(30-85), playfulness(20-75), energy(40-90), loyalty(50-95), curiosity(25-80)
UPDATE public.user_pets 
SET 
  friendliness = LEAST(85, GREATEST(30, friendliness)),
  playfulness = LEAST(75, GREATEST(20, playfulness)),
  energy = LEAST(90, GREATEST(40, energy)),
  loyalty = LEAST(95, GREATEST(50, loyalty)),
  curiosity = LEAST(80, GREATEST(25, curiosity))
WHERE pet_name = 'Abbey' 
  AND breed = 'German Shepherd'
  AND pet_name != 'Oddie';

-- Fix Persian kitty's stats to be within Persian breed ranges
-- Persian ranges: friendliness(20-80), playfulness(10-70), energy(10-60), loyalty(30-85), curiosity(25-80)
UPDATE public.user_pets 
SET 
  friendliness = LEAST(80, GREATEST(20, friendliness)),
  playfulness = LEAST(70, GREATEST(10, playfulness)),
  energy = LEAST(60, GREATEST(10, energy)),
  loyalty = LEAST(85, GREATEST(30, loyalty)),
  curiosity = LEAST(80, GREATEST(25, curiosity))
WHERE pet_name = 'Persian kitty' 
  AND breed = 'Persian'
  AND pet_name != 'Oddie';

-- Comprehensive fix for any other pets that might have stats outside their breed ranges (excluding Oddie)
UPDATE public.user_pets 
SET 
  friendliness = CASE 
    WHEN LOWER(breed) = 'german shepherd' THEN LEAST(85, GREATEST(30, friendliness))
    WHEN LOWER(breed) = 'golden retriever' THEN LEAST(95, GREATEST(50, friendliness))
    WHEN LOWER(breed) = 'husky' THEN LEAST(80, GREATEST(35, friendliness))
    WHEN LOWER(breed) = 'yellow lab' THEN LEAST(95, GREATEST(50, friendliness))
    WHEN LOWER(breed) = 'chihuahua' THEN LEAST(70, GREATEST(10, friendliness))
    WHEN LOWER(breed) = 'dalmatian' THEN LEAST(85, GREATEST(40, friendliness))
    WHEN LOWER(breed) = 'black cat' THEN LEAST(75, GREATEST(15, friendliness))
    WHEN LOWER(breed) = 'orange cat' THEN LEAST(85, GREATEST(30, friendliness))
    WHEN LOWER(breed) = 'persian' THEN LEAST(80, GREATEST(20, friendliness))
    WHEN LOWER(breed) = 'tuxedo cat' THEN LEAST(80, GREATEST(25, friendliness))
    ELSE friendliness
  END,
  playfulness = CASE 
    WHEN LOWER(breed) = 'german shepherd' THEN LEAST(75, GREATEST(20, playfulness))
    WHEN LOWER(breed) = 'golden retriever' THEN LEAST(90, GREATEST(45, playfulness))
    WHEN LOWER(breed) = 'husky' THEN LEAST(95, GREATEST(50, playfulness))
    WHEN LOWER(breed) = 'yellow lab' THEN LEAST(85, GREATEST(40, playfulness))
    WHEN LOWER(breed) = 'chihuahua' THEN LEAST(85, GREATEST(30, playfulness))
    WHEN LOWER(breed) = 'dalmatian' THEN LEAST(90, GREATEST(45, playfulness))
    WHEN LOWER(breed) = 'black cat' THEN LEAST(90, GREATEST(40, playfulness))
    WHEN LOWER(breed) = 'orange cat' THEN LEAST(90, GREATEST(45, playfulness))
    WHEN LOWER(breed) = 'persian' THEN LEAST(70, GREATEST(10, playfulness))
    WHEN LOWER(breed) = 'tuxedo cat' THEN LEAST(85, GREATEST(35, playfulness))
    ELSE playfulness
  END,
  energy = CASE 
    WHEN LOWER(breed) = 'german shepherd' THEN LEAST(90, GREATEST(40, energy))
    WHEN LOWER(breed) = 'golden retriever' THEN LEAST(85, GREATEST(35, energy))
    WHEN LOWER(breed) = 'husky' THEN LEAST(100, GREATEST(55, energy))
    WHEN LOWER(breed) = 'yellow lab' THEN LEAST(85, GREATEST(35, energy))
    WHEN LOWER(breed) = 'chihuahua' THEN LEAST(80, GREATEST(25, energy))
    WHEN LOWER(breed) = 'dalmatian' THEN LEAST(95, GREATEST(50, energy))
    WHEN LOWER(breed) = 'black cat' THEN LEAST(85, GREATEST(30, energy))
    WHEN LOWER(breed) = 'orange cat' THEN LEAST(85, GREATEST(35, energy))
    WHEN LOWER(breed) = 'persian' THEN LEAST(60, GREATEST(10, energy))
    WHEN LOWER(breed) = 'tuxedo cat' THEN LEAST(80, GREATEST(30, energy))
    ELSE energy
  END,
  loyalty = CASE 
    WHEN LOWER(breed) = 'german shepherd' THEN LEAST(95, GREATEST(50, loyalty))
    WHEN LOWER(breed) = 'golden retriever' THEN LEAST(90, GREATEST(45, loyalty))
    WHEN LOWER(breed) = 'husky' THEN LEAST(80, GREATEST(30, loyalty))
    WHEN LOWER(breed) = 'yellow lab' THEN LEAST(95, GREATEST(50, loyalty))
    WHEN LOWER(breed) = 'chihuahua' THEN LEAST(90, GREATEST(40, loyalty))
    WHEN LOWER(breed) = 'dalmatian' THEN LEAST(85, GREATEST(35, loyalty))
    WHEN LOWER(breed) = 'black cat' THEN LEAST(75, GREATEST(20, loyalty))
    WHEN LOWER(breed) = 'orange cat' THEN LEAST(80, GREATEST(25, loyalty))
    WHEN LOWER(breed) = 'persian' THEN LEAST(85, GREATEST(30, loyalty))
    WHEN LOWER(breed) = 'tuxedo cat' THEN LEAST(80, GREATEST(25, loyalty))
    ELSE loyalty
  END,
  curiosity = CASE 
    WHEN LOWER(breed) = 'german shepherd' THEN LEAST(80, GREATEST(25, curiosity))
    WHEN LOWER(breed) = 'golden retriever' THEN LEAST(80, GREATEST(30, curiosity))
    WHEN LOWER(breed) = 'husky' THEN LEAST(90, GREATEST(40, curiosity))
    WHEN LOWER(breed) = 'yellow lab' THEN LEAST(75, GREATEST(25, curiosity))
    WHEN LOWER(breed) = 'chihuahua' THEN LEAST(85, GREATEST(35, curiosity))
    WHEN LOWER(breed) = 'dalmatian' THEN LEAST(80, GREATEST(30, curiosity))
    WHEN LOWER(breed) = 'black cat' THEN LEAST(95, GREATEST(50, curiosity))
    WHEN LOWER(breed) = 'orange cat' THEN LEAST(90, GREATEST(40, curiosity))
    WHEN LOWER(breed) = 'persian' THEN LEAST(80, GREATEST(25, curiosity))
    WHEN LOWER(breed) = 'tuxedo cat' THEN LEAST(95, GREATEST(45, curiosity))
    ELSE curiosity
  END
WHERE pet_name != 'Oddie' -- Preserve Oddie's special stats
  AND breed IS NOT NULL 
  AND breed != '';

-- Verification query to check final state
SELECT 
  up.pet_name,
  up.breed,
  up.friendliness,
  up.playfulness,
  up.energy,
  up.loyalty,
  up.curiosity,
  p.name as pet_type_name,
  p.type as pet_type,
  p.image_url
FROM user_pets up
JOIN pets p ON up.pet_id = p.id
WHERE up.breed IS NOT NULL
ORDER BY up.pet_name;
