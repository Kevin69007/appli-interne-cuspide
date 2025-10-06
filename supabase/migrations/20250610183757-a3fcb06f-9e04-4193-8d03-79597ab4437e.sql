
-- Fix Myla's stats to be within tuxedo cat breed ranges
-- Tuxedo cat ranges: friendliness (25-80), playfulness (35-85), energy (30-80), loyalty (25-80), curiosity (45-95)
UPDATE user_pets 
SET 
  friendliness = 65,  -- was 86, now within 25-80 range
  playfulness = 78,   -- was 92, now within 35-85 range  
  energy = 72,        -- was 85, now within 30-80 range
  loyalty = 68,       -- was 89, now within 25-80 range
  curiosity = 82      -- was 91, now within 45-95 range
WHERE pet_name = 'Myla' AND breed = 'Tuxedo Cat';
