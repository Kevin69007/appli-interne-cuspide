
-- Fix Oddie's pets table record to match Golden Retriever breed
UPDATE public.pets 
SET 
  name = 'Golden Retriever',
  type = 'dog'
WHERE id IN (
  SELECT DISTINCT pet_id 
  FROM user_pets 
  WHERE pet_name = 'Oddie' 
    AND breed = 'Golden Retriever'
);

-- Verify the fix worked by checking for any remaining mismatches
-- This query should return 0 rows after the fix
SELECT up.pet_name, up.breed, p.name as pet_type_name, p.type
FROM user_pets up
JOIN pets p ON up.pet_id = p.id
WHERE up.pet_name = 'Oddie' 
  AND (up.breed != p.name OR p.type != 'dog');
