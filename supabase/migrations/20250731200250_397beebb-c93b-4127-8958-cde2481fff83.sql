
-- Update myla's record to have the loyalty_friendliness duplicate pattern
UPDATE user_pets 
SET extra_stats = jsonb_build_object(
  'duplicate_pattern', 'loyalty_friendliness',
  'friendliness_alt', 42,
  'loyalty_alt', 78
)
WHERE id = '9355767d-cdd8-4d5f-8737-88d6bc5ea0a1';

-- Verify the update
SELECT pet_name, friendliness, loyalty, is_odd_stat, extra_stats 
FROM user_pets 
WHERE id = '9355767d-cdd8-4d5f-8737-88d6bc5ea0a1';
