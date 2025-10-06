
-- Update pet #331 with randomized stats but max loyalty and curiosity
UPDATE user_pets 
SET 
  friendliness = floor(random() * 81) + 20,  -- Random between 20-100
  playfulness = floor(random() * 81) + 20,   -- Random between 20-100  
  energy = floor(random() * 81) + 20,        -- Random between 20-100
  loyalty = 100,                             -- Max out loyalty
  curiosity = 100,                           -- Max out curiosity
  extra_stats = jsonb_build_object(
    'duplicate_pattern', 'quad_duplicate',
    'friendliness_alt', floor(random() * 81) + 20,
    'playfulness_alt', floor(random() * 81) + 20,
    'energy_alt', floor(random() * 81) + 20,
    'loyalty_alt', 100
  )
WHERE pet_number = 331;

-- Verify the update
SELECT pet_name, pet_number, friendliness, playfulness, energy, loyalty, curiosity, extra_stats 
FROM user_pets 
WHERE pet_number = 331;
