-- Add retroactive rewards with correct transaction types
-- Step 1: Add 6000 Paw Points to all users
UPDATE public.profiles 
SET 
  paw_points = paw_points + 6000,
  updated_at = now()
WHERE id IS NOT NULL;

-- Step 2: Add 6 care badge days to all users
UPDATE public.profiles 
SET 
  care_badge_days = COALESCE(care_badge_days, 0) + 6,
  updated_at = now()
WHERE id IS NOT NULL;

-- Step 3: Add 60 Paw Dollars to all PawClub users
UPDATE public.profiles 
SET 
  paw_dollars = paw_dollars + 60,
  updated_at = now()
WHERE pawclub_member = true;

-- Step 4: Insert Paw Points transactions for all users (for ledger)
INSERT INTO public.pet_transactions (user_id, pet_id, paw_points, description)
SELECT 
  id,
  id, -- Using user ID as pet_id for system transactions
  6000,
  'Retroactive rewards - 6000 Paw Points'
FROM public.profiles
WHERE id IS NOT NULL;

-- Step 5: Insert Paw Dollar transactions for PawClub users (for ledger) - using valid type
INSERT INTO public.paw_dollar_transactions (user_id, amount, type, description, status)
SELECT 
  id,
  60,
  'daily_bonus',
  'Retroactive rewards - 60 Paw Dollars (PawClub)',
  'completed'
FROM public.profiles
WHERE pawclub_member = true;