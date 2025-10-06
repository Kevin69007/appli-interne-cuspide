
-- Add 1000 Paw Points to all users and 10 Paw Dollars to PawClub members
UPDATE public.profiles 
SET 
  paw_points = paw_points + 1000,
  updated_at = now()
WHERE id IS NOT NULL;

-- Add 10 Paw Dollars to PawClub members only
UPDATE public.profiles 
SET 
  paw_dollars = paw_dollars + 10,
  updated_at = now()
WHERE pawclub_member = true;

-- Insert Paw Point transactions for all users (for audit trail)
INSERT INTO public.pet_transactions (user_id, pet_id, paw_points, description)
SELECT 
  p.id,
  p.id, -- Using profile id as pet_id for admin transactions
  1000,
  'Admin credit: 1000 Paw Points bonus'
FROM public.profiles p
WHERE p.id IS NOT NULL;

-- Insert Paw Dollar transactions for PawClub members (for audit trail)
INSERT INTO public.paw_dollar_transactions (user_id, amount, type, description, status)
SELECT 
  id,
  10,
  'admin_bonus',
  'Admin credit: 10 Paw Dollars (PawClub bonus)',
  'completed'
FROM public.profiles
WHERE pawclub_member = true;
