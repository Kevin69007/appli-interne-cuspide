
-- Reset MistressKitty's daily XP and update her last XP date
UPDATE public.profiles 
SET 
  daily_xp = 0,
  last_xp_date = CURRENT_DATE
WHERE username = 'MistressKitty';

-- Verify the update
SELECT username, daily_xp, last_xp_date, xp 
FROM public.profiles 
WHERE username = 'MistressKitty';
