
-- First, let's clean up the invalid sale data
-- Update the sale record to have TestingAdmin as the seller to match pet ownership
UPDATE public.pet_sales 
SET seller_id = (
  SELECT user_id 
  FROM public.user_pets 
  WHERE id = pet_sales.user_pet_id
)
WHERE user_pet_id IN (
  SELECT up.id 
  FROM public.user_pets up
  JOIN public.profiles p ON p.id = up.user_id
  WHERE up.pet_name = 'Testing Purposes' AND p.username = 'TestingAdmin'
) 
AND seller_id != (
  SELECT user_id 
  FROM public.user_pets 
  WHERE id = pet_sales.user_pet_id
);

-- Add a function to validate pet sales before insertion/update
CREATE OR REPLACE FUNCTION validate_pet_sale()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the seller actually owns the pet
  IF NOT EXISTS (
    SELECT 1 FROM public.user_pets 
    WHERE id = NEW.user_pet_id AND user_id = NEW.seller_id
  ) THEN
    RAISE EXCEPTION 'Seller must own the pet to create a sale';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to prevent invalid sales
DROP TRIGGER IF EXISTS validate_pet_sale_trigger ON public.pet_sales;
CREATE TRIGGER validate_pet_sale_trigger
  BEFORE INSERT OR UPDATE ON public.pet_sales
  FOR EACH ROW
  EXECUTE FUNCTION validate_pet_sale();

-- Clean up any other invalid sales in the database
UPDATE public.pet_sales 
SET is_active = false 
WHERE id IN (
  SELECT ps.id 
  FROM public.pet_sales ps
  LEFT JOIN public.user_pets up ON ps.user_pet_id = up.id
  WHERE ps.seller_id != up.user_id AND ps.is_active = true
);
