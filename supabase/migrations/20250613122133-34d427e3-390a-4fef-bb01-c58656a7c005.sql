
-- Add 1000 Paw Dollars to testingadmin's account
UPDATE public.profiles 
SET paw_dollars = paw_dollars + 1000 
WHERE username = 'testingadmin';

-- Record this transaction for audit purposes
INSERT INTO public.pet_transactions (user_id, pet_id, paw_dollars, description)
SELECT id, id, 1000, 'Admin credit: 1000 Paw Dollars added to account'
FROM public.profiles 
WHERE username = 'testingadmin';
