-- Drop all existing SELECT policies on profiles to rebuild them properly
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Recreate with explicit, secure policies that clearly show intent
-- Policy 1: Users can ONLY view their own profile
CREATE POLICY "Users can view only their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

-- Policy 2: Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Keep the existing UPDATE policy (already secure)
-- "Users can update own profile" already restricts to auth.uid() = user_id