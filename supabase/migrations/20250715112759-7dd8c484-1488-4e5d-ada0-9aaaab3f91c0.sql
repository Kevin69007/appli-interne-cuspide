
-- Credit all users for missed daily rewards (July 14th, 2025)
-- This gives everyone 1000 Paw Points and PawClub members 10 Paw Dollars

-- Step 1: Credit 1000 Paw Points to all users
UPDATE public.profiles 
SET 
  paw_points = paw_points + 1000,
  updated_at = now()
WHERE id IS NOT NULL;

-- Step 2: Credit 10 Paw Dollars to PawClub members only
UPDATE public.profiles 
SET 
  paw_dollars = paw_dollars + 10,
  updated_at = now()
WHERE pawclub_member = true;

-- Step 3: Update care badge days for all users (+1 day)
UPDATE public.profiles 
SET 
  care_badge_days = COALESCE(care_badge_days, 0) + 1,
  updated_at = now()
WHERE id IS NOT NULL;

-- Step 4: Insert Paw Points transactions for audit trail
INSERT INTO public.pet_transactions (user_id, pet_id, paw_points, description)
SELECT 
  id,
  id, -- Using user ID as pet_id for system transactions
  1000,
  'Retroactive daily reward - July 14th, 2025 - 1000 Paw Points'
FROM public.profiles
WHERE id IS NOT NULL;

-- Step 5: Insert Paw Dollar transactions for PawClub members
INSERT INTO public.paw_dollar_transactions (user_id, amount, type, description, status)
SELECT 
  id,
  10,
  'daily_bonus',
  'Retroactive PawClub daily bonus - July 14th, 2025 - 10 Paw Dollars',
  'completed'
FROM public.profiles
WHERE pawclub_member = true;

-- Step 6: Create a log entry for this retroactive reward
INSERT INTO public.daily_rewards_log (
  execution_date,
  status,
  trigger_source,
  users_processed,
  users_rewarded,
  started_at,
  completed_at
) VALUES (
  '2025-07-14',
  'completed',
  'retroactive_manual_sql',
  (SELECT COUNT(*) FROM public.profiles),
  (SELECT COUNT(*) FROM public.profiles),
  now(),
  now()
);
