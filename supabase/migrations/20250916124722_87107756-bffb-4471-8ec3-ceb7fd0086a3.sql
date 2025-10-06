-- Update pet 1649's alternative curiosity stat to 90
UPDATE public.user_pets 
SET extra_stats = jsonb_set(extra_stats, '{curiosity_alt}', '90')
WHERE pet_number = 1649;