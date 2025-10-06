
-- Update all tuxedo cat records in the pets table to use the new consistent icon
UPDATE public.pets 
SET image_url = '/lovable-uploads/fccbb5b8-2c35-41d1-b5ea-65ed2e505252.png'
WHERE name ILIKE '%tuxedo%' OR name ILIKE '%tuxedo cat%';
