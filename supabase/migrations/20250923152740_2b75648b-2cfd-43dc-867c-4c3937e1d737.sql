-- Fix pet #812 oddstat to ensure loyalty gets the extra stat boost
UPDATE user_pets 
SET 
  extra_stats = jsonb_build_object(
    'loyalty', 98,
    'energy', 88, 
    'curiosity', 92
  )
WHERE pet_number = 812;