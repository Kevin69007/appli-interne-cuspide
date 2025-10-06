-- Add restrictive policy to deny anonymous read access to test_results table
-- This protects candidate personal information and test scores

CREATE POLICY "Require authentication for test results read"
ON public.test_results
AS RESTRICTIVE
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Note: This maintains existing INSERT policy for public submissions
-- but blocks anonymous users from reading sensitive candidate data