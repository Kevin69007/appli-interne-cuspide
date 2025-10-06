-- Remove the overly permissive restrictive policy that allows any authenticated user
DROP POLICY IF EXISTS "Require authentication for profile access" ON public.profiles;

-- The existing permissive policies already provide proper security:
-- 1. "Users can view own profile" - allows SELECT only for own profile
-- 2. "Admins can view all profiles" - allows all operations for admins
-- These combined ensure only profile owner OR admin can read profiles