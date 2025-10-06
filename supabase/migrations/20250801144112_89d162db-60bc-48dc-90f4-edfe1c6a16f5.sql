
-- Update Oddie's curiosity alternate value to 70
UPDATE user_pets 
SET extra_stats = jsonb_build_object(
  'energy_alt', 85,
  'curiosity_alt', 70
)
WHERE pet_name = '❀ oddie';
