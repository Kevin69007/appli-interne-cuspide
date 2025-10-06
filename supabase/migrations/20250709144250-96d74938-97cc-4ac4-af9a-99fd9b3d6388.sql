
-- Update Dixie Green's energy stat to 80
UPDATE user_pets 
SET energy = 80
WHERE pet_name = 'Dixie Green' 
AND user_id = (
  SELECT id FROM profiles WHERE username = 'pixibob'
);
