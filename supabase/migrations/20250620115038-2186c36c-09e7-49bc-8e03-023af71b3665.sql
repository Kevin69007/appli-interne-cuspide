
-- Add target_username column to pet_sales table for private user-specific sales
ALTER TABLE public.pet_sales 
ADD COLUMN target_username text;

-- Add index for better performance when looking up sales by target username
CREATE INDEX idx_pet_sales_target_username ON public.pet_sales(target_username) WHERE target_username IS NOT NULL;

-- Update the RLS policy to allow users to view sales targeted at them
DROP POLICY IF EXISTS "Users can view active pet sales" ON public.pet_sales;

CREATE POLICY "Users can view active pet sales" 
ON public.pet_sales 
FOR SELECT 
TO authenticated 
USING (
  is_active = true AND (
    target_username IS NULL OR  -- Public sales
    target_username = (SELECT username FROM public.profiles WHERE id = auth.uid()) -- Private sales for this user
  )
);
