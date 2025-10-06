
-- Ensure the transfer_pet_ownership function preserves pet_number during user-to-user transfers
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
  original_pet_number integer;
BEGIN
  -- Start transaction
  BEGIN
    -- First, verify the sale exists and is active
    SELECT EXISTS(
      SELECT 1 FROM public.pet_sales ps
      WHERE ps.user_pet_id = pet_id_param 
      AND ps.seller_id = seller_id_param 
      AND ps.is_active = true
      FOR UPDATE
    ) INTO sale_exists;
    
    IF NOT sale_exists THEN
      RETURN json_build_object('success', false, 'error', 'Sale not found or no longer active');
    END IF;
    
    -- Get the actual pet owner and pet_number before any transfers
    SELECT up.user_id, up.pet_number INTO actual_pet_owner, original_pet_number
    FROM public.user_pets up
    WHERE up.id = pet_id_param 
    FOR UPDATE;
    
    -- Verify the seller actually owns the pet
    IF actual_pet_owner IS NULL THEN
      RETURN json_build_object('success', false, 'error', 'Pet not found');
    END IF;
    
    IF actual_pet_owner != seller_id_param THEN
      RETURN json_build_object('success', false, 'error', 'Seller does not own this pet');
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
    
    -- Deactivate sale BEFORE transferring ownership to avoid trigger conflicts
    UPDATE public.pet_sales 
    SET is_active = false 
    WHERE user_pet_id = pet_id_param AND seller_id = seller_id_param;
    
    -- Transfer pet ownership while preserving pet_number
    UPDATE public.user_pets 
    SET 
      user_id = buyer_id_param,
      adopted_at = now(),
      pet_number = original_pet_number  -- Explicitly preserve the pet_number
    WHERE id = pet_id_param;
    
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
    
    RETURN json_build_object('success', true, 'message', 'Pet transfer completed successfully with preserved pet number');
    
  EXCEPTION
    WHEN OTHERS THEN
      RETURN json_build_object('success', false, 'error', SQLERRM);
  END;
END;
$function$
