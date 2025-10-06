
-- Add 70 Paw Dollars to Xodiac account
UPDATE public.profiles 
SET paw_dollars = paw_dollars + 70 
WHERE username = 'Xodiac';

-- Also record this transaction for audit purposes using a valid type
INSERT INTO public.paw_dollar_transactions (user_id, amount, type, description)
SELECT id, 70, 'purchase', 'Admin credit: 70 Paw Dollars added to account'
FROM public.profiles 
WHERE username = 'Xodiac';
