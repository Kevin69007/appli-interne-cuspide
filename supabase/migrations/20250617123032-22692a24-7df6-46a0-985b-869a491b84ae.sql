
-- Fix the sell_pet_to_shelter function with proper transaction handling and debugging
CREATE OR REPLACE FUNCTION public.sell_pet_to_shelter(pet_id_param uuid, seller_id_param uuid, sale_price_pd integer DEFAULT 70, shelter_price_pd integer DEFAULT 100)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  pet_data record;
  pet_type_name_var text;
  seller_balance integer;
  shelter_pet_id uuid;
  result json;
BEGIN
  -- Lock and verify pet ownership
  SELECT up.*
  INTO pet_data
  FROM public.user_pets up
  WHERE up.id = pet_id_param 
  AND up.user_id = seller_id_param
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Pet not found or not owned by seller');
  END IF;
  
  -- Get pet type name separately into a variable
  SELECT p.name INTO pet_type_name_var
  FROM public.pets p
  WHERE p.id = pet_data.pet_id;
  
  -- Check if pet is already in shelter
  IF EXISTS (
    SELECT 1 FROM public.shelter_pets 
    WHERE user_pet_id = pet_id_param 
    AND is_available = true
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Pet is already in shelter');
  END IF;
  
  -- Get seller balance
  SELECT paw_dollars INTO seller_balance
  FROM public.profiles
  WHERE id = seller_id_param
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Seller profile not found');
  END IF;
  
  -- Insert into shelter_pets with all required data including original_pet_id
  INSERT INTO public.shelter_pets (
    user_pet_id,
    seller_id,
    price_nd,
    description,
    is_available,
    pet_name,
    breed,
    gender,
    friendliness,
    playfulness,
    energy,
    loyalty,
    curiosity,
    pet_type,
    original_pet_id,
    listed_at,
    last_fed
  ) VALUES (
    pet_data.id,
    seller_id_param,
    shelter_price_pd,
    COALESCE('A lovely ' || pet_data.pet_name || ' looking for a new home', 'Looking for a loving home'),
    true,
    pet_data.pet_name,
    COALESCE(pet_data.breed, 'Mixed Breed'),
    COALESCE(pet_data.gender, 'Unknown'),
    pet_data.friendliness,
    pet_data.playfulness,
    pet_data.energy,
    pet_data.loyalty,
    pet_data.curiosity,
    COALESCE(pet_type_name_var, pet_data.breed, 'Pet'),
    pet_data.pet_id,
    now(),
    now()
  ) RETURNING id INTO shelter_pet_id;
  
  -- Remove pet from user's collection
  DELETE FROM public.user_pets
  WHERE id = pet_id_param 
  AND user_id = seller_id_param;
  
  -- Update seller balance
  UPDATE public.profiles
  SET paw_dollars = paw_dollars + sale_price_pd
  WHERE id = seller_id_param;
  
  -- Record transaction
  INSERT INTO public.pet_transactions (user_id, pet_id, paw_dollars, description)
  VALUES (
    seller_id_param, 
    pet_id_param, 
    sale_price_pd, 
    'Sold pet to shelter'
  );
  
  RETURN json_build_object(
    'success', true, 
    'message', 'Pet successfully sold to shelter',
    'pet_name', pet_data.pet_name,
    'paw_dollars_earned', sale_price_pd,
    'shelter_pet_id', shelter_pet_id
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$function$
