
-- Enable RLS on user_pets table if not already enabled
ALTER TABLE public.user_pets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view all pets" ON public.user_pets;
DROP POLICY IF EXISTS "Users can view own pets" ON public.user_pets;
DROP POLICY IF EXISTS "Users can update own pets" ON public.user_pets;
DROP POLICY IF EXISTS "Users can insert own pets" ON public.user_pets;
DROP POLICY IF EXISTS "Users can delete own pets" ON public.user_pets;

-- Allow all authenticated users to view all pets (public read access)
CREATE POLICY "Users can view all pets" 
ON public.user_pets 
FOR SELECT 
TO authenticated 
USING (true);

-- Allow users to insert only their own pets
CREATE POLICY "Users can insert own pets" 
ON public.user_pets 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Allow users to update only their own pets
CREATE POLICY "Users can update own pets" 
ON public.user_pets 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id);

-- Allow users to delete only their own pets
CREATE POLICY "Users can delete own pets" 
ON public.user_pets 
FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);
