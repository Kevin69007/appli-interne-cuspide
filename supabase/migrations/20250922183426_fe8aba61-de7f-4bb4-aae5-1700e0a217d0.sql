-- Update pet #1822 to make the non-duplicate stats green (higher values)
UPDATE public.user_pets 
SET 
  friendliness = 85,
  playfulness = 90
WHERE pet_number = 1822;