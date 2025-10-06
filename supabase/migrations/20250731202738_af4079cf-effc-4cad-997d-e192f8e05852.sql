
-- Update pet #331 to adjust loyalty alt and friendliness
UPDATE user_pets 
SET 
  friendliness = 65,  -- Bump to green range (60+)
  extra_stats = jsonb_set(
    extra_stats,
    '{loyalty_alt}',
    to_jsonb(95)
  )
WHERE pet_number = 331;

-- Verify the changes
SELECT 
  pet_name, 
  pet_number,
  friendliness,
  loyalty,
  extra_stats->>'loyalty_alt' as loyalty_alt
FROM user_pets 
WHERE pet_number = 331;
