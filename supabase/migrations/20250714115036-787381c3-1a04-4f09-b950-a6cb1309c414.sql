
-- New migration to complete the retroactive rewards with Paw Points
-- and fix any missing care badge days or Paw Dollars

-- Step 1: Add 6000 Paw Points to all users
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

-- Step 3: Ensure care badge days are properly added (in case previous migration didn't work)
-- This will only add if the user doesn't already have the retroactive care badge days
UPDATE public.profiles 
SET 
  care_badge_days = care_badge_days + 6,
  updated_at = now()
WHERE id IS NOT NULL 
  AND (care_badge_days IS NULL OR care_badge_days < 6);

-- Step 4: Ensure PawClub members get their Paw Dollars (in case previous migration didn't work)
-- Check if they already have the retroactive PD transactions
UPDATE public.profiles 
SET 
  paw_dollars = paw_dollars + 60,
  updated_at = now()
WHERE pawclub_member = true 
  AND id NOT IN (
    SELECT user_id 
    FROM public.paw_dollar_transactions 
    WHERE description LIKE '%Retroactive PawClub daily rewards%'
  );

-- Step 5: Insert missing Paw Dollar transactions for PawClub members
INSERT INTO public.paw_dollar_transactions (user_id, amount, type, description, status)
SELECT 
  id,
  60,
  'daily_bonus',
  'Retroactive PawClub daily rewards (6 days missed) - Fixed',
  'completed'
FROM public.profiles
WHERE pawclub_member = true 
  AND id NOT IN (
    SELECT user_id 
    FROM public.paw_dollar_transactions 
    WHERE description LIKE '%Retroactive PawClub daily rewards%'
  );
