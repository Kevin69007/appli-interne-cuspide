
-- First, let's check Oddie's current state
SELECT 
  up.pet_name,
  up.breed,
  up.user_id,
  p.name as pet_type_name,
  p.type as pet_type
FROM user_pets up
JOIN pets p ON up.pet_id = p.id
WHERE up.pet_name = 'Oddie';

-- Fix Oddie's breed to be exactly 'Golden Retriever' (not Tuxedo Cat)
UPDATE public.user_pets 
SET breed = 'Golden Retriever'
WHERE pet_name = 'Oddie' 
  AND breed != 'Golden Retriever';

-- Ensure Oddie's pets table record matches Golden Retriever
UPDATE public.pets 
SET 
  name = 'Golden Retriever',
  type = 'dog'
WHERE id IN (
  SELECT DISTINCT pet_id 
  FROM user_pets 
  WHERE pet_name = 'Oddie'
);

-- Final verification - this should show Oddie with Golden Retriever breed
SELECT 
  up.pet_name,
  up.breed,
  p.name as pet_type_name,
  p.type as pet_type,
  CASE 
    WHEN up.breed = 'Golden Retriever' AND p.name = 'Golden Retriever' AND p.type = 'dog' THEN 'CORRECT'
    ELSE 'NEEDS_FIX'
  END as status
FROM user_pets up
JOIN pets p ON up.pet_id = p.id
WHERE up.pet_name = 'Oddie';
