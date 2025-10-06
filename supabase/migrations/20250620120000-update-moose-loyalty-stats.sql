
-- Update Moose's loyalty stat to 60 for the duplicate display
-- This will be used as the base value, and we'll add logic to show 60 as the second loyalty value
UPDATE user_pets 
SET loyalty = 60 
WHERE pet_name = 'Moose' AND breed = 'Husky';
