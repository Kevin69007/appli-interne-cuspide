
-- Update Oddie's extra_stats with clearly different alternate values using the correct pet name
UPDATE user_pets 
SET extra_stats = jsonb_build_object(
  'energy_alt', 85,
  'curiosity_alt', 15
)
WHERE pet_name = '❀ oddie';
