-- Remove oddstat pattern from pet 1822 and set 3/5 green stats
UPDATE user_pets 
SET 
  friendliness = 45,  -- not green
  playfulness = 50,   -- not green  
  energy = 70,        -- green
  loyalty = 65,       -- green
  curiosity = 75,     -- green
  extra_stats = NULL,  -- remove duplicate pattern
  is_odd_stat = false
WHERE pet_number = 1822;