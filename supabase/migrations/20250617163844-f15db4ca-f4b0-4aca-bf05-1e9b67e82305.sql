
-- Add 4 litter licenses to all existing PawClub users
INSERT INTO public.litter_licenses (user_id, pet_id, used)
SELECT 
  profiles.id as user_id,
  NULL as pet_id,
  false as used
FROM public.profiles 
CROSS JOIN generate_series(1, 4)
WHERE profiles.pawclub_member = true
AND profiles.id NOT IN (
  SELECT user_id 
  FROM public.litter_licenses 
  WHERE user_id = profiles.id
  GROUP BY user_id 
  HAVING COUNT(*) >= 4
);
