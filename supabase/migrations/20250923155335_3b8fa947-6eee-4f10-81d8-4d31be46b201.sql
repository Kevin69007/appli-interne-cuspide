-- Transfer all shelter pets to account with profile number 126
UPDATE public.shelter_pets 
SET seller_id = (
  SELECT id 
  FROM public.profiles 
  WHERE profile_number = 126 
  LIMIT 1
)
WHERE is_available = true;