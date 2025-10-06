
-- Update the friendships table policy to allow public viewing
-- Remove the existing restrictive policy
DROP POLICY IF EXISTS "Users can view their friendships" ON public.friendships;

-- Create a new policy that allows anyone to view friendships
CREATE POLICY "Anyone can view friendships" 
ON public.friendships 
FOR SELECT 
USING (true);
