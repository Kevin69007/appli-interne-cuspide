-- Make pet #812 (THIRTY) into an oddstat with 3 extra stats in loyalty, energy, and curiosity
UPDATE user_pets 
SET 
  is_odd_stat = true,
  extra_stats = jsonb_build_object(
    'loyalty', 95,
    'energy', 88, 
    'curiosity', 92
  )
WHERE pet_number = 812;