
-- Update Golden Retriever pets to use the working Golden Retriever image
UPDATE public.pets 
SET image_url = '/lovable-uploads/8d995196-8e52-48c7-b289-d89c7242d7d5.png'
WHERE name = 'Golden Retriever' OR name ILIKE '%golden retriever%';

-- Also update any user pets that might have the broken image URL in their pets record
UPDATE public.pets 
SET image_url = '/lovable-uploads/8d995196-8e52-48c7-b289-d89c7242d7d5.png'
WHERE id IN (
  SELECT DISTINCT pet_id 
  FROM user_pets 
  WHERE breed = 'Golden Retriever'
);

-- Verify the changes - this should show all Golden Retriever pets with the correct image
SELECT 
  up.pet_name,
  up.breed,
  p.name as pet_type_name,
  p.image_url,
  CASE 
    WHEN p.image_url = '/lovable-uploads/8d995196-8e52-48c7-b289-d89c7242d7d5.png' THEN 'CORRECT_IMAGE'
    ELSE 'WRONG_IMAGE'
  END as image_status
FROM user_pets up
JOIN pets p ON up.pet_id = p.id
WHERE up.breed = 'Golden Retriever' OR p.name = 'Golden Retriever';
