
-- Fix all user_pets where breed doesn't match pet_id reference
-- Update each user_pet to use the correct pet_id that matches their breed

UPDATE user_pets up
SET pet_id = (
  SELECT p.id
  FROM pets p
  WHERE LOWER(p.name) = LOWER(up.breed)
  LIMIT 1
)
WHERE up.breed IS NOT NULL
  AND up.pet_id != (
    SELECT p.id
    FROM pets p
    WHERE LOWER(p.name) = LOWER(up.breed)
    LIMIT 1
  )
  AND EXISTS (
    SELECT 1
    FROM pets p
    WHERE LOWER(p.name) = LOWER(up.breed)
  );
