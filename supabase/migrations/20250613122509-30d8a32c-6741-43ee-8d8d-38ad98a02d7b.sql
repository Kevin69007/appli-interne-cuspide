
-- Fix critical RLS policies for user_pets table
-- Drop existing conflicting policies
DROP POLICY IF EXISTS "Users can view all pets" ON public.user_pets;
DROP POLICY IF EXISTS "Users can view own pets" ON public.user_pets;
DROP POLICY IF EXISTS "Users can update own pets" ON public.user_pets;
DROP POLICY IF EXISTS "Users can insert own pets" ON public.user_pets;
DROP POLICY IF EXISTS "Users can delete own pets" ON public.user_pets;

-- Create new comprehensive RLS policies that handle pet transfers
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

-- Allow users to update their own pets OR transfer ownership during sales
CREATE POLICY "Users can update own pets or transfer during sale" 
ON public.user_pets 
FOR UPDATE 
TO authenticated 
USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM public.pet_sales 
    WHERE user_pet_id = user_pets.id 
    AND is_active = true
  )
);

-- Allow users to delete only their own pets
CREATE POLICY "Users can delete own pets" 
ON public.user_pets 
FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- Create atomic pet transfer function
CREATE OR REPLACE FUNCTION public.transfer_pet_ownership(
  pet_id_param uuid,
  seller_id_param uuid,
  buyer_id_param uuid,
  sale_price_param integer
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
  seller_balance integer;
  buyer_balance integer;
  pet_exists boolean;
  sale_exists boolean;
BEGIN
  -- Start transaction
  BEGIN
    -- Lock the pet row to prevent concurrent modifications
    SELECT EXISTS(
      SELECT 1 FROM public.user_pets 
      WHERE id = pet_id_param AND user_id = seller_id_param
      FOR UPDATE
    ) INTO pet_exists;
    
    IF NOT pet_exists THEN
      RETURN json_build_object('success', false, 'error', 'Pet not found or not owned by seller');
    END IF;
    
    -- Check if sale is still active
    SELECT EXISTS(
      SELECT 1 FROM public.pet_sales 
      WHERE user_pet_id = pet_id_param 
      AND seller_id = seller_id_param 
      AND is_active = true
      FOR UPDATE
    ) INTO sale_exists;
    
    IF NOT sale_exists THEN
      RETURN json_build_object('success', false, 'error', 'Sale not found or no longer active');
    END IF;
    
    -- Get current balances
    SELECT paw_dollars INTO buyer_balance 
    FROM public.profiles 
    WHERE id = buyer_id_param
    FOR UPDATE;
    
    SELECT paw_dollars INTO seller_balance 
    FROM public.profiles 
    WHERE id = seller_id_param
    FOR UPDATE;
    
    -- Check buyer has enough funds
    IF buyer_balance < sale_price_param THEN
      RETURN json_build_object('success', false, 'error', 'Insufficient funds');
    END IF;
    
    -- Transfer pet ownership
    UPDATE public.user_pets 
    SET 
      user_id = buyer_id_param,
      adopted_at = now()
    WHERE id = pet_id_param;
    
    -- Deactivate sale
    UPDATE public.pet_sales 
    SET is_active = false 
    WHERE user_pet_id = pet_id_param AND seller_id = seller_id_param;
    
    -- Update buyer balance
    UPDATE public.profiles 
    SET paw_dollars = paw_dollars - sale_price_param 
    WHERE id = buyer_id_param;
    
    -- Update seller balance
    UPDATE public.profiles 
    SET paw_dollars = paw_dollars + sale_price_param 
    WHERE id = seller_id_param;
    
    -- Record transactions
    INSERT INTO public.pet_transactions (user_id, pet_id, paw_dollars, description)
    VALUES 
      (buyer_id_param, pet_id_param, -sale_price_param, 'Purchased pet from user'),
      (seller_id_param, pet_id_param, sale_price_param, 'Sold pet to user');
    
    RETURN json_build_object('success', true, 'message', 'Pet transfer completed successfully');
    
  EXCEPTION
    WHEN OTHERS THEN
      RETURN json_build_object('success', false, 'error', SQLERRM);
  END;
END;
$$;
