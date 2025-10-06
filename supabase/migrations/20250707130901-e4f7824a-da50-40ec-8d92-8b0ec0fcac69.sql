
-- Add litter_number column to breeding_pairs table
ALTER TABLE public.breeding_pairs 
ADD COLUMN litter_number integer;

-- Create function to get next litter number
CREATE OR REPLACE FUNCTION public.get_next_litter_number()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  next_number INTEGER;
BEGIN
  -- Get the current max litter number and add 1
  SELECT COALESCE(MAX(litter_number), 0) + 1 INTO next_number
  FROM public.breeding_pairs;
  
  RETURN next_number;
END;
$$;

-- Update existing breeding pairs with sequential litter numbers
WITH ranked_pairs AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as rn
  FROM public.breeding_pairs
  WHERE litter_number IS NULL
)
UPDATE public.breeding_pairs 
SET litter_number = ranked_pairs.rn
FROM ranked_pairs
WHERE public.breeding_pairs.id = ranked_pairs.id;

-- Create trigger to auto-assign litter numbers for new breeding pairs
CREATE OR REPLACE FUNCTION public.assign_litter_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.litter_number IS NULL THEN
    NEW.litter_number = public.get_next_litter_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER assign_litter_number_trigger
  BEFORE INSERT ON public.breeding_pairs
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_litter_number();

-- Update RLS policies for nursery public access
DROP POLICY IF EXISTS "Public can view active breeding pairs for nursery" ON public.breeding_pairs;

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
    AND COALESCE(nursery_visible, true) = true
  )
);
