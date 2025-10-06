
-- Target Rue specifically and force her stats within Husky breed ranges
-- First, let's see current state and then fix it
UPDATE public.user_pets 
SET 
  friendliness = CASE 
    WHEN friendliness > 80 THEN 80 
    WHEN friendliness < 35 THEN 35 
    ELSE friendliness 
  END,
  playfulness = CASE 
    WHEN playfulness > 95 THEN 95 
    WHEN playfulness < 50 THEN 50 
    ELSE playfulness 
  END,
  energy = CASE 
    WHEN energy > 100 THEN 100 
    WHEN energy < 55 THEN 55 
    ELSE energy 
  END,
  loyalty = CASE 
    WHEN loyalty > 80 THEN 80 
    WHEN loyalty < 30 THEN 30 
    ELSE loyalty 
  END,
  curiosity = CASE 
    WHEN curiosity > 90 THEN 90 
    WHEN curiosity < 40 THEN 40 
    ELSE curiosity 
  END
WHERE pet_name = 'Rue' 
  AND breed = 'Husky';

-- Verify the change
SELECT 
  pet_name,
  breed,
  friendliness,
  playfulness, 
  energy,
  loyalty,
  curiosity
FROM public.user_pets 
WHERE pet_name = 'Rue' 
  AND breed = 'Husky';
