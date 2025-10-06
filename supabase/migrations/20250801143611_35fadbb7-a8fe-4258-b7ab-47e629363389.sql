
-- Update Oddie's extra_stats to include alternate Energy and Curiosity values
UPDATE user_pets 
SET extra_stats = jsonb_build_object(
  'energy_alt', 72,
  'curiosity_alt', 29
)
WHERE pet_name = 'Oddie';
