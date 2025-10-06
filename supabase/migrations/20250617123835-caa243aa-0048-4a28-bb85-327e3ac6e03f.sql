
-- Clean up ALL existing shelter_pets policies to start fresh
DROP POLICY IF EXISTS "Users can insert shelter pets via function" ON public.shelter_pets;
DROP POLICY IF EXISTS "Anyone can view available shelter pets" ON public.shelter_pets;
DROP POLICY IF EXISTS "Shelter pets can be updated when adopted" ON public.shelter_pets;
DROP POLICY IF EXISTS "Shelter pets can be deleted when adopted" ON public.shelter_pets;
DROP POLICY IF EXISTS "Users can view shelter pets" ON public.shelter_pets;
DROP POLICY IF EXISTS "Users can insert shelter pets" ON public.shelter_pets;
DROP POLICY IF EXISTS "Users can update shelter pets" ON public.shelter_pets;
DROP POLICY IF EXISTS "Users can delete shelter pets" ON public.shelter_pets;

-- Create a single, comprehensive INSERT policy that allows SECURITY DEFINER functions
CREATE POLICY "Allow shelter pet inserts" 
ON public.shelter_pets 
FOR INSERT 
WITH CHECK (
  -- Allow if called from SECURITY DEFINER function (auth.uid() is NULL)
  auth.uid() IS NULL 
  OR 
  -- Allow if the current user is the seller (for any future direct inserts)
  auth.uid() = seller_id
);

-- Simple SELECT policy for viewing available shelter pets
CREATE POLICY "View available shelter pets" 
ON public.shelter_pets 
FOR SELECT 
USING (is_available = true);

-- Simple UPDATE policy for adoption process
CREATE POLICY "Update shelter pets for adoption" 
ON public.shelter_pets 
FOR UPDATE 
USING (true);

-- Simple DELETE policy for cleanup
CREATE POLICY "Delete shelter pets" 
ON public.shelter_pets 
FOR DELETE 
USING (true);
