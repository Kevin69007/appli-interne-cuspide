
-- Add 250 Paw Dollars to Bumblebee's account
UPDATE public.profiles 
SET paw_dollars = paw_dollars + 250 
WHERE username = 'Bumblebee';

-- Record this transaction for audit purposes
INSERT INTO public.pet_transactions (user_id, pet_id, paw_dollars, description)
SELECT id, id, 250, 'Admin credit: 250 Paw Dollars added to account'
FROM public.profiles 
WHERE username = 'Bumblebee';
