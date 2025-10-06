
-- Update pet 1952 to be a female Husky dog
UPDATE user_pets
SET 
  breed = 'Husky',
  gender = 'female',
  pet_id = '6d309622-0c42-43d8-8c63-35ba1d64087f'
WHERE pet_number = 1952;
