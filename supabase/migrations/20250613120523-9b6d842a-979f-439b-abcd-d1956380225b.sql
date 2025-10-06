
-- Remove the trigger that's causing paw_points to be overwritten with XP
DROP TRIGGER IF EXISTS on_xp_change ON public.profiles;

-- Remove the problematic function that overwrites paw_points with XP
DROP FUNCTION IF EXISTS public.update_paw_points();
