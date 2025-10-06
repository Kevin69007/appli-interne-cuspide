-- Update pet #1822 to make loyalty green and add duplicate loyalty pattern
UPDATE public.user_pets 
SET 
  loyalty = 88,
  extra_stats = jsonb_build_object(
    'duplicate_pattern', 'loyalty_only',
    'loyalty_alt', 92
  )
WHERE pet_number = 1822;