
-- First, let's find pet #331
SELECT id, pet_name, pet_number, breed, friendliness, playfulness, energy, loyalty, curiosity, is_odd_stat, extra_stats
FROM user_pets 
WHERE pet_number = 331;

-- Update pet #331 to be an oddie with 4/5 stat duplicates
UPDATE user_pets 
SET 
  breed = 'Oddie',
  is_odd_stat = true,
  extra_stats = jsonb_build_object(
    'duplicate_pattern', 'quad_duplicate',
    'friendliness_alt', friendliness,
    'playfulness_alt', playfulness,
    'energy_alt', energy,
    'loyalty_alt', loyalty
  )
WHERE pet_number = 331;

-- Verify the update
SELECT pet_name, pet_number, breed, friendliness, playfulness, energy, loyalty, curiosity, is_odd_stat, extra_stats 
FROM user_pets 
WHERE pet_number = 331;
