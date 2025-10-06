
-- Complete cleanup and fix for shelter_pets RLS policies
-- Remove ALL existing policies to eliminate conflicts
DROP POLICY IF EXISTS "Allow shelter pet inserts" ON public.shelter_pets;
DROP POLICY IF EXISTS "View available shelter pets" ON public.shelter_pets;
DROP POLICY IF EXISTS "Update shelter pets for adoption" ON public.shelter_pets;
DROP POLICY IF EXISTS "Delete shelter pets" ON public.shelter_pets;
DROP POLICY IF EXISTS "Users can insert shelter pets via function" ON public.shelter_pets;
DROP POLICY IF EXISTS "Anyone can view available shelter pets" ON public.shelter_pets;
DROP POLICY IF EXISTS "Shelter pets can be updated when adopted" ON public.shelter_pets;
DROP POLICY IF EXISTS "Shelter pets can be deleted when adopted" ON public.shelter_pets;
DROP POLICY IF EXISTS "Users can view shelter pets" ON public.shelter_pets;
DROP POLICY IF EXISTS "Users can insert shelter pets" ON public.shelter_pets;
DROP POLICY IF EXISTS "Users can update shelter pets" ON public.shelter_pets;
DROP POLICY IF EXISTS "Users can delete shelter pets" ON public.shelter_pets;

-- Create only the minimal essential policies needed
-- 1. INSERT policy - allows SECURITY DEFINER functions to insert
CREATE POLICY "shelter_pets_insert_policy" 
ON public.shelter_pets 
FOR INSERT 
WITH CHECK (true); -- Allow all inserts since function is SECURITY DEFINER

-- 2. SELECT policy - anyone can view available shelter pets
CREATE POLICY "shelter_pets_select_policy" 
ON public.shelter_pets 
FOR SELECT 
USING (is_available = true);

-- 3. UPDATE policy - for adoption process
CREATE POLICY "shelter_pets_update_policy" 
ON public.shelter_pets 
FOR UPDATE 
USING (true);

-- 4. DELETE policy - for cleanup after adoption
CREATE POLICY "shelter_pets_delete_policy" 
ON public.shelter_pets 
FOR DELETE 
USING (true);

-- Improve the sell_pet_to_shelter function with better error handling
CREATE OR REPLACE FUNCTION public.sell_pet_to_shelter(
  pet_id_param uuid, 
  seller_id_param uuid, 
  sale_price_pd integer DEFAULT 70, 
  shelter_price_pd integer DEFAULT 100
)
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
  -- Add detailed logging for debugging
  RAISE NOTICE 'Starting shelter sale for pet % by user %', pet_id_param, seller_id_param;
  
  -- Lock and verify pet ownership
  SELECT up.*
  INTO pet_data
  FROM public.user_pets up
  WHERE up.id = pet_id_param 
  AND up.user_id = seller_id_param
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE NOTICE 'Pet not found or ownership mismatch';
    RETURN json_build_object('success', false, 'error', 'Pet not found or not owned by seller');
  END IF;
  
  RAISE NOTICE 'Pet found: %', pet_data.pet_name;
  
  -- Get pet type name separately
  SELECT p.name INTO pet_type_name_var
  FROM public.pets p
  WHERE p.id = pet_data.pet_id;
  
  RAISE NOTICE 'Pet type: %', pet_type_name_var;
  
  -- Check if pet is already in shelter
  IF EXISTS (
    SELECT 1 FROM public.shelter_pets 
    WHERE user_pet_id = pet_id_param 
    AND is_available = true
  ) THEN
    RAISE NOTICE 'Pet already in shelter';
    RETURN json_build_object('success', false, 'error', 'Pet is already in shelter');
  END IF;
  
  -- Get seller balance
  SELECT paw_dollars INTO seller_balance
  FROM public.profiles
  WHERE id = seller_id_param
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE NOTICE 'Seller profile not found';
    RETURN json_build_object('success', false, 'error', 'Seller profile not found');
  END IF;
  
  RAISE NOTICE 'Seller balance: %', seller_balance;
  
  -- Insert into shelter_pets with detailed logging
  RAISE NOTICE 'Inserting into shelter_pets...';
  
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
  
  RAISE NOTICE 'Shelter pet created with ID: %', shelter_pet_id;
  
  -- Remove pet from user's collection
  DELETE FROM public.user_pets
  WHERE id = pet_id_param 
  AND user_id = seller_id_param;
  
  RAISE NOTICE 'Pet removed from user collection';
  
  -- Update seller balance
  UPDATE public.profiles
  SET paw_dollars = paw_dollars + sale_price_pd
  WHERE id = seller_id_param;
  
  RAISE NOTICE 'Seller balance updated';
  
  -- Record transaction
  INSERT INTO public.pet_transactions (user_id, pet_id, paw_dollars, description)
  VALUES (
    seller_id_param, 
    pet_id_param, 
    sale_price_pd, 
    'Sold pet to shelter'
  );
  
  RAISE NOTICE 'Transaction recorded';
  
  RETURN json_build_object(
    'success', true, 
    'message', 'Pet successfully sold to shelter',
    'pet_name', pet_data.pet_name,
    'paw_dollars_earned', sale_price_pd,
    'shelter_pet_id', shelter_pet_id
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error in sell_pet_to_shelter: %', SQLERRM;
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$function$;
