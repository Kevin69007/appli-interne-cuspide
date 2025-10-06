UPDATE user_pets 
SET 
  is_odd_stat = true,
  extra_stats = jsonb_build_object(
    'duplicate_pattern', 'friendliness_energy',
    'friendliness_alt', 35,
    'energy_alt', 72
  )
WHERE pet_number = 95;