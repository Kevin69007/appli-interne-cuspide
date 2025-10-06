
-- Step 1: Clean up duplicate pets and ensure we have exactly 10 pets (one per breed)
-- First, let's identify and keep only one pet per breed, removing duplicates

-- Create a temporary table to identify the pets we want to keep (one per breed)
CREATE TEMP TABLE pets_to_keep AS
WITH ranked_pets AS (
  SELECT 
    id,
    pet_name,
    breed,
    user_id,
    ROW_NUMBER() OVER (PARTITION BY breed ORDER BY adopted_at ASC) as rn
  FROM user_pets
  WHERE breed IN (
    'german shepherd', 'golden retriever', 'husky', 'yellow lab', 'chihuahua', 
    'dalmatian', 'black cat', 'orange cat', 'persian', 'tuxedo cat'
  )
)
SELECT id, pet_name, breed, user_id
FROM ranked_pets 
WHERE rn = 1;

-- Delete pets that are not in our "keep" list
DELETE FROM user_pets 
WHERE id NOT IN (SELECT id FROM pets_to_keep)
AND breed IN (
  'german shepherd', 'golden retriever', 'husky', 'yellow lab', 'chihuahua', 
  'dalmatian', 'black cat', 'orange cat', 'persian', 'tuxedo cat'
);

-- Step 2: Regenerate realistic stats for all remaining pets using proper randomization
-- This will replace maxed stats with properly varied stats within breed ranges

UPDATE user_pets 
SET 
  friendliness = CASE breed
    WHEN 'german shepherd' THEN 30 + floor(random() * 56)::int  -- 30-85 range
    WHEN 'golden retriever' THEN 50 + floor(random() * 46)::int  -- 50-95 range
    WHEN 'husky' THEN 35 + floor(random() * 46)::int  -- 35-80 range
    WHEN 'yellow lab' THEN 50 + floor(random() * 46)::int  -- 50-95 range
    WHEN 'chihuahua' THEN 10 + floor(random() * 61)::int  -- 10-70 range
    WHEN 'dalmatian' THEN 40 + floor(random() * 46)::int  -- 40-85 range
    WHEN 'black cat' THEN 15 + floor(random() * 61)::int  -- 15-75 range
    WHEN 'orange cat' THEN 30 + floor(random() * 56)::int  -- 30-85 range
    WHEN 'persian' THEN 20 + floor(random() * 61)::int  -- 20-80 range
    WHEN 'tuxedo cat' THEN 25 + floor(random() * 56)::int  -- 25-80 range
    ELSE friendliness
  END,
  playfulness = CASE breed
    WHEN 'german shepherd' THEN 20 + floor(random() * 56)::int  -- 20-75 range
    WHEN 'golden retriever' THEN 45 + floor(random() * 46)::int  -- 45-90 range
    WHEN 'husky' THEN 50 + floor(random() * 46)::int  -- 50-95 range
    WHEN 'yellow lab' THEN 40 + floor(random() * 46)::int  -- 40-85 range
    WHEN 'chihuahua' THEN 30 + floor(random() * 56)::int  -- 30-85 range
    WHEN 'dalmatian' THEN 45 + floor(random() * 46)::int  -- 45-90 range
    WHEN 'black cat' THEN 40 + floor(random() * 51)::int  -- 40-90 range
    WHEN 'orange cat' THEN 45 + floor(random() * 46)::int  -- 45-90 range
    WHEN 'persian' THEN 10 + floor(random() * 61)::int  -- 10-70 range
    WHEN 'tuxedo cat' THEN 35 + floor(random() * 51)::int  -- 35-85 range
    ELSE playfulness
  END,
  energy = CASE breed
    WHEN 'german shepherd' THEN 40 + floor(random() * 51)::int  -- 40-90 range
    WHEN 'golden retriever' THEN 35 + floor(random() * 51)::int  -- 35-85 range
    WHEN 'husky' THEN 55 + floor(random() * 46)::int  -- 55-100 range
    WHEN 'yellow lab' THEN 35 + floor(random() * 51)::int  -- 35-85 range
    WHEN 'chihuahua' THEN 25 + floor(random() * 56)::int  -- 25-80 range
    WHEN 'dalmatian' THEN 50 + floor(random() * 46)::int  -- 50-95 range
    WHEN 'black cat' THEN 30 + floor(random() * 56)::int  -- 30-85 range
    WHEN 'orange cat' THEN 35 + floor(random() * 51)::int  -- 35-85 range
    WHEN 'persian' THEN 10 + floor(random() * 51)::int  -- 10-60 range
    WHEN 'tuxedo cat' THEN 30 + floor(random() * 51)::int  -- 30-80 range
    ELSE energy
  END,
  loyalty = CASE breed
    WHEN 'german shepherd' THEN 50 + floor(random() * 46)::int  -- 50-95 range
    WHEN 'golden retriever' THEN 45 + floor(random() * 46)::int  -- 45-90 range
    WHEN 'husky' THEN 30 + floor(random() * 51)::int  -- 30-80 range
    WHEN 'yellow lab' THEN 50 + floor(random() * 46)::int  -- 50-95 range
    WHEN 'chihuahua' THEN 40 + floor(random() * 51)::int  -- 40-90 range
    WHEN 'dalmatian' THEN 35 + floor(random() * 51)::int  -- 35-85 range
    WHEN 'black cat' THEN 20 + floor(random() * 56)::int  -- 20-75 range
    WHEN 'orange cat' THEN 25 + floor(random() * 56)::int  -- 25-80 range
    WHEN 'persian' THEN 30 + floor(random() * 56)::int  -- 30-85 range
    WHEN 'tuxedo cat' THEN 25 + floor(random() * 56)::int  -- 25-80 range
    ELSE loyalty
  END,
  curiosity = CASE breed
    WHEN 'german shepherd' THEN 25 + floor(random() * 56)::int  -- 25-80 range
    WHEN 'golden retriever' THEN 30 + floor(random() * 51)::int  -- 30-80 range
    WHEN 'husky' THEN 40 + floor(random() * 51)::int  -- 40-90 range
    WHEN 'yellow lab' THEN 25 + floor(random() * 51)::int  -- 25-75 range
    WHEN 'chihuahua' THEN 35 + floor(random() * 51)::int  -- 35-85 range
    WHEN 'dalmatian' THEN 30 + floor(random() * 51)::int  -- 30-80 range
    WHEN 'black cat' THEN 50 + floor(random() * 46)::int  -- 50-95 range
    WHEN 'orange cat' THEN 40 + floor(random() * 51)::int  -- 40-90 range
    WHEN 'persian' THEN 25 + floor(random() * 56)::int  -- 25-80 range
    WHEN 'tuxedo cat' THEN 45 + floor(random() * 51)::int  -- 45-95 range
    ELSE curiosity
  END
WHERE breed IN (
  'german shepherd', 'golden retriever', 'husky', 'yellow lab', 'chihuahua', 
  'dalmatian', 'black cat', 'orange cat', 'persian', 'tuxedo cat'
);

-- Add a comment for tracking this migration
COMMENT ON TABLE user_pets IS 'Cleaned up duplicate pets and regenerated realistic stats on 2025-01-13';
