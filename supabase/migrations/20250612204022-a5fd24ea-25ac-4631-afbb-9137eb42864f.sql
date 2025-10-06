
-- Add 70 Paw Dollars to Xodiac account
UPDATE public.profiles 
SET paw_dollars = paw_dollars + 70 
WHERE username = 'Xodiac';

-- Also record this transaction for audit purposes
INSERT INTO public.pet_transactions (user_id, pet_id, paw_dollars, description)
SELECT id, id, 70, 'Admin credit: 70 Paw Dollars added to account'
FROM public.profiles 
WHERE username = 'Xodiac';
