
-- First, let's check the exact usernames to ensure we're targeting the right accounts
-- Add 3125 Paw Dollars to leoandoreosmom's account (check both possible username formats)
UPDATE public.profiles 
SET paw_dollars = paw_dollars + 3125 
WHERE LOWER(username) = 'leoandoreosmom' OR LOWER(username) = 'leoandoreosmom';

-- Record this transaction for audit purposes
INSERT INTO public.pet_transactions (user_id, pet_id, paw_dollars, description)
SELECT id, id, 3125, 'Admin credit: 3125 Paw Dollars added to leoandoreosmom account'
FROM public.profiles 
WHERE LOWER(username) = 'leoandoreosmom' OR LOWER(username) = 'leoandoreosmom';

-- Add 1000 Paw Dollars to TestingAdmin's account (check both possible case formats)
UPDATE public.profiles 
SET paw_dollars = paw_dollars + 1000 
WHERE LOWER(username) = 'testingadmin' OR username = 'TestingAdmin';

-- Record this transaction for audit purposes
INSERT INTO public.pet_transactions (user_id, pet_id, paw_dollars, description)
SELECT id, id, 1000, 'Admin credit: 1000 Paw Dollars added to TestingAdmin account'
FROM public.profiles 
WHERE LOWER(username) = 'testingadmin' OR username = 'TestingAdmin';
