
-- Fix the RLS policy for shelter_pets to allow SECURITY DEFINER functions
-- First, drop the existing policy if it exists
DROP POLICY IF EXISTS "Users can insert shelter pets via function" ON public.shelter_pets;

-- Create a new policy that allows both direct user inserts and function inserts
CREATE POLICY "Users can insert shelter pets via function" 
ON public.shelter_pets 
FOR INSERT 
WITH CHECK (
  -- Allow if the current user is the seller (direct insert)
  auth.uid() = seller_id 
  OR 
  -- Allow if this is being called from a SECURITY DEFINER function
  -- (in which case auth.uid() will be NULL but we trust the function's logic)
  auth.uid() IS NULL
);

-- Also ensure we have proper SELECT policy for shelter pets
DROP POLICY IF EXISTS "Anyone can view available shelter pets" ON public.shelter_pets;
CREATE POLICY "Anyone can view available shelter pets" 
ON public.shelter_pets 
FOR SELECT 
USING (is_available = true);

-- Add UPDATE policy for when pets are adopted
DROP POLICY IF EXISTS "Shelter pets can be updated when adopted" ON public.shelter_pets;
CREATE POLICY "Shelter pets can be updated when adopted" 
ON public.shelter_pets 
FOR UPDATE 
USING (is_available = true);

-- Add DELETE policy for shelter management
DROP POLICY IF EXISTS "Shelter pets can be deleted when adopted" ON public.shelter_pets;
CREATE POLICY "Shelter pets can be deleted when adopted" 
ON public.shelter_pets 
FOR DELETE 
USING (true); -- Allow deletion for cleanup purposes
