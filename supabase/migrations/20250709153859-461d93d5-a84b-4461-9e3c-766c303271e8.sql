
-- Fix Westie over-stats by correcting them to breed maximum values
-- Westie breed ranges: friendliness (45-85), playfulness (40-90), energy (35-80), loyalty (40-85), curiosity (50-95)

UPDATE user_pets 
SET 
  friendliness = CASE 
    WHEN friendliness > 85 THEN 85 
    ELSE friendliness 
  END,
  playfulness = CASE 
    WHEN playfulness > 90 THEN 90 
    ELSE playfulness 
  END,
  energy = CASE 
    WHEN energy > 80 THEN 80 
    ELSE energy 
  END,
  loyalty = CASE 
    WHEN loyalty > 85 THEN 85 
    ELSE loyalty 
  END,
  curiosity = CASE 
    WHEN curiosity > 95 THEN 95 
    ELSE curiosity 
  END
WHERE breed = 'Westie' 
  AND (friendliness > 85 OR playfulness > 90 OR energy > 80 OR loyalty > 85 OR curiosity > 95);

-- Also fix any Westie babies in litter_babies table
UPDATE litter_babies 
SET 
  friendliness = CASE 
    WHEN friendliness > 85 THEN 85 
    ELSE friendliness 
  END,
  playfulness = CASE 
    WHEN playfulness > 90 THEN 90 
    ELSE playfulness 
  END,
  energy = CASE 
    WHEN energy > 80 THEN 80 
    ELSE energy 
  END,
  loyalty = CASE 
    WHEN loyalty > 85 THEN 85 
    ELSE loyalty 
  END,
  curiosity = CASE 
    WHEN curiosity > 95 THEN 95 
    ELSE curiosity 
  END
WHERE breed = 'Westie' 
  AND (friendliness > 85 OR playfulness > 90 OR energy > 80 OR loyalty > 85 OR curiosity > 95);

-- Fix any Westie pets in shelter_pets table
UPDATE shelter_pets 
SET 
  friendliness = CASE 
    WHEN friendliness > 85 THEN 85 
    ELSE friendliness 
  END,
  playfulness = CASE 
    WHEN playfulness > 90 THEN 90 
    ELSE playfulness 
  END,
  energy = CASE 
    WHEN energy > 80 THEN 80 
    ELSE energy 
  END,
  loyalty = CASE 
    WHEN loyalty > 85 THEN 85 
    ELSE loyalty 
  END,
  curiosity = CASE 
    WHEN curiosity > 95 THEN 95 
    ELSE curiosity 
  END
WHERE breed = 'Westie' 
  AND (friendliness > 85 OR playfulness > 90 OR energy > 80 OR loyalty > 85 OR curiosity > 95);
