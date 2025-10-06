-- Update pet #106 to have both loyalty and energy duplicates
UPDATE public.user_pets 
SET extra_stats = jsonb_build_object(
  'is_odd_stat', true,
  'duplicate_pattern', 'loyalty_energy_duplicate',
  'loyalty_alt', 75,
  'energy_alt', 106
)
WHERE pet_number = 106;