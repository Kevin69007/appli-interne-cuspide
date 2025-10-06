-- Move all shelter pets to profile 126's collection
INSERT INTO public.user_pets (
  user_id,
  pet_id,
  pet_name,
  breed,
  gender,
  friendliness,
  playfulness,
  energy,
  loyalty,
  curiosity,
  birthday,
  hunger,
  water,
  adopted_at,
  pet_number
)
SELECT 
  'a24e5184-6372-4975-bf61-f71e1323a499'::uuid, -- Profile 126's ID
  sp.original_pet_id,
  sp.pet_name,
  sp.breed,
  sp.gender,
  sp.friendliness,
  sp.playfulness,
  sp.energy,
  sp.loyalty,
  sp.curiosity,
  sp.birthday,
  100, -- hunger
  100, -- water
  NOW(), -- adopted_at
  sp.pet_number
FROM public.shelter_pets sp
WHERE sp.is_available = true
AND sp.original_pet_id IS NOT NULL;

-- Remove pets from shelter
UPDATE public.shelter_pets 
SET is_available = false 
WHERE is_available = true;