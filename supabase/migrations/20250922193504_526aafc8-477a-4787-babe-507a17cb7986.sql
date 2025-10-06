-- Update pet #1822 to have all stats at 96% of maximum
-- Tortie breed max: Friendliness 45, Playfulness 55, Energy 85, Loyalty 70, Curiosity 95
-- 96% calculations: 43, 53, 82, 67, 91
UPDATE public.user_pets 
SET 
  friendliness = 43,
  playfulness = 53, 
  energy = 82,
  loyalty = 67,
  curiosity = 91,
  extra_stats = jsonb_build_object(
    'duplicate_pattern', 'energy_loyalty_curiosity_triple',
    'energy_alt', 82,
    'loyalty_alt', 67,
    'curiosity_alt', 91
  )
WHERE pet_number = 1822;