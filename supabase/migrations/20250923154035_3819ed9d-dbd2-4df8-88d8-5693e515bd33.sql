-- Fix pet #812's extra stats: second loyalty to 85, second energy to 80
UPDATE user_pets 
SET 
  extra_stats = jsonb_build_object(
    'loyalty', 85,
    'energy', 80, 
    'curiosity', 92
  )
WHERE pet_number = 812;