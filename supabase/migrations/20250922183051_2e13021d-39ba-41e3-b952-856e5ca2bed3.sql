-- Update pet #1822 to max out extra stats and make non-duplicate stats green
UPDATE public.user_pets 
SET 
  friendliness = 75,
  playfulness = 80,
  extra_stats = jsonb_build_object(
    'is_odd_stat', true,
    'duplicate_pattern', 'energy_loyalty_curiosity_triple',
    'energy_alt', 100,
    'loyalty_alt', 100,
    'curiosity_alt', 100
  )
WHERE pet_number = 1822;