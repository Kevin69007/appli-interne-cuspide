
-- Add 2500 paw points to HuGz profile
UPDATE public.profiles 
SET paw_points = paw_points + 2500
WHERE username = 'HuGz';
