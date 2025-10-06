-- Update pet #1822 to have all stats green but under minimums (no overs)
-- Tortie breed mins: Friendliness 15, Playfulness 25, Energy 30, Loyalty 20, Curiosity 50
UPDATE public.user_pets 
SET 
  friendliness = 12,
  playfulness = 22, 
  energy = 27,
  loyalty = 17,
  curiosity = 47,
  extra_stats = jsonb_build_object(
    'duplicate_pattern', 'energy_loyalty_curiosity_triple',
    'energy_alt', 25,
    'loyalty_alt', 15,
    'curiosity_alt', 45
  )
WHERE pet_number = 1822;