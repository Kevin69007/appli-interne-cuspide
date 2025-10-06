
-- First, let's drop any existing policies and recreate them properly
DROP POLICY IF EXISTS "Users can view active pet sales" ON public.pet_sales;
DROP POLICY IF EXISTS "Users can create sales for their own pets" ON public.pet_sales;
DROP POLICY IF EXISTS "Users can update their own pet sales" ON public.pet_sales;
DROP POLICY IF EXISTS "Users can delete their own pet sales" ON public.pet_sales;

-- Enable Row Level Security on pet_sales table (this may already be enabled)
ALTER TABLE public.pet_sales ENABLE ROW LEVEL SECURITY;

-- Allow users to view all active pet sales (for browsing/purchasing)
CREATE POLICY "Users can view active pet sales" 
ON public.pet_sales 
FOR SELECT 
TO authenticated 
USING (is_active = true);

-- Allow users to insert sales only for pets they own
CREATE POLICY "Users can create sales for their own pets" 
ON public.pet_sales 
FOR INSERT 
TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_pets 
    WHERE id = user_pet_id AND user_id = auth.uid()
  )
);

-- Allow users to update only their own pet sales
CREATE POLICY "Users can update their own pet sales" 
ON public.pet_sales 
FOR UPDATE 
TO authenticated 
USING (seller_id = auth.uid())
WITH CHECK (seller_id = auth.uid());

-- Allow users to delete only their own pet sales
CREATE POLICY "Users can delete their own pet sales" 
ON public.pet_sales 
FOR DELETE 
TO authenticated 
USING (seller_id = auth.uid());
