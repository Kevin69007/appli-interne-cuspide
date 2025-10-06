
-- First, let's fix existing litter babies that have over-stats
UPDATE litter_babies 
SET 
  friendliness = CASE 
    WHEN breed = 'german shepherd' THEN LEAST(friendliness, 85)
    WHEN breed = 'golden retriever' THEN LEAST(friendliness, 95)
    WHEN breed = 'husky' THEN LEAST(friendliness, 80)
    WHEN breed = 'yellow lab' THEN LEAST(friendliness, 95)
    WHEN breed = 'chihuahua' THEN LEAST(friendliness, 70)
    WHEN breed = 'dalmatian' THEN LEAST(friendliness, 85)
    WHEN breed = 'black cat' THEN LEAST(friendliness, 75)
    WHEN breed = 'orange cat' THEN LEAST(friendliness, 85)
    WHEN breed = 'persian' THEN LEAST(friendliness, 80)
    WHEN breed = 'tuxedo cat' THEN LEAST(friendliness, 80)
    WHEN breed = 'tortie' THEN LEAST(friendliness, 65)
    ELSE LEAST(friendliness, 80)
  END,
  playfulness = CASE 
    WHEN breed = 'german shepherd' THEN LEAST(playfulness, 75)
    WHEN breed = 'golden retriever' THEN LEAST(playfulness, 90)
    WHEN breed = 'husky' THEN LEAST(playfulness, 95)
    WHEN breed = 'yellow lab' THEN LEAST(playfulness, 85)
    WHEN breed = 'chihuahua' THEN LEAST(playfulness, 85)
    WHEN breed = 'dalmatian' THEN LEAST(playfulness, 90)
    WHEN breed = 'black cat' THEN LEAST(playfulness, 90)
    WHEN breed = 'orange cat' THEN LEAST(playfulness, 90)
    WHEN breed = 'persian' THEN LEAST(playfulness, 70)
    WHEN breed = 'tuxedo cat' THEN LEAST(playfulness, 85)
    WHEN breed = 'tortie' THEN LEAST(playfulness, 80)
    ELSE LEAST(playfulness, 80)
  END,
  energy = CASE 
    WHEN breed = 'german shepherd' THEN LEAST(energy, 90)
    WHEN breed = 'golden retriever' THEN LEAST(energy, 85)
    WHEN breed = 'husky' THEN LEAST(energy, 100)
    WHEN breed = 'yellow lab' THEN LEAST(energy, 85)
    WHEN breed = 'chihuahua' THEN LEAST(energy, 80)
    WHEN breed = 'dalmatian' THEN LEAST(energy, 95)
    WHEN breed = 'black cat' THEN LEAST(energy, 85)
    WHEN breed = 'orange cat' THEN LEAST(energy, 85)
    WHEN breed = 'persian' THEN LEAST(energy, 60)
    WHEN breed = 'tuxedo cat' THEN LEAST(energy, 80)
    WHEN breed = 'tortie' THEN LEAST(energy, 85)
    ELSE LEAST(energy, 80)
  END,
  loyalty = CASE 
    WHEN breed = 'german shepherd' THEN LEAST(loyalty, 95)
    WHEN breed = 'golden retriever' THEN LEAST(loyalty, 90)
    WHEN breed = 'husky' THEN LEAST(loyalty, 80)
    WHEN breed = 'yellow lab' THEN LEAST(loyalty, 95)
    WHEN breed = 'chihuahua' THEN LEAST(loyalty, 90)
    WHEN breed = 'dalmatian' THEN LEAST(loyalty, 85)
    WHEN breed = 'black cat' THEN LEAST(loyalty, 75)
    WHEN breed = 'orange cat' THEN LEAST(loyalty, 80)
    WHEN breed = 'persian' THEN LEAST(loyalty, 85)
    WHEN breed = 'tuxedo cat' THEN LEAST(loyalty, 80)
    WHEN breed = 'tortie' THEN LEAST(loyalty, 70)
    ELSE LEAST(loyalty, 80)
  END,
  curiosity = CASE 
    WHEN breed = 'german shepherd' THEN LEAST(curiosity, 80)
    WHEN breed = 'golden retriever' THEN LEAST(curiosity, 80)
    WHEN breed = 'husky' THEN LEAST(curiosity, 90)
    WHEN breed = 'yellow lab' THEN LEAST(curiosity, 75)
    WHEN breed = 'chihuahua' THEN LEAST(curiosity, 85)
    WHEN breed = 'dalmatian' THEN LEAST(curiosity, 80)
    WHEN breed = 'black cat' THEN LEAST(curiosity, 95)
    WHEN breed = 'orange cat' THEN LEAST(curiosity, 90)
    WHEN breed = 'persian' THEN LEAST(curiosity, 80)
    WHEN breed = 'tuxedo cat' THEN LEAST(curiosity, 95)
    WHEN breed = 'tortie' THEN LEAST(curiosity, 95)
    ELSE LEAST(curiosity, 80)
  END
WHERE 
  friendliness > 100 OR playfulness > 100 OR energy > 100 OR loyalty > 100 OR curiosity > 100
  OR (breed = 'german shepherd' AND (friendliness > 85 OR playfulness > 75 OR energy > 90 OR loyalty > 95 OR curiosity > 80))
  OR (breed = 'golden retriever' AND (friendliness > 95 OR playfulness > 90 OR energy > 85 OR loyalty > 90 OR curiosity > 80))
  OR (breed = 'husky' AND (friendliness > 80 OR playfulness > 95 OR energy > 100 OR loyalty > 80 OR curiosity > 90))
  OR (breed = 'yellow lab' AND (friendliness > 95 OR playfulness > 85 OR energy > 85 OR loyalty > 95 OR curiosity > 75))
  OR (breed = 'chihuahua' AND (friendliness > 70 OR playfulness > 85 OR energy > 80 OR loyalty > 90 OR curiosity > 85))
  OR (breed = 'dalmatian' AND (friendliness > 85 OR playfulness > 90 OR energy > 95 OR loyalty > 85 OR curiosity > 80))
  OR (breed = 'black cat' AND (friendliness > 75 OR playfulness > 90 OR energy > 85 OR loyalty > 75 OR curiosity > 95))
  OR (breed = 'orange cat' AND (friendliness > 85 OR playfulness > 90 OR energy > 85 OR loyalty > 80 OR curiosity > 90))
  OR (breed = 'persian' AND (friendliness > 80 OR playfulness > 70 OR energy > 60 OR loyalty > 85 OR curiosity > 80))
  OR (breed = 'tuxedo cat' AND (friendliness > 80 OR playfulness > 85 OR energy > 80 OR loyalty > 80 OR curiosity > 95))
  OR (breed = 'tortie' AND (friendliness > 65 OR playfulness > 80 OR energy > 85 OR loyalty > 70 OR curiosity > 95));

-- Add a comment to track this fix
COMMENT ON TABLE litter_babies IS 'Fixed over-stat babies on 2025-01-13 to respect breed stat ranges';
