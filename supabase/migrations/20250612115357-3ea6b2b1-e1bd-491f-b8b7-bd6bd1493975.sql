
-- Add 10,000 XP to the PawAdmin account specifically
UPDATE public.profiles 
SET xp = xp + 10000,
    updated_at = now()
WHERE username = 'PawAdmin';
