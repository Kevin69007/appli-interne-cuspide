
-- Add 150 Paw Dollars to EtherealSnailfish account
UPDATE public.profiles 
SET paw_dollars = paw_dollars + 150 
WHERE username = 'EtherealSnailfish';

-- Record this transaction for audit purposes
INSERT INTO public.paw_dollar_transactions (user_id, amount, type, description)
SELECT id, 150, 'purchase', 'Admin credit: 150 Paw Dollars added to account'
FROM public.profiles 
WHERE username = 'EtherealSnailfish';
