
-- Fix the pet transfer function to handle ownership validation correctly
CREATE OR REPLACE FUNCTION public.transfer_pet_ownership(pet_id_param uuid, seller_id_param uuid, buyer_id_param uuid, sale_price_param integer)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  result json;
  seller_balance integer;
  buyer_balance integer;
  pet_exists boolean;
  sale_exists boolean;
  actual_pet_owner uuid;
BEGIN
  -- Start transaction
  BEGIN
    -- Check if sale is still active and get the actual pet owner
    SELECT EXISTS(
      SELECT 1 FROM public.pet_sales ps
      JOIN public.user_pets up ON ps.user_pet_id = up.id
      WHERE ps.user_pet_id = pet_id_param 
      AND ps.seller_id = seller_id_param 
      AND ps.is_active = true
      FOR UPDATE
    ) INTO sale_exists;
    
    IF NOT sale_exists THEN
      RETURN json_build_object('success', false, 'error', 'Sale not found or no longer active');
    END IF;
    
    -- Get the actual pet owner
    SELECT up.user_id INTO actual_pet_owner
    FROM public.user_pets up
    JOIN public.pet_sales ps ON ps.user_pet_id = up.id
    WHERE up.id = pet_id_param 
    AND ps.seller_id = seller_id_param 
    AND ps.is_active = true
    FOR UPDATE;
    
    -- Verify the seller actually owns the pet or the sale is valid
    IF actual_pet_owner IS NULL THEN
      RETURN json_build_object('success', false, 'error', 'Pet not found');
    END IF;
    
    -- If the seller doesn't currently own the pet, but there's a valid sale, 
    -- it might be a legitimate sale scenario - check if seller created the sale
    IF actual_pet_owner != seller_id_param THEN
      -- Check if this is a valid sale created by the current owner
      SELECT EXISTS(
        SELECT 1 FROM public.pet_sales ps
        WHERE ps.user_pet_id = pet_id_param 
        AND ps.seller_id = seller_id_param
        AND ps.is_active = true
      ) INTO sale_exists;
      
      IF NOT sale_exists THEN
        RETURN json_build_object('success', false, 'error', 'Seller does not own this pet');
      END IF;
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
$function$
