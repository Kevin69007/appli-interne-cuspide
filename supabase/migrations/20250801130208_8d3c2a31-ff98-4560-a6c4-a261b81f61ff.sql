
-- Update Oddie to have different duplicate stat values
-- We'll keep the main stats but add different alternate values in extra_stats
UPDATE user_pets 
SET extra_stats = jsonb_build_object(
  'energy_alt', 72,
  'curiosity_alt', 29
)
WHERE pet_name = 'Oddie';

-- Verify the changes
SELECT 
  pet_name, 
  friendliness,
  playfulness,
  energy,
  loyalty,
  curiosity,
  extra_stats
FROM user_pets 
WHERE pet_name = 'Oddie';
