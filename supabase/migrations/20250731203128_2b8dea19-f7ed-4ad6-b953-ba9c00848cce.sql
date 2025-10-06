
-- Update pet #331 to set first loyalty to 95
UPDATE user_pets 
SET loyalty = 95
WHERE pet_number = 331;

-- Verify the change
SELECT 
  pet_name, 
  pet_number,
  friendliness,
  loyalty,
  extra_stats->>'loyalty_alt' as loyalty_alt
FROM user_pets 
WHERE pet_number = 331;
