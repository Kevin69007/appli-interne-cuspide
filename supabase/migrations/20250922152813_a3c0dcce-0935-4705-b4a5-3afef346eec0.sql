-- Update the specific user pet #106 to have the extra energy stat
UPDATE public.user_pets 
SET extra_stats = jsonb_build_object(
  'is_odd_stat', true,
  'duplicate_pattern', 'energy_duplicate',
  'energy_alt', 106
)
WHERE pet_number = 106;