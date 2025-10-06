
-- Add additional 3125 Paw Dollars to leoandoreosmom's account
UPDATE public.profiles 
SET paw_dollars = paw_dollars + 3125 
WHERE username = 'leoandoreosmom';

-- Record this transaction for audit purposes
INSERT INTO public.pet_transactions (user_id, pet_id, paw_dollars, description)
SELECT id, id, 3125, 'Admin credit: Additional 3125 Paw Dollars added to account'
FROM public.profiles 
WHERE username = 'leoandoreosmom';

-- Add 450 Paw Dollars to cricketfops account
UPDATE public.profiles 
SET paw_dollars = paw_dollars + 450 
WHERE username = 'cricketfops';

-- Record this transaction for audit purposes
INSERT INTO public.pet_transactions (user_id, pet_id, paw_dollars, description)
SELECT id, id, 450, 'Admin credit: 450 Paw Dollars added to account'
FROM public.profiles 
WHERE username = 'cricketfops';

-- Add additional 200 Paw Dollars to Bumblebee's account
UPDATE public.profiles 
SET paw_dollars = paw_dollars + 200 
WHERE username = 'Bumblebee';

-- Record this transaction for audit purposes
INSERT INTO public.pet_transactions (user_id, pet_id, paw_dollars, description)
SELECT id, id, 200, 'Admin credit: Additional 200 Paw Dollars added to account'
FROM public.profiles 
WHERE username = 'Bumblebee';
