
-- Fix Sai's pet record to have the correct Tuxedo Cat image
UPDATE public.pets 
SET 
  name = 'Tuxedo Cat',
  image_url = '/lovable-uploads/b19e1fc9-97be-4767-985d-07ddf53f1002.png'
WHERE id IN (
  SELECT DISTINCT pet_id 
  FROM user_pets 
  WHERE pet_name = 'Sai' 
    AND breed = 'Tuxedo Cat'
);

-- Comprehensive fix to ensure ALL pets have correct breed-matching images
UPDATE public.pets 
SET 
  name = user_pets.breed,
  image_url = CASE 
    WHEN LOWER(user_pets.breed) = 'german shepherd' THEN '/lovable-uploads/21ce7e7c-282c-4c83-ab6a-c701a7197077.png'
    WHEN LOWER(user_pets.breed) = 'golden retriever' THEN '/lovable-uploads/f048abef-27e6-4a1b-aa2c-9ba11a4293c0.png'
    WHEN LOWER(user_pets.breed) = 'husky' THEN '/lovable-uploads/ca24ff23-a1c6-4913-90e0-83f85212dcb2.png'
    WHEN LOWER(user_pets.breed) = 'yellow lab' THEN '/lovable-uploads/6cee5c22-dcd5-4727-8e35-8445ed6364e8.png'
    WHEN LOWER(user_pets.breed) = 'chihuahua' THEN '/lovable-uploads/0ea8e7b2-2c1c-4b3b-beb1-b47027536d35.png'
    WHEN LOWER(user_pets.breed) = 'dalmatian' THEN '/lovable-uploads/526b5e41-8093-4dcc-b5dc-d71759bbbda5.png'
    WHEN LOWER(user_pets.breed) = 'black cat' THEN '/lovable-uploads/1e202ef9-ddac-4379-b292-a45057e2505e.png'
    WHEN LOWER(user_pets.breed) = 'orange cat' THEN '/lovable-uploads/db2f35ce-1472-44ca-9166-ba693a2e3008.png'
    WHEN LOWER(user_pets.breed) = 'persian' THEN '/lovable-uploads/2bdde684-a5ff-46df-bf3f-8cf29aeca7c7.png'
    WHEN LOWER(user_pets.breed) = 'tuxedo cat' THEN '/lovable-uploads/b19e1fc9-97be-4767-985d-07ddf53f1002.png'
    ELSE pets.image_url
  END
FROM public.user_pets 
WHERE pets.id = user_pets.pet_id 
  AND user_pets.breed IS NOT NULL 
  AND user_pets.breed != '';

-- Verification query to check all pets now have correct breed-matching images
SELECT 
  up.pet_name,
  up.breed,
  p.name as pet_type_name,
  p.image_url,
  CASE 
    WHEN up.breed = 'German Shepherd' AND p.image_url = '/lovable-uploads/21ce7e7c-282c-4c83-ab6a-c701a7197077.png' THEN 'CORRECT'
    WHEN up.breed = 'Golden Retriever' AND p.image_url = '/lovable-uploads/f048abef-27e6-4a1b-aa2c-9ba11a4293c0.png' THEN 'CORRECT'
    WHEN up.breed = 'Husky' AND p.image_url = '/lovable-uploads/ca24ff23-a1c6-4913-90e0-83f85212dcb2.png' THEN 'CORRECT'
    WHEN up.breed = 'Yellow Lab' AND p.image_url = '/lovable-uploads/6cee5c22-dcd5-4727-8e35-8445ed6364e8.png' THEN 'CORRECT'
    WHEN up.breed = 'Chihuahua' AND p.image_url = '/lovable-uploads/0ea8e7b2-2c1c-4b3b-beb1-b47027536d35.png' THEN 'CORRECT'
    WHEN up.breed = 'Dalmatian' AND p.image_url = '/lovable-uploads/526b5e41-8093-4dcc-b5dc-d71759bbbda5.png' THEN 'CORRECT'
    WHEN up.breed = 'Black Cat' AND p.image_url = '/lovable-uploads/1e202ef9-ddac-4379-b292-a45057e2505e.png' THEN 'CORRECT'
    WHEN up.breed = 'Orange Cat' AND p.image_url = '/lovable-uploads/db2f35ce-1472-44ca-9166-ba693a2e3008.png' THEN 'CORRECT'
    WHEN up.breed = 'Persian' AND p.image_url = '/lovable-uploads/2bdde684-a5ff-46df-bf3f-8cf29aeca7c7.png' THEN 'CORRECT'
    WHEN up.breed = 'Tuxedo Cat' AND p.image_url = '/lovable-uploads/b19e1fc9-97be-4767-985d-07ddf53f1002.png' THEN 'CORRECT'
    ELSE 'MISMATCH'
  END as status
FROM user_pets up
JOIN pets p ON up.pet_id = p.id
WHERE up.breed IS NOT NULL
ORDER BY up.pet_name;
