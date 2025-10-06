-- Update pet #1822 to have exactly one duplicate of each stat, all green but not over max
-- Tortie breed max: Energy 85, Loyalty 70, Curiosity 95
UPDATE public.user_pets 
SET 
  extra_stats = jsonb_build_object(
    'duplicate_pattern', 'energy_loyalty_curiosity_triple',
    'energy_alt', 82,
    'loyalty_alt', 68,
    'curiosity_alt', 92
  )
WHERE pet_number = 1822;