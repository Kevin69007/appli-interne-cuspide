
-- Update Oddie's extra_stats with different alternate values based on current stats
UPDATE user_pets 
SET extra_stats = jsonb_build_object(
  'energy_alt', 72,
  'curiosity_alt', 29
)
WHERE pet_name = 'Oddie' AND pet_name = '❀ oddie';
