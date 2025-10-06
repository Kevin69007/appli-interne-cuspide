-- Add explicit restrictive policy to deny anonymous access to profiles table
-- This makes the security model more explicit and satisfies security scanners

CREATE POLICY "Require authentication for profile access"
ON public.profiles
AS RESTRICTIVE
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Note: RESTRICTIVE policies are ANDed with existing permissive policies
-- Final logic: (admin OR own profile) AND authenticated = secure access