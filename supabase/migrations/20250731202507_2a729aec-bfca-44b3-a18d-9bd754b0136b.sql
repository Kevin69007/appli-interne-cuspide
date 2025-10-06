
-- Update pet #331 with unique randomized green stats, keeping loyalty and curiosity at 100
UPDATE user_pets 
SET 
  friendliness = 60 + floor(random() * 30),  -- Random between 60-89 (green range, under max)
  playfulness = 70 + floor(random() * 20),   -- Random between 70-89 (green range, under max) 
  energy = 65 + floor(random() * 25),        -- Random between 65-89 (green range, under max)
  loyalty = 100,                             -- Keep maxed
  curiosity = 100,                           -- Keep maxed
  extra_stats = jsonb_build_object(
    'duplicate_pattern', 'quad_duplicate',
    'friendliness_alt', 75 + floor(random() * 15),  -- Random between 75-89 (different from main)
    'playfulness_alt', 80 + floor(random() * 10),   -- Random between 80-89 (different from main)
    'energy_alt', 85 + floor(random() * 5),         -- Random between 85-89 (different from main)
    'loyalty_alt', 100                              -- Keep maxed
  )
WHERE pet_number = 331;

-- Verify the update shows green stats with no duplicates
SELECT pet_name, pet_number, friendliness, playfulness, energy, loyalty, curiosity, extra_stats 
FROM user_pets 
WHERE pet_number = 331;
