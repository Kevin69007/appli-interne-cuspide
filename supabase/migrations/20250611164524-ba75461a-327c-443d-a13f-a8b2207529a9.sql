
-- Add 10,000 Paw Dollars to PawAdmin account
UPDATE public.profiles 
SET paw_dollars = paw_dollars + 10000 
WHERE username = 'PawAdmin';

-- Also record this transaction for audit purposes
INSERT INTO public.pet_transactions (user_id, pet_id, paw_dollars, description)
SELECT id, id, 10000, 'Admin credit: 10,000 Paw Dollars added'
FROM public.profiles 
WHERE username = 'PawAdmin';
