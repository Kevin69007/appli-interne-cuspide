
-- Add 150 Paw Dollars to specified accounts as admin welcome credit
UPDATE public.profiles 
SET paw_dollars = paw_dollars + 150 
WHERE LOWER(username) IN ('purpledragonfly', 'raging_burrito', 'light', 'catdoglover', 'meouwu', 'chimera');

-- Record these transactions for audit purposes
INSERT INTO public.pet_transactions (user_id, pet_id, paw_dollars, description)
SELECT id, id, 150, 'Admin welcome credit: 150 Paw Dollars'
FROM public.profiles 
WHERE LOWER(username) IN ('purpledragonfly', 'raging_burrito', 'light', 'catdoglover', 'meouwu', 'chimera');
