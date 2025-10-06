
-- Comprehensive fix for tuxedo cat icon issue - fixed version

-- Step 1: Update all existing tuxedo cat records in the pets table to use the new consistent icon
UPDATE public.pets 
SET image_url = '/lovable-uploads/fccbb5b8-2c35-41d1-b5ea-65ed2e505252.png'
WHERE name ILIKE '%tuxedo%' OR name ILIKE '%tuxedo cat%';

-- Step 2: Insert a proper "tuxedo cat" record only if it doesn't exist
INSERT INTO public.pets (id, name, type, image_url, base_friendliness, base_playfulness, base_energy, base_loyalty, base_curiosity)
SELECT 
  gen_random_uuid(),
  'tuxedo cat',
  'cat',
  '/lovable-uploads/fccbb5b8-2c35-41d1-b5ea-65ed2e505252.png',
  75, 60, 70, 85, 80
WHERE NOT EXISTS (
  SELECT 1 FROM public.pets WHERE name = 'tuxedo cat' AND type = 'cat'
);

-- Step 3: Update Myla's pet record to reference a correct tuxedo cat base pet
UPDATE public.user_pets 
SET pet_id = (
  SELECT id FROM public.pets 
  WHERE name = 'tuxedo cat' AND type = 'cat'
  LIMIT 1
)
WHERE pet_name = 'Myla' AND breed = 'Tuxedo Cat';

-- Step 4: Also update any other user pets that have tuxedo cat breed
UPDATE public.user_pets 
SET pet_id = (
  SELECT id FROM public.pets 
  WHERE name = 'tuxedo cat' AND type = 'cat'
  LIMIT 1
)
WHERE (breed ILIKE '%tuxedo%' OR breed ILIKE '%tuxedo cat%')
AND pet_id IS DISTINCT FROM (
  SELECT id FROM public.pets 
  WHERE name = 'tuxedo cat' AND type = 'cat'
  LIMIT 1
);
