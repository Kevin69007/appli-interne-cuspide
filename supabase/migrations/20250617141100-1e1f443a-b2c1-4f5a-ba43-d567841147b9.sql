
-- Modify the assign_pet_number function to preserve existing pet numbers
CREATE OR REPLACE FUNCTION public.assign_pet_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only assign a new pet number if one isn't already provided
  -- This preserves pet numbers during shelter adoptions and user transfers
  IF NEW.pet_number IS NULL OR NEW.pet_number = 0 THEN
    NEW.pet_number = public.get_next_pet_number();
  END IF;
  
  RETURN NEW;
END;
$$;
