
-- Update Lostie Golden's energy stat to -1
UPDATE user_pets 
SET energy = -1
WHERE pet_name = 'Lostie Golden' 
  AND breed = 'Golden Retriever';
