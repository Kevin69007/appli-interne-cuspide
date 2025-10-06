
-- Add 200 Paw Dollars to MistressKitty's account
UPDATE public.profiles 
SET paw_dollars = paw_dollars + 200 
WHERE username = 'MistressKitty';

-- Record this transaction for audit purposes
INSERT INTO public.pet_transactions (user_id, pet_id, paw_dollars, description)
SELECT id, id, 200, 'Admin credit: 200 Paw Dollars added to account'
FROM public.profiles 
WHERE username = 'MistressKitty';
