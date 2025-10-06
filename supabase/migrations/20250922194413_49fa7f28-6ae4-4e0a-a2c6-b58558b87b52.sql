-- Fix pet #1822 friendliness and playfulness to be at 96%
-- Tortie breed max: Friendliness 45, Playfulness 55
-- 96% calculations: 43, 53
UPDATE public.user_pets 
SET 
  friendliness = 43,
  playfulness = 53
WHERE pet_number = 1822;