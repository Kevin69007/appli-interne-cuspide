
-- Update Tortie #568 to have -2 energy stat
UPDATE user_pets 
SET energy = -2
WHERE pet_name = 'Tortie' 
  AND pet_number = 568 
  AND breed = 'Tortie';
