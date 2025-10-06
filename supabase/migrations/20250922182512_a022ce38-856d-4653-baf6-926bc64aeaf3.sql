-- Make pet #1822 an odd stat pet with duplicates in the last 3 stats (Energy, Loyalty, Curiosity)
UPDATE public.user_pets 
SET extra_stats = jsonb_build_object(
  'is_odd_stat', true,
  'duplicate_pattern', 'energy_loyalty_curiosity_triple',
  'energy_alt', 42,
  'loyalty_alt', 88,
  'curiosity_alt', 31
)
WHERE pet_number = 1822;