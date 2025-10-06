
-- Fix Oddie's database record to match his Golden Retriever breed
-- First, let's find Oddie's pet record
UPDATE pets 
SET 
  name = 'Golden Retriever',
  type = 'dog'
WHERE id IN (
  SELECT DISTINCT pet_id 
  FROM user_pets 
  WHERE pet_name = 'Oddie' 
    AND breed = 'Golden Retriever'
);

-- Verify the update worked by checking if there are any mismatched records
-- This query should return 0 rows after the fix
SELECT up.pet_name, up.breed, p.name as pet_type_name, p.type
FROM user_pets up
JOIN pets p ON up.pet_id = p.id
WHERE up.breed != p.name 
   OR (up.breed ILIKE '%cat%' AND p.type != 'cat')
   OR (up.breed NOT ILIKE '%cat%' AND p.type != 'dog');
