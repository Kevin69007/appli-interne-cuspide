
-- Create a special PetShelter profile to represent the shelter as an entity
INSERT INTO public.profiles (
  id,
  username,
  paw_dollars,
  paw_points,
  tier,
  xp,
  profile_description,
  profile_number
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'PetShelter',
  999999,
  999999,
  'bronze',
  0,
  'Official Pet Shelter - Connecting pets with loving homes',
  0
) ON CONFLICT (id) DO NOTHING;
