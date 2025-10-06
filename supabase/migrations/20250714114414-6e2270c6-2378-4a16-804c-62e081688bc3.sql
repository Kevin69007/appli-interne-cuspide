
-- Retroactive Rewards Implementation - Credit all users with 6 days of missed rewards

-- Step 1: Update all user profiles with retroactive rewards
UPDATE public.profiles 
SET 
  xp = xp + 6000,
  care_badge_days = care_badge_days + 6,
  paw_dollars = CASE 
    WHEN pawclub_member = true THEN paw_dollars + 60
    ELSE paw_dollars
  END,
  updated_at = now()
WHERE id IS NOT NULL;

-- Step 2: Insert XP transactions for all users (6000 XP each)
INSERT INTO public.xp_transactions (user_id, xp_amount, activity_type, description)
SELECT 
  id,
  6000,
  'retroactive_daily_rewards',
  'Retroactive daily rewards (6 days missed rewards)'
FROM public.profiles
WHERE id IS NOT NULL;

-- Step 3: Insert Paw Dollar transactions for PawClub members (60 PD each)
INSERT INTO public.paw_dollar_transactions (user_id, amount, type, description, status)
SELECT 
  id,
  60,
  'daily_bonus',
  'Retroactive PawClub daily rewards (6 days missed)',
  'completed'
FROM public.profiles
WHERE pawclub_member = true;

-- Step 4: Update the recordTransaction utility to prevent duplicate processing
-- Insert a marker transaction to indicate bulk retroactive rewards have been processed
INSERT INTO public.paw_dollar_transactions (user_id, amount, type, description, status)
VALUES (
  (SELECT id FROM public.profiles LIMIT 1),
  0,
  'system_marker',
  'BULK_RETROACTIVE_REWARDS_2025_COMPLETED',
  'completed'
);
