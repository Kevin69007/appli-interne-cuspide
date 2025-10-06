
-- Add 450 Paw Dollars to CricketFops account (using case-insensitive matching)
UPDATE public.profiles 
SET paw_dollars = paw_dollars + 450 
WHERE LOWER(username) = 'cricketfops';

-- Record this transaction for audit purposes
INSERT INTO public.pet_transactions (user_id, pet_id, paw_dollars, description)
SELECT id, id, 450, 'Admin credit: 450 Paw Dollars added to CricketFops account'
FROM public.profiles 
WHERE LOWER(username) = 'cricketfops';
