
-- Create RLS policy for public nursery viewing
CREATE POLICY "Public can view active breeding pairs for nursery" 
ON public.breeding_pairs 
FOR SELECT 
USING (
  is_born = true 
  AND NOT is_completed 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = breeding_pairs.user_id 
    AND NOT COALESCE(is_banned, false)
  )
);

-- Add nursery visibility setting to profiles (optional privacy control)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS nursery_visible boolean DEFAULT true;

-- Create policy for nursery visibility
CREATE POLICY "Respect nursery privacy settings"
ON public.breeding_pairs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = breeding_pairs.user_id 
    AND nursery_visible = true
  ) OR auth.uid() = user_id
);
