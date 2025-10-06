-- Update pet #1822 to keep the existing triple pattern but add more loyalty duplicates
UPDATE public.user_pets 
SET 
  extra_stats = jsonb_build_object(
    'duplicate_pattern', 'energy_loyalty_curiosity_triple',
    'energy_alt', 42,
    'loyalty_alt', 92,
    'loyalty_alt2', 95,
    'curiosity_alt', 31
  )
WHERE pet_number = 1822;