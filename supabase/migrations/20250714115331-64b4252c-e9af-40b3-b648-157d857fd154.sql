
-- Corrected retroactive rewards migration - NO XP, focus on care badges and Paw Dollars

-- Step 1: Add 6000 Paw Points to all users (this should work)
UPDATE public.profiles 
SET 
  paw_points = paw_points + 6000,
  updated_at = now()
WHERE id IS NOT NULL;

-- Step 2: Insert Paw Points transactions for all users
INSERT INTO public.pet_transactions (user_id, pet_id, paw_points, description)
SELECT 
  id,
  id, -- Using user ID as pet_id for non-pet transactions
  6000,
  'Retroactive daily rewards - Paw Points (6 days missed rewards)'
FROM public.profiles
WHERE id IS NOT NULL;

-- Step 3: FORCE ADD 6 care badge days to ALL users (regardless of current value)
UPDATE public.profiles 
SET 
  care_badge_days = COALESCE(care_badge_days, 0) + 6,
  updated_at = now()
WHERE id IS NOT NULL;

-- Step 4: FORCE ADD 60 Paw Dollars to ALL PawClub members (regardless of existing transactions)
UPDATE public.profiles 
SET 
  paw_dollars = paw_dollars + 60,
  updated_at = now()
WHERE pawclub_member = true;

-- Step 5: Insert Paw Dollar transactions for ALL PawClub members
INSERT INTO public.paw_dollar_transactions (user_id, amount, type, description, status)
SELECT 
  id,
  60,
  'daily_bonus',
  'Retroactive PawClub daily rewards (6 days missed) - Force Fix',
  'completed'
FROM public.profiles
WHERE pawclub_member = true;
