
-- Add 20 Paw Dollars to Xodiac's account as a gift from Bumblebee
UPDATE public.profiles 
SET paw_dollars = paw_dollars + 20 
WHERE username = 'Xodiac';

-- Record this transaction for audit purposes
INSERT INTO public.pet_transactions (user_id, pet_id, paw_dollars, description)
SELECT id, id, 20, 'Gift from Bumblebee: 20 Paw Dollars'
FROM public.profiles 
WHERE username = 'Xodiac';
