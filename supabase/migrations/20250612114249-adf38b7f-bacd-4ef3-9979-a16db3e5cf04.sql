
-- Add 150 paw dollars to all user accounts
UPDATE public.profiles 
SET paw_dollars = paw_dollars + 150;

-- Create transaction records for audit purposes
INSERT INTO public.pet_transactions (user_id, pet_id, paw_dollars, description)
SELECT 
  id, 
  id, 
  150, 
  'System credit: 150 Paw Dollars added to all accounts'
FROM public.profiles;
