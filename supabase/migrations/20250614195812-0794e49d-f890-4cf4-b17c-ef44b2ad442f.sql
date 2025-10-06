
-- First, find the creation time of EtherealSnailfish with energy = -5
WITH original_persian AS (
  SELECT adopted_at 
  FROM user_pets 
  WHERE pet_name = 'EtherealSnailfish' AND breed = 'Persian' AND energy = -5
  LIMIT 1
)
-- Delete only Persian cats created after EtherealSnailfish
DELETE FROM user_pets 
WHERE breed = 'Persian' 
AND energy = -5
AND pet_name != 'EtherealSnailfish'
AND adopted_at > (SELECT adopted_at FROM original_persian);

-- Clean up any shelter entries for deleted Persian cats
DELETE FROM shelter_pets 
WHERE user_pet_id NOT IN (SELECT id FROM user_pets);

-- Clean up any pet sales for deleted Persian cats
UPDATE pet_sales 
SET is_active = false 
WHERE user_pet_id NOT IN (SELECT id FROM user_pets);
