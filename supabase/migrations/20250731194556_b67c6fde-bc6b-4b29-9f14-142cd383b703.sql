
-- Check if pet #798 was updated correctly
SELECT id, is_odd_stat, extra_stats, pet_name, breed 
FROM user_pets 
WHERE id = '798' OR pet_name ILIKE '%798%';

-- Also check if we need to update user_pets table instead of pets table
SELECT up.id, up.pet_name, up.breed, p.is_odd_stat, p.extra_stats
FROM user_pets up
LEFT JOIN pets p ON p.id = up.pet_id
WHERE up.id = '798' OR up.pet_name ILIKE '%798%';
