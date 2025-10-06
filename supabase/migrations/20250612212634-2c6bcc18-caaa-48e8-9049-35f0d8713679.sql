
-- Add 2000 Paw Points to Bumblebee account
UPDATE public.profiles 
SET paw_points = paw_points + 2000 
WHERE username = 'Bumblebee';

-- Also record this transaction for audit purposes
INSERT INTO public.pet_transactions (user_id, pet_id, paw_points, description)
SELECT id, id, 2000, 'Admin credit: 2000 Paw Points added to account'
FROM public.profiles 
WHERE username = 'Bumblebee';
