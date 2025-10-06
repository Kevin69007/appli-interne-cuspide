-- Update pet #1822 to have all stats green (within normal range)
-- Tortie breed range: Friendliness 15-45, Playfulness 25-55, Energy 30-85, Loyalty 20-70, Curiosity 50-95
UPDATE public.user_pets 
SET 
  friendliness = 30,
  playfulness = 40, 
  energy = 50,
  loyalty = 40,
  curiosity = 70,
  extra_stats = jsonb_build_object(
    'duplicate_pattern', 'energy_loyalty_curiosity_triple',
    'energy_alt', 60,
    'loyalty_alt', 50,
    'curiosity_alt', 80
  )
WHERE pet_number = 1822;