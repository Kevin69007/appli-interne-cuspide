
-- Find pets that might be the one we want to update
SELECT up.id, up.pet_name, up.breed, up.pet_number, p.id as pet_type_id, p.name as pet_type_name
FROM user_pets up
JOIN pets p ON p.id = up.pet_id
WHERE up.pet_name ILIKE '%798%' 
   OR up.pet_number = 798
   OR up.breed ILIKE '%special%'
   OR up.breed ILIKE '%odd%'
ORDER BY up.pet_number DESC
LIMIT 10;

-- Also check what pets table records exist that might be relevant
SELECT id, name, is_odd_stat, extra_stats
FROM pets 
WHERE is_odd_stat = true OR extra_stats IS NOT NULL
LIMIT 10;
