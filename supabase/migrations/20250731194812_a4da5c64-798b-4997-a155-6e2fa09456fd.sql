
-- Check what pets actually exist in user_pets
SELECT up.id, up.pet_name, up.breed, up.pet_number, up.friendliness, up.loyalty, up.user_id
FROM user_pets up
ORDER BY up.pet_number DESC
LIMIT 10;

-- Check pets table structure and existing records
SELECT id, name, type FROM pets LIMIT 5;
