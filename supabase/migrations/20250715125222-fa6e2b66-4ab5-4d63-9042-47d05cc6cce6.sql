
-- Update all users' care badge days to 36
UPDATE public.profiles 
SET 
  care_badge_days = 36,
  updated_at = now()
WHERE id IS NOT NULL;
